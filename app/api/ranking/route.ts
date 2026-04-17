import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/session";
import { getServiceClient } from "@/lib/supabase";
import { isPublicRankingEnabled, isRankingEnabled } from "@/lib/featureFlags";
import { checkRateLimit, getClientIp, hashIp } from "@/lib/rateLimit";
import { submitRankingSchema } from "@/lib/validation";
import { QUESTIONS_PER_MATCH, type RankingEntry } from "@/types/quiz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isRankingEnabled()) {
    return NextResponse.json(
      { error: "Ranking não está configurado neste ambiente." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = submitRankingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  let payload;
  try {
    payload = await verifySession(parsed.data.token);
  } catch {
    return NextResponse.json({ error: "Sessão inválida ou expirada" }, { status: 401 });
  }

  const matchFinished = payload.index >= QUESTIONS_PER_MATCH || payload.lives <= 0;
  if (!matchFinished) {
    return NextResponse.json(
      { error: "Partida incompleta. Finalize a partida antes de enviar." },
      { status: 400 }
    );
  }

  const ipHash = hashIp(getClientIp(req));
  const rate = await checkRateLimit(ipHash);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Limite de submissões por hora atingido. Tente mais tarde." },
      { status: 429 }
    );
  }

  const supabase = getServiceClient();
  const insert = await supabase
    .from("rankings")
    .insert({
      nickname: parsed.data.nickname.trim(),
      score: payload.score,
      correct_count: payload.correctCount,
      session_id: payload.sid,
      ip_hash: ipHash,
    })
    .select("id, nickname, score, correct_count, session_id, created_at")
    .single();

  if (insert.error) {
    if (insert.error.code === "23505") {
      return NextResponse.json(
        { error: "Esta partida já foi enviada ao ranking." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: insert.error.message }, { status: 500 });
  }

  // Global rank: count strictly higher scores, plus same-score entries that
  // sort earlier by created_at asc (the ranking order used by GET).
  const [higher, sameEarlier] = await Promise.all([
    supabase
      .from("rankings")
      .select("id", { count: "exact", head: true })
      .gt("score", payload.score),
    supabase
      .from("rankings")
      .select("id", { count: "exact", head: true })
      .eq("score", payload.score)
      .lt("created_at", insert.data.created_at),
  ]);

  const rank =
    higher.count != null && sameEarlier.count != null
      ? higher.count + sameEarlier.count + 1
      : null;

  const entry: RankingEntry = {
    id: insert.data.id,
    nickname: insert.data.nickname,
    score: insert.data.score,
    correctCount: insert.data.correct_count,
    createdAt: insert.data.created_at,
  };

  return NextResponse.json({ ok: true, entry, rank });
}

export async function GET() {
  if (!isPublicRankingEnabled()) {
    return NextResponse.json({ entries: [], disabled: true }, { status: 200 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("rankings")
    .select("id, nickname, score, correct_count, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const entries: RankingEntry[] = (data ?? []).map((r) => ({
    id: r.id,
    nickname: r.nickname,
    score: r.score,
    correctCount: r.correct_count,
    createdAt: r.created_at,
  }));

  return NextResponse.json(
    { entries },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
