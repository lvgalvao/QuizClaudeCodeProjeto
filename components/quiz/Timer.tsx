"use client";

import { QUESTION_DURATION_MS } from "@/types/quiz";

interface TimerProps {
  remainingMs: number;
  durationMs?: number;
}

export function Timer({ remainingMs, durationMs = QUESTION_DURATION_MS }: TimerProps) {
  const fraction = Math.max(0, Math.min(1, remainingMs / durationMs));
  const seconds = Math.ceil(remainingMs / 1000);

  let color = "var(--success)";
  if (fraction < 0.3) color = "var(--error)";
  else if (fraction < 0.6) color = "var(--warning)";

  return (
    <div
      role="timer"
      aria-label={`${seconds} segundos restantes`}
      aria-live="off"
      className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-fg-muted"
    >
      <span>Tempo</span>
      <span className="text-2xl font-semibold tabular-nums" style={{ color }}>
        {seconds}s
      </span>
    </div>
  );
}
