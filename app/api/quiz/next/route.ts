import { NextResponse, type NextRequest } from "next/server";
import { signSession, verifySession } from "@/lib/session";
import { nextRequestSchema } from "@/lib/validation";
import { QUESTIONS_PER_MATCH, type QuizNextResponse } from "@/types/quiz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = nextRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let payload;
  try {
    payload = await verifySession(parsed.data.token);
  } catch {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  if (payload.index >= QUESTIONS_PER_MATCH) {
    return NextResponse.json({ error: "Match already complete" }, { status: 409 });
  }

  if (payload.lives <= 0) {
    return NextResponse.json({ error: "Partida encerrada: sem vidas." }, { status: 409 });
  }

  if (payload.questionStartedAt != null) {
    return NextResponse.json(
      { error: "Current question timer is still running." },
      { status: 409 }
    );
  }

  const nextToken = await signSession({
    sid: payload.sid,
    qids: payload.qids,
    index: payload.index,
    score: payload.score,
    streak: payload.streak,
    streakMax: payload.streakMax,
    correctCount: payload.correctCount,
    lives: payload.lives,
    correctSinceLastLife: payload.correctSinceLastLife,
    answers: payload.answers,
    questionStartedAt: Date.now(),
  });

  const response: QuizNextResponse = { token: nextToken };
  return NextResponse.json(response);
}
