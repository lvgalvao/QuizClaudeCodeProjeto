import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { pickProgressiveSet, toPublicQuestion } from "@/lib/questions";
import { signSession } from "@/lib/session";
import { INITIAL_LIVES, type QuizStartResponse } from "@/types/quiz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse<QuizStartResponse | { error: string }>> {
  try {
    const sessionId = randomUUID();
    const seed = `${sessionId}:${Date.now()}`;
    const questions = pickProgressiveSet(seed);
    const token = await signSession({
      sid: sessionId,
      qids: questions.map((q) => q.id),
      index: 0,
      score: 0,
      streak: 0,
      streakMax: 0,
      correctCount: 0,
      lives: INITIAL_LIVES,
      correctSinceLastLife: 0,
      answers: [],
      questionStartedAt: Date.now(),
    });

    return NextResponse.json({
      token,
      questions: questions.map(toPublicQuestion),
      startedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
