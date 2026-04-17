import questionsJson from "@/data/questions.json";
import {
  TIER_COUNTS,
  type Difficulty,
  type PublicQuestion,
  type Question,
} from "@/types/quiz";

const ALL_QUESTIONS: Question[] = questionsJson as Question[];

const TIER_ORDER: Difficulty[] = ["beginner", "intermediate", "advanced"];

export function loadQuestions(): Question[] {
  return ALL_QUESTIONS;
}

export function getQuestionsByIds(ids: string[]): Question[] {
  const map = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));
  return ids.map((id) => {
    const q = map.get(id);
    if (!q) throw new Error(`Unknown question id: ${id}`);
    return q;
  });
}

export function toPublicQuestion(q: Question): PublicQuestion {
  return {
    id: q.id,
    category: q.category,
    difficulty: q.difficulty,
    statement: q.statement,
  };
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function pickProgressiveSet(seed: string, pool: Question[] = ALL_QUESTIONS): Question[] {
  const rng = mulberry32(hashSeed(seed));
  const result: Question[] = [];

  for (const tier of TIER_ORDER) {
    const tierPool = pool.filter((q) => q.difficulty === tier);
    const want = TIER_COUNTS[tier];
    if (tierPool.length < want) {
      throw new Error(
        `Question pool too small for tier "${tier}": have ${tierPool.length}, need ${want}`
      );
    }
    const shuffled = shuffle(tierPool, rng);
    result.push(...shuffled.slice(0, want));
  }

  return result;
}

export function assertPoolDistribution(): void {
  const counts: Record<Difficulty, number> = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const q of ALL_QUESTIONS) counts[q.difficulty]++;
  for (const tier of TIER_ORDER) {
    if (counts[tier] < TIER_COUNTS[tier]) {
      throw new Error(
        `Insufficient ${tier} questions: ${counts[tier]} < ${TIER_COUNTS[tier]}`
      );
    }
  }
}
