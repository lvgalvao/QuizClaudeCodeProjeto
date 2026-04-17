"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ScoreDisplayProps {
  current: number;
  total: number;
  score: number;
  streak: number;
  lives: number;
}

export function ScoreDisplay({ current, total, score, streak, lives }: ScoreDisplayProps) {
  const hearts = Math.max(0, lives);
  const displayHearts = Math.min(hearts, 6);
  const overflow = hearts - displayHearts;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <span className="font-mono uppercase tracking-widest text-fg-muted">
        Pergunta <span className="text-fg">{current}</span>/{total}
      </span>

      <div
        className="flex items-center gap-1"
        role="status"
        aria-label={`${hearts} vida${hearts === 1 ? "" : "s"} restante${hearts === 1 ? "" : "s"}`}
      >
        <AnimatePresence initial={false}>
          {Array.from({ length: displayHearts }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="text-lg leading-none"
              aria-hidden="true"
            >
              ❤️
            </motion.span>
          ))}
        </AnimatePresence>
        {overflow > 0 && (
          <span className="ml-1 font-mono text-xs text-fg-muted">+{overflow}</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {streak >= 3 && (
          <span
            className="rounded-full bg-accent/15 px-2.5 py-1 font-medium text-accent"
            aria-label={`Sequência de ${streak} acertos`}
          >
            🔥 {streak}
          </span>
        )}
        <span className="font-semibold tabular-nums" aria-label={`${score} pontos`}>
          {score.toLocaleString("pt-BR")} pts
        </span>
      </div>
    </div>
  );
}
