import { NextResponse, type NextRequest } from "next/server";
import { getQuestionsByIds } from "@/lib/questions";
import { calculatePoints } from "@/lib/scoring";
import { signSession, verifySession } from "@/lib/session";
import { answerRequestSchema } from "@/lib/validation";
import {
  LIFE_BONUS_EVERY,
  QUESTIONS_PER_MATCH,
  QUESTION_DURATION_MS,
  type QuizAnswerResponse,
} from "@/types/quiz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = answerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let payload;
  try {
    payload = await verifySession(parsed.data.token);
  } catch {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  if (payload.index >= QUESTIONS_PER_MATCH) {
    return NextResponse.json({ error: "Match already complete" }, { status: 409 });
  }

  if (payload.lives <= 0) {
    return NextResponse.json({ error: "Partida encerrada: sem vidas." }, { status: 409 });
  }

  const expectedQid = payload.qids[payload.index];
  if (parsed.data.questionId !== expectedQid) {
    return NextResponse.json(
      { error: "Question not current or out of order" },
      { status: 403 }
    );
  }

  if (payload.questionStartedAt == null) {
    return NextResponse.json(
      { error: "Question timer not started. Call /api/quiz/next first." },
      { status: 409 }
    );
  }

  const [question] = getQuestionsByIds([expectedQid]);
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const now = Date.now();
  const elapsed = Math.max(0, now - payload.questionStartedAt);
  const timeRemainingMs = Math.max(0, QUESTION_DURATION_MS - elapsed);

  const userAnswer = parsed.data.userAnswer;
  const isTimeout = userAnswer === null || timeRemainingMs === 0;
  const isCorrect = !isTimeout && userAnswer === question.correctAnswer;

  const { points, newStreak } = calculatePoints({
    difficulty: question.difficulty,
    timeRemainingMs: isTimeout ? 0 : timeRemainingMs,
    streakBefore: payload.streak,
    correct: isCorrect,
  });

  const nextIndex = payload.index + 1;
  const nextScore = payload.score + points;
  const nextStreakMax = Math.max(payload.streakMax, newStreak);
  const nextCorrectCount = payload.correctCount + (isCorrect ? 1 : 0);

  let nextCorrectSinceLastLife = payload.correctSinceLastLife;
  let nextLives = payload.lives;
  let gainedLife = false;
  if (isCorrect) {
    nextCorrectSinceLastLife += 1;
    if (nextCorrectSinceLastLife >= LIFE_BONUS_EVERY) {
      nextCorrectSinceLastLife = 0;
      nextLives += 1;
      gainedLife = true;
    }
  } else {
    nextLives = Math.max(0, nextLives - 1);
  }

  const isGameOver = nextLives <= 0;
  const isLast = isGameOver || nextIndex >= QUESTIONS_PER_MATCH;

  const nextAnswers = [
    ...payload.answers,
    {
      qid: question.id,
      correct: isCorrect,
      timeRemainingMs: isTimeout ? 0 : timeRemainingMs,
      pointsEarned: points,
    },
  ];

  const nextToken = await signSession({
    sid: payload.sid,
    qids: payload.qids,
    index: nextIndex,
    score: nextScore,
    streak: newStreak,
    streakMax: nextStreakMax,
    correctCount: nextCorrectCount,
    lives: nextLives,
    correctSinceLastLife: nextCorrectSinceLastLife,
    answers: nextAnswers,
    questionStartedAt: null,
  });

  const response: QuizAnswerResponse = {
    token: nextToken,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    pointsEarned: points,
    streakAfter: newStreak,
    scoreAfter: nextScore,
    correctCountAfter: nextCorrectCount,
    livesAfter: nextLives,
    gainedLife,
    isCorrect,
    isTimeout,
    isGameOver,
    isLast,
  };

  return NextResponse.json(response);
}
