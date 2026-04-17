export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Category = "fundamentals" | "features" | "api-sdk" | "best-practices";

export interface Question {
  id: string;
  category: Category;
  difficulty: Difficulty;
  statement: string;
  correctAnswer: boolean;
  explanation: string;
}

export type PublicQuestion = Omit<Question, "correctAnswer" | "explanation">;

export interface AnswerRecord {
  qid: string;
  correct: boolean;
  timeRemainingMs: number;
  pointsEarned: number;
}

export interface RankingEntry {
  id: string;
  nickname: string;
  score: number;
  correctCount: number;
  createdAt: string;
}

export interface SessionTokenPayload {
  sid: string;
  qids: string[];
  index: number;
  score: number;
  streak: number;
  streakMax: number;
  correctCount: number;
  lives: number;
  correctSinceLastLife: number;
  answers: AnswerRecord[];
  questionStartedAt: number | null;
  iat: number;
}

export interface QuizStartResponse {
  token: string;
  questions: PublicQuestion[];
  startedAt: string;
}

export interface QuizAnswerRequest {
  token: string;
  questionId: string;
  userAnswer: boolean | null;
}

export interface QuizAnswerResponse {
  token: string;
  correctAnswer: boolean;
  explanation: string;
  pointsEarned: number;
  streakAfter: number;
  scoreAfter: number;
  correctCountAfter: number;
  livesAfter: number;
  gainedLife: boolean;
  isCorrect: boolean;
  isTimeout: boolean;
  isGameOver: boolean;
  isLast: boolean;
}

export interface QuizNextRequest {
  token: string;
}

export interface QuizNextResponse {
  token: string;
}

export interface SubmitRankingRequest {
  token: string;
  nickname: string;
}

export interface SubmitRankingResponse {
  ok: true;
  entry: RankingEntry;
  rank: number | null;
}

export const POINTS_BASE: Record<Difficulty, number> = {
  beginner: 100,
  intermediate: 200,
  advanced: 300,
};

export const QUESTION_DURATION_MS = 15_000;
export const QUESTIONS_PER_MATCH = 15;
export const INITIAL_LIVES = 2;
export const LIFE_BONUS_EVERY = 5;
export const TIER_COUNTS: Record<Difficulty, number> = {
  beginner: 5,
  intermediate: 6,
  advanced: 4,
};
