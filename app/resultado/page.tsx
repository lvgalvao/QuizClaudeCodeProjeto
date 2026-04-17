"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Container } from "@/components/Container";
import { NicknameForm } from "@/components/ranking/NicknameForm";
import { useGameStore } from "@/lib/store";
import { QUESTIONS_PER_MATCH } from "@/types/quiz";

export default function ResultadoPage() {
  const router = useRouter();
  const finished = useGameStore((s) => s.finished);
  const answers = useGameStore((s) => s.answers);
  const score = useGameStore((s) => s.score);
  const gameOver = useGameStore((s) => s.gameOver);

  useEffect(() => {
    if (!finished || answers.length === 0) {
      router.replace("/");
    }
  }, [finished, answers.length, router]);

  if (!finished || answers.length === 0) {
    return null;
  }

  const correct = answers.filter((a) => a.isCorrect).length;
  const total = answers.length;

  return (
    <main className="flex min-h-screen flex-col py-12">
      <Container className="mx-auto max-w-xl space-y-8">
        <header className="space-y-3 text-center">
          <p
            className="font-mono text-xs uppercase tracking-[0.25em]"
            style={{ color: gameOver ? "var(--error)" : "var(--accent-primary)" }}
          >
            {gameOver ? "Fim de jogo — sem vidas" : "Partida finalizada"}
          </p>
          <h1 className="text-6xl font-semibold tabular-nums">
            {score.toLocaleString("pt-BR")}
          </h1>
          <p className="text-sm text-fg-muted">
            pontos · {correct}/{total} acertos
            {total < QUESTIONS_PER_MATCH && ` (de ${QUESTIONS_PER_MATCH})`}
          </p>
        </header>

        <NicknameForm />
      </Container>
    </main>
  );
}
