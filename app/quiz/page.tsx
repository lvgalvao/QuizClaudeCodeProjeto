"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Container } from "@/components/Container";
import { Feedback } from "@/components/quiz/Feedback";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { ScoreDisplay } from "@/components/quiz/ScoreDisplay";
import { Timer } from "@/components/quiz/Timer";
import { useGameStore, type FinishedAnswer } from "@/lib/store";
import {
  QUESTIONS_PER_MATCH,
  QUESTION_DURATION_MS,
  type PublicQuestion,
  type QuizAnswerResponse,
  type QuizNextResponse,
  type QuizStartResponse,
} from "@/types/quiz";

type Phase = "loading" | "playing" | "feedback" | "transition" | "error";

interface FeedbackData {
  questionId: string;
  isCorrect: boolean;
  isTimeout: boolean;
  isGameOver: boolean;
  gainedLife: boolean;
  correctAnswer: boolean;
  explanation: string;
  pointsEarned: number;
  streakAfter: number;
  livesAfter: number;
  isLast: boolean;
}

function useCountdown(startedAtPerf: number | null): number {
  const [nowPerf, setNowPerf] = useState(() =>
    typeof performance !== "undefined" ? performance.now() : 0
  );

  useEffect(() => {
    if (startedAtPerf == null) return;
    let raf = 0;
    const loop = () => {
      setNowPerf(performance.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [startedAtPerf]);

  if (startedAtPerf == null) return QUESTION_DURATION_MS;
  return Math.max(0, QUESTION_DURATION_MS - (nowPerf - startedAtPerf));
}

export default function QuizPage() {
  const router = useRouter();
  const startMatch = useGameStore((s) => s.startMatch);
  const setToken = useGameStore((s) => s.setToken);
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const finish = useGameStore((s) => s.finish);
  const reset = useGameStore((s) => s.reset);

  const token = useGameStore((s) => s.token);
  const questions = useGameStore((s) => s.questions);
  const currentIndex = useGameStore((s) => s.currentIndex);
  const score = useGameStore((s) => s.score);
  const streak = useGameStore((s) => s.streak);
  const lives = useGameStore((s) => s.lives);

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null);

  const submittedRef = useRef(false);
  const timeoutFiredRef = useRef(false);

  const remainingMs = useCountdown(phase === "playing" ? questionStartedAt : null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        reset();
        const res = await fetch("/api/quiz/start", {
          method: "POST",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Falha ao iniciar (${res.status})`);
        const data: QuizStartResponse = await res.json();
        if (controller.signal.aborted) return;
        startMatch({
          token: data.token,
          startedAt: data.startedAt,
          questions: data.questions,
        });
        submittedRef.current = false;
        timeoutFiredRef.current = false;
        setQuestionStartedAt(performance.now());
        setPhase("playing");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
        setPhase("error");
      }
    })();
    return () => controller.abort();
  }, [reset, startMatch]);

  const current: PublicQuestion | undefined = questions[currentIndex];

  useEffect(() => {
    if (phase !== "playing") return;
    if (remainingMs > 0) return;
    if (timeoutFiredRef.current) return;
    timeoutFiredRef.current = true;
    handleAnswer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, remainingMs]);

  async function handleAnswer(userAnswer: boolean | null) {
    if (!current || !token) return;
    if (submittedRef.current && userAnswer !== null) return;
    submittedRef.current = true;

    const elapsed = questionStartedAt != null ? performance.now() - questionStartedAt : 0;

    try {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, questionId: current.id, userAnswer }),
      });
      if (!res.ok) throw new Error(`Falha ao enviar resposta (${res.status})`);
      const data = (await res.json()) as QuizAnswerResponse;

      const finished: FinishedAnswer = {
        questionId: current.id,
        userAnswer,
        timeRemainingMs: data.isTimeout
          ? 0
          : Math.max(0, QUESTION_DURATION_MS - elapsed),
        correctAnswer: data.correctAnswer,
        isCorrect: data.isCorrect,
        pointsEarned: data.pointsEarned,
        streakAfter: data.streakAfter,
      };

      recordAnswer(finished, data.token, data.scoreAfter, data.livesAfter, data.isGameOver);
      setFeedback({
        questionId: current.id,
        isCorrect: data.isCorrect,
        isTimeout: data.isTimeout,
        isGameOver: data.isGameOver,
        gainedLife: data.gainedLife,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        pointsEarned: data.pointsEarned,
        streakAfter: data.streakAfter,
        livesAfter: data.livesAfter,
        isLast: data.isLast,
      });
      setQuestionStartedAt(null);
      setPhase("feedback");
    } catch (err) {
      setError((err as Error).message);
      setPhase("error");
    }
  }

  async function handleNext() {
    if (!feedback) return;
    if (feedback.isLast) {
      setFeedback(null);
      finish();
      router.push("/resultado");
      return;
    }

    setPhase("transition");
    try {
      const currentToken = useGameStore.getState().token;
      if (!currentToken) throw new Error("Sessão expirada.");
      const res = await fetch("/api/quiz/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: currentToken }),
      });
      if (!res.ok) throw new Error(`Falha ao avançar (${res.status})`);
      const data = (await res.json()) as QuizNextResponse;
      setToken(data.token);
      setFeedback(null);
      submittedRef.current = false;
      timeoutFiredRef.current = false;
      setQuestionStartedAt(performance.now());
      setPhase("playing");
    } catch (err) {
      setError((err as Error).message);
      setPhase("error");
    }
  }

  const headerLabel = Math.min(currentIndex + 1, QUESTIONS_PER_MATCH);

  if (phase === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center py-16">
        <Container className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Algo deu errado</h1>
          <p className="text-fg-muted">{error}</p>
          <button
            type="button"
            className="rounded-2xl bg-accent px-5 py-3 font-semibold text-bg-base"
            onClick={() => location.reload()}
          >
            Tentar novamente
          </button>
        </Container>
      </main>
    );
  }

  if (phase === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center py-16">
        <Container className="text-center text-fg-muted">
          <p>Preparando sua partida…</p>
        </Container>
      </main>
    );
  }

  const showTimer = phase === "playing" && current != null;

  return (
    <main className="flex min-h-screen flex-col py-8 sm:py-12">
      <Container className="flex flex-1 flex-col gap-6">
        <ScoreDisplay
          current={headerLabel}
          total={QUESTIONS_PER_MATCH}
          score={score}
          streak={streak}
          lives={lives}
        />
        {showTimer && <Timer remainingMs={remainingMs} />}

        <section className="flex flex-1 items-center">
          <div className="w-full">
            <AnimatePresence mode="wait">
              {phase === "playing" && current && (
                <QuestionCard
                  key={`q-${current.id}`}
                  question={current}
                  disabled={false}
                  onAnswer={(v) => handleAnswer(v)}
                />
              )}
              {phase === "feedback" && feedback && (
                <Feedback
                  key={`fb-${feedback.questionId}`}
                  isCorrect={feedback.isCorrect}
                  isTimeout={feedback.isTimeout}
                  isGameOver={feedback.isGameOver}
                  gainedLife={feedback.gainedLife}
                  correctAnswer={feedback.correctAnswer}
                  explanation={feedback.explanation}
                  pointsEarned={feedback.pointsEarned}
                  streakAfter={feedback.streakAfter}
                  livesAfter={feedback.livesAfter}
                  isLast={feedback.isLast}
                  onNext={handleNext}
                />
              )}
              {phase === "transition" && (
                <p key="transition" className="text-center text-sm text-fg-muted">
                  Carregando próxima pergunta…
                </p>
              )}
            </AnimatePresence>
          </div>
        </section>
      </Container>
    </main>
  );
}
