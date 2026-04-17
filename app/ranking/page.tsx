import Link from "next/link";
import { Container } from "@/components/Container";
import { HighlightedRanking } from "@/components/ranking/HighlightedRanking";
import { isPublicRankingEnabled } from "@/lib/featureFlags";
import { getServiceClient } from "@/lib/supabase";
import type { RankingEntry } from "@/types/quiz";

export const revalidate = 30;

export const metadata = {
  title: "Ranking",
  description: "Top 50 jogadores do Claude Code Quiz, ordenados por pontuação.",
};

async function fetchTop50(): Promise<{ entries: RankingEntry[]; disabled: boolean }> {
  if (!isPublicRankingEnabled()) {
    return { entries: [], disabled: true };
  }
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("rankings")
      .select("id, nickname, score, correct_count, created_at")
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) throw error;
    return {
      disabled: false,
      entries: (data ?? []).map((r) => ({
        id: r.id,
        nickname: r.nickname,
        score: r.score,
        correctCount: r.correct_count,
        createdAt: r.created_at,
      })),
    };
  } catch {
    return { entries: [], disabled: true };
  }
}

export default async function RankingPage() {
  const { entries, disabled } = await fetchTop50();

  return (
    <main className="py-12">
      <Container className="space-y-8">
        <header className="space-y-3">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-accent hover:underline"
          >
            ← Início
          </Link>
          <div className="flex items-end justify-between gap-4">
            <h1 className="text-4xl font-semibold">Ranking Global</h1>
            <Link
              href="/quiz"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg-base"
            >
              Jogar
            </Link>
          </div>
          <p className="text-fg-muted">Top 50 pontuações de todos os tempos.</p>
        </header>

        {disabled ? (
          <p className="rounded-2xl border border-border-subtle bg-bg-card p-6 text-fg-muted">
            O ranking global ainda não está configurado neste ambiente. Variáveis do Supabase
            ausentes — partidas só podem ser jogadas localmente até a configuração.
          </p>
        ) : (
          <HighlightedRanking entries={entries} />
        )}
      </Container>
    </main>
  );
}
