"use client";

import { create } from "zustand";
import { INITIAL_LIVES, type PublicQuestion } from "@/types/quiz";

export interface FinishedAnswer {
  questionId: string;
  userAnswer: boolean | null;
  timeRemainingMs: number;
  correctAnswer: boolean;
  isCorrect: boolean;
  pointsEarned: number;
  streakAfter: number;
}

interface GameState {
  token: string | null;
  startedAt: string | null;
  questions: PublicQuestion[];
  currentIndex: number;
  answers: FinishedAnswer[];
  score: number;
  streak: number;
  streakMax: number;
  correctCount: number;
  lives: number;
  gameOver: boolean;
  finished: boolean;
}

interface GameActions {
  startMatch: (input: {
    token: string;
    startedAt: string;
    questions: PublicQuestion[];
  }) => void;
  setToken: (token: string) => void;
  recordAnswer: (
    a: FinishedAnswer,
    nextToken: string,
    scoreAfter: number,
    livesAfter: number,
    gameOver: boolean
  ) => void;
  finish: () => void;
  reset: () => void;
}

const initialState: GameState = {
  token: null,
  startedAt: null,
  questions: [],
  currentIndex: 0,
  answers: [],
  score: 0,
  streak: 0,
  streakMax: 0,
  correctCount: 0,
  lives: INITIAL_LIVES,
  gameOver: false,
  finished: false,
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,
  startMatch: ({ token, startedAt, questions }) =>
    set({
      ...initialState,
      token,
      startedAt,
      questions,
    }),
  setToken: (token) => set({ token }),
  recordAnswer: (a, nextToken, scoreAfter, livesAfter, gameOver) =>
    set((s) => ({
      token: nextToken,
      answers: [...s.answers, a],
      score: scoreAfter,
      streak: a.streakAfter,
      streakMax: Math.max(s.streakMax, a.streakAfter),
      correctCount: s.correctCount + (a.isCorrect ? 1 : 0),
      currentIndex: s.currentIndex + 1,
      lives: livesAfter,
      gameOver,
    })),
  finish: () => set({ finished: true }),
  reset: () => set(initialState),
}));
