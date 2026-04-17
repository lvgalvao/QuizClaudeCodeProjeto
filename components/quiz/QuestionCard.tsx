"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { Category, Difficulty, PublicQuestion } from "@/types/quiz";

const CATEGORY_LABEL: Record<Category, string> = {
  fundamentals: "Fundamentos",
  features: "Features",
  "api-sdk": "Claude API & SDK",
  "best-practices": "Boas Práticas",
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  beginner: "text-success",
  intermediate: "text-warning",
  advanced: "text-error",
};

interface QuestionCardProps {
  question: PublicQuestion;
  disabled: boolean;
  onAnswer: (value: boolean) => void;
}

export function QuestionCard({ question, disabled, onAnswer }: QuestionCardProps) {
  useEffect(() => {
    if (disabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === "v" || k === "arrowleft" || k === "1") {
        e.preventDefault();
        onAnswer(true);
      } else if (k === "f" || k === "arrowright" || k === "2") {
        e.preventDefault();
        onAnswer(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [disabled, onAnswer]);

  return (
    <motion.article
      key={question.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-border-subtle bg-bg-card px-3 py-1 font-medium text-fg-muted">
          {CATEGORY_LABEL[question.category]}
        </span>
        <span
          className={`rounded-full border border-border-subtle bg-bg-card px-3 py-1 font-medium ${DIFFICULTY_COLOR[question.difficulty]}`}
        >
          {DIFFICULTY_LABEL[question.difficulty]}
        </span>
      </div>

      <h2 className="text-balance text-2xl font-medium leading-snug sm:text-[1.65rem]">
        {question.statement}
      </h2>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAnswer(true)}
          aria-label="Responder Verdadeiro (atalho V)"
          className="group flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl border border-success/30 bg-success/10 px-4 py-4 text-lg font-semibold text-success transition-colors hover:bg-success/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true">✓</span>
          Verdadeiro
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAnswer(false)}
          aria-label="Responder Falso (atalho F)"
          className="group flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl border border-error/30 bg-error/10 px-4 py-4 text-lg font-semibold text-error transition-colors hover:bg-error/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true">✕</span>
          Falso
        </button>
      </div>

      <p className="pt-1 text-center text-xs text-fg-subtle">
        Atalhos: <kbd className="font-mono text-fg-muted">V</kbd> /{" "}
        <kbd className="font-mono text-fg-muted">F</kbd>
      </p>
    </motion.article>
  );
}
