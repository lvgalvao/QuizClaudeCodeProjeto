"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface FeedbackProps {
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
  onNext: () => void;
}

const CONFETTI_COLORS = [
  "#10b981",
  "#cc785c",
  "#e8b4a0",
  "#f59e0b",
  "#60a5fa",
  "#f472b6",
];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        x: (Math.random() - 0.5) * 520,
        y: -80 - Math.random() * 260,
        rotate: Math.random() * 720 - 360,
        delay: Math.random() * 0.15,
        duration: 1.1 + Math.random() * 0.8,
        size: 6 + Math.random() * 6,
      })),
    []
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
    >
      <div className="relative h-0 w-0">
        {pieces.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: p.x,
              y: [0, p.y, p.y + 220],
              rotate: p.rotate,
            }}
            transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
            className="absolute left-0 top-0 block rounded-sm"
            style={{
              width: p.size,
              height: p.size * 1.6,
              backgroundColor: p.color,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function Feedback({
  isCorrect,
  isTimeout,
  isGameOver,
  gainedLife,
  correctAnswer,
  explanation,
  pointsEarned,
  streakAfter,
  livesAfter,
  isLast,
  onNext,
}: FeedbackProps) {
  const headline = isGameOver
    ? "Fim de jogo — acabaram suas vidas"
    : isTimeout
      ? "Tempo esgotado"
      : isCorrect
        ? "Resposta correta!"
        : "Resposta incorreta";

  const icon = isCorrect ? "✓" : "✕";

  const frameClass = isCorrect
    ? "border-success/60 bg-success/10 ring-2 ring-success/40 shadow-[0_0_60px_rgba(16,185,129,0.25)]"
    : "border-error/60 bg-error/10 ring-2 ring-error/40 shadow-[0_0_60px_rgba(239,68,68,0.28)]";

  const buttonLabel = isLast
    ? isGameOver
      ? "Salvar minha pontuação →"
      : "Ver resultado →"
    : "Próxima pergunta →";

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={
        isCorrect ? { opacity: 0, scale: 0.96 } : { opacity: 0, x: -14 }
      }
      animate={
        isCorrect
          ? { opacity: 1, scale: 1 }
          : { opacity: 1, x: [0, 12, -12, 8, -8, 0] }
      }
      transition={{ duration: isCorrect ? 0.25 : 0.45 }}
      className={`relative space-y-5 rounded-3xl border p-6 ${frameClass}`}
    >
      {isCorrect && <Confetti />}

      <header className="flex items-center gap-4">
        <motion.span
          initial={{ scale: 0.4, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl font-bold"
          style={{
            color: isCorrect ? "var(--success)" : "var(--error)",
            backgroundColor: isCorrect
              ? "rgba(16,185,129,0.22)"
              : "rgba(239,68,68,0.22)",
          }}
          aria-hidden="true"
        >
          {icon}
        </motion.span>
        <div className="min-w-0">
          <p className="text-xl font-semibold leading-tight">{headline}</p>
          <p className="text-sm text-fg-muted">
            Resposta correta:{" "}
            <strong className="text-fg">{correctAnswer ? "Verdadeiro" : "Falso"}</strong>
          </p>
        </div>
        <div className="ml-auto text-right">
          <motion.p
            key={pointsEarned}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-xl font-bold tabular-nums"
            style={{ color: pointsEarned > 0 ? "var(--success)" : "var(--text-secondary)" }}
          >
            {pointsEarned > 0 ? `+${pointsEarned}` : "0"} pts
          </motion.p>
          {streakAfter >= 2 && (
            <p className="text-xs text-accent">🔥 streak {streakAfter}</p>
          )}
        </div>
      </header>

      {(gainedLife || (!isCorrect && !isGameOver)) && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 rounded-2xl border border-border-subtle bg-bg-card/60 px-3 py-2 text-sm"
        >
          {gainedLife ? (
            <>
              <span aria-hidden="true" className="text-lg">❤️</span>
              <span className="font-medium text-success">+1 vida!</span>
              <span className="text-fg-muted">
                Total: {livesAfter} {livesAfter === 1 ? "vida" : "vidas"}.
              </span>
            </>
          ) : (
            <>
              <span aria-hidden="true" className="text-lg">💔</span>
              <span className="font-medium text-error">−1 vida.</span>
              <span className="text-fg-muted">
                Restam {livesAfter} {livesAfter === 1 ? "vida" : "vidas"}.
              </span>
            </>
          )}
        </motion.div>
      )}

      <p className="text-pretty text-base leading-relaxed text-fg-muted">{explanation}</p>

      <button
        type="button"
        onClick={onNext}
        autoFocus
        className="w-full rounded-2xl bg-accent px-5 py-4 text-base font-semibold text-bg-base transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {buttonLabel}
      </button>
    </motion.div>
  );
}
