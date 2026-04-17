import { SignJWT, jwtVerify } from "jose";
import type { AnswerRecord, SessionTokenPayload } from "@/types/quiz";

const TOKEN_TTL = "30m";

function getKey(): Uint8Array {
  const secret = process.env.QUIZ_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "QUIZ_SESSION_SECRET is missing or too short (need >= 16 chars)."
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionStateInput = Omit<SessionTokenPayload, "iat">;

export async function signSession(state: SessionStateInput): Promise<string> {
  return await new SignJWT({
    sid: state.sid,
    qids: state.qids,
    idx: state.index,
    s: state.score,
    st: state.streak,
    sm: state.streakMax,
    cc: state.correctCount,
    lv: state.lives,
    cll: state.correctSinceLastLife,
    ans: state.answers,
    qsa: state.questionStartedAt,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getKey());
}

function isAnswerRecord(value: unknown): value is AnswerRecord {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.qid === "string" &&
    typeof v.correct === "boolean" &&
    typeof v.timeRemainingMs === "number" &&
    typeof v.pointsEarned === "number"
  );
}

export async function verifySession(token: string): Promise<SessionTokenPayload> {
  const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
  const p = payload as Record<string, unknown>;
  if (
    typeof p.sid !== "string" ||
    !Array.isArray(p.qids) ||
    !p.qids.every((q) => typeof q === "string") ||
    typeof p.idx !== "number" ||
    typeof p.s !== "number" ||
    typeof p.st !== "number" ||
    typeof p.sm !== "number" ||
    typeof p.cc !== "number" ||
    typeof p.lv !== "number" ||
    typeof p.cll !== "number" ||
    !Array.isArray(p.ans) ||
    !p.ans.every(isAnswerRecord) ||
    !(typeof p.qsa === "number" || p.qsa === null)
  ) {
    throw new Error("Invalid session token payload");
  }
  return {
    sid: p.sid,
    qids: p.qids as string[],
    index: p.idx,
    score: p.s,
    streak: p.st,
    streakMax: p.sm,
    correctCount: p.cc,
    lives: p.lv,
    correctSinceLastLife: p.cll,
    answers: p.ans,
    questionStartedAt: p.qsa as number | null,
    iat: typeof p.iat === "number" ? p.iat : 0,
  };
}
