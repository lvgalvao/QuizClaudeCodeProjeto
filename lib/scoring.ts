import { POINTS_BASE, QUESTION_DURATION_MS, type Difficulty } from "@/types/quiz";

export interface ScoreInput {
  difficulty: Difficulty;
  timeRemainingMs: number;
  streakBefore: number;
  correct: boolean;
}

export interface ScoreResult {
  points: number;
  newStreak: number;
}

export function calculatePoints({
  difficulty,
  timeRemainingMs,
  streakBefore,
  correct,
}: ScoreInput): ScoreResult {
  if (!correct) {
    return { points: 0, newStreak: 0 };
  }

  const clampedTime = Math.max(0, Math.min(timeRemainingMs, QUESTION_DURATION_MS));
  const base = POINTS_BASE[difficulty];
  const timeBonus = Math.floor((clampedTime / QUESTION_DURATION_MS) * 50);
  const newStreak = streakBefore + 1;
  const streakBonus = Math.min(newStreak * 20, 100);

  return {
    points: base + timeBonus + streakBonus,
    newStreak,
  };
}
