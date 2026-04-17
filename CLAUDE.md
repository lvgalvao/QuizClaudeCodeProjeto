# CLAUDE.md

@AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Implemented MVP of "Claude Code Quiz" — a Next.js 16 / React 19 app described by `prd.md`. The PRD remains the spec of record for product behavior; this file documents the **non-obvious** implementation choices and load-bearing invariants.

## Stack & commands

Next.js 16 (App Router, Turbopack) + React 19 + TypeScript 5 strict + Tailwind 4 (CSS-first) + Supabase + jose + Zod + Framer Motion + Zustand. **Package manager: pnpm 10** (via `corepack enable pnpm`).

- `pnpm dev` — local dev server
- `pnpm build` — production build (must end with zero TS/ESLint warnings)
- `pnpm lint` — ESLint
- No test framework — `lib/scoring.ts` is the critical pure logic. If touching scoring, add Vitest before changing.

`QUIZ_SESSION_SECRET` (>=16 chars) is required at runtime for `/api/quiz/start`. For local builds without secrets you can set a dummy value inline: `QUIZ_SESSION_SECRET=dummy-build-secret-1234567890 pnpm build`.

## Notable PRD divergences (already in code)

1. **Next.js 16, not 15.** Latest stable; App Router patterns are compatible. Read `node_modules/next/dist/docs/` (instructed by `AGENTS.md`) before touching routing/data-fetching APIs.
2. **Pool size 12/18/10** (from PRD §3.1, the detailed authoritative figure). PRD §1.5 says "10/20/10" — that line is outdated. The match itself draws **5/6/4** progressively per session.
3. **`/api/quiz/answer` + `/api/quiz/next` exist** (not in original PRD). `answer` is the token-gated reveal and the **authoritative scoring step** — the server computes `timeRemainingMs` from its own clock (`questionStartedAt` in the JWT) and returns a fresh chained token carrying the cumulative score. `next` resets `questionStartedAt` between questions so the feedback-viewing time doesn't count against the next timer. Prevents both parallel-prefetch and client-inflated time bonuses.
4. **Stateless JWT for sessions** (PRD §4.5 noted this as acceptable). `lib/session.ts` uses `jose` HS256 with TTL 30min. Each `/answer` and `/next` mints a **new** chained token; submitting to `/ranking` validates `index === QUESTIONS_PER_MATCH`. No KV/Redis dependency.
5. **No automated tests** (user opted out). Be cautious editing `lib/scoring.ts`.
6. **No shadcn/ui** — raw Tailwind everywhere.

## Architecture invariants — do not break

### Scoring is single-sourced in `lib/scoring.ts` and evaluated server-side

`calculatePoints` is the formula. **Only the server calls it** — inside `POST /api/quiz/answer`, once per question, using the server-measured `timeRemainingMs` (derived from `Date.now() - payload.questionStartedAt`). The cumulative `score`, `streak`, `streakMax`, `correctCount` and `answers[]` live in the chained JWT, not in the client's request body. The client's live HUD simply displays whatever `scoreAfter` the server returns — it never recomputes scoring. Keep `lib/scoring.ts` pure (no I/O, no globals).

### Question selection is progressive and seeded

`pickProgressiveSet(seed)` always returns 5 beginner → 6 intermediate → 4 advanced, in that order. Randomization is per-tier, seeded by `${sessionId}:${Date.now()}`. The full pool (`data/questions.json`) has 12/18/10 — don't shuffle the whole pool together.

### Anti-cheat chain (chained-token state machine)

1. `POST /api/quiz/start` → JWT signed with `{sid, qids[], index: 0, score: 0, streak: 0, streakMax: 0, correctCount: 0, answers: [], questionStartedAt: now}`. **Public payload omits `correctAnswer` and `explanation`.**
2. `POST /api/quiz/answer` → requires `questionId === qids[index]` AND `questionStartedAt != null`. Server computes `timeRemainingMs` from its clock, scores the answer, and mints a new token with `index+1`, updated cumulative state, `questionStartedAt: null`. Returns `{correctAnswer, explanation, pointsEarned, scoreAfter, token, …}`. Client **cannot** parallelize — each answer requires the token minted by the previous one.
3. `POST /api/quiz/next` → requires `questionStartedAt === null` AND `index < QUESTIONS_PER_MATCH`. Mints a new token with `questionStartedAt: Date.now()`. Called by the client when the user clicks "próxima pergunta" so feedback-viewing time doesn't bleed into the next question's timer.
4. `POST /api/ranking` → requires `index === QUESTIONS_PER_MATCH`. Reads `score` and `correctCount` **from the token**, never from the request body. UNIQUE on `session_id` blocks replay (HTTP 409). Per-IP rate-limit: 10/h soft cap, hash via `IP_HASH_SALT` (required in production; dev fallback logs a warning).

**Known limitation:** a scripted client can still walk the state machine quickly to farm max-bonus scores — the server controls *measurement* of time but cannot force the client to wait. Real defenses against that (captcha/PoW/auth) are out of scope per PRD §2.6.

`SUPABASE_SERVICE_ROLE_KEY` is **server-only**. `lib/supabase.ts:getServiceClient()` throws if called from a browser context — keep that guard.

### Trusted-proxy gate for client IP

`lib/rateLimit.ts:getClientIp()` only honors `X-Forwarded-For` / `X-Real-IP` when running behind a trusted proxy (detected via `VERCEL=1` or explicit `TRUST_PROXY_HEADERS=1`). Anywhere else, the client IP collapses to `"unknown"` so spoofed headers can't bypass the rate-limit. If you self-host behind a non-Vercel proxy that you trust, set `TRUST_PROXY_HEADERS=1`.

### Session is anonymous, tracked by sessionId in JWT

No auth, ever (PRD §2.6 explicit). Client persists `lastEntryId` in `localStorage` under key `ccq:lastEntryId` to highlight its own row in `/ranking` via `useSyncExternalStore` in `components/ranking/HighlightedRanking.tsx`.

### Timer

`app/quiz/page.tsx` owns the rAF loop. Timer freezes by transitioning `phase` from `playing` → `feedback` (the effect deps `[phase, currentIndex, current?.id]` cause cleanup). Don't add a "pause" prop to `Timer` — it's purely presentational.

Timeout passes `userAnswer: null` to `handleAnswer`. The client no longer sends `timeRemainingMs` — the server derives it from the token's `questionStartedAt`, so a local timer and the server timer can drift without affecting the authoritative score.

### React 19 lint quirks

The project uses the new `react-hooks` plugin shipped with Next 16, which enforces:
- `react-hooks/set-state-in-effect` — no synchronous `setState(...)` in effect bodies. Either move into a callback (rAF, event listener) or use `useSyncExternalStore`.
- `react-hooks/preserve-manual-memoization` — avoid wrapping complex async closures in `useCallback`. The React Compiler handles memoization. We use plain `function` declarations inside components for `handleAnswer`/`handleNext`.

If you reintroduce a `useCallback` and lint complains, the right answer is usually to drop the `useCallback`, not to disable the rule.

### Feature flag for missing Supabase

`lib/featureFlags.ts:isRankingEnabled()` is the gate. If env vars are absent, the app must remain jogável: `/ranking` shows a stub message; `POST /api/ranking` returns 503; nickname submission shows an error toast. Keep this fallback path working.

## Conventions

- **pt-BR** for user-facing copy; **English** for code identifiers and comments.
- **Dark only** — palette is fixed in `app/globals.css` as CSS variables (`--bg-base`, `--accent-primary`, etc.) and exposed to Tailwind via `@theme inline`.
- **Mobile-first** — test at 375px. Touch targets ≥ 44×44px on V/F buttons (already enforced by `min-h-[3.5rem]`).
- **Accessibility is hard-required**: ARIA labels on V/F + timer, keyboard shortcuts (V/F/←/→/1/2), `prefers-reduced-motion` zeroes animations globally via `app/globals.css`.

## File map (current)

```
app/
  layout.tsx, page.tsx, globals.css
  quiz/page.tsx                  client; rAF timer + Zustand store
  resultado/page.tsx             client; reads store, renders NicknameForm
  ranking/page.tsx               server; reads Supabase via service client
  sobre/page.tsx                 static
  api/
    quiz/start/route.ts          POST → {token, questions, startedAt}
    quiz/answer/route.ts         POST → scores server-side, returns chained token + reveal
    quiz/next/route.ts           POST → mints new token with refreshed questionStartedAt
    ranking/route.ts             POST (submit, reads score from token) / GET (top 50, s-maxage=30)
components/
  Container.tsx
  quiz/{QuestionCard,Timer,Feedback,ScoreDisplay}.tsx
  ranking/{RankingTable,HighlightedRanking,NicknameForm}.tsx
lib/
  scoring.ts          calculatePoints (pure, used only by the server)
  questions.ts        loadQuestions + getQuestionsByIds + pickProgressiveSet (mulberry32 seed)
  session.ts          signSession + verifySession (jose HS256, TTL 30m, chained state)
  supabase.ts         getAnonClient + getServiceClient (server-only guard)
  validation.ts       Zod: nicknameSchema, answerRequestSchema, nextRequestSchema, submitRankingSchema
  rateLimit.ts        getClientIp (trusted-proxy gated) + hashIp + checkRateLimit (10/h window)
  featureFlags.ts     isRankingEnabled, isPublicRankingEnabled
  store.ts            Zustand useGameStore
data/questions.json   40 perguntas (12/18/10)
supabase/migrations/0001_init.sql
types/quiz.ts         shapes + constants (POINTS_BASE, TIER_COUNTS, QUESTION_DURATION_MS, etc.)
```

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY     # server-only, never NEXT_PUBLIC_*
QUIZ_SESSION_SECRET           # >= 16 chars; required at runtime
IP_HASH_SALT                  # required in production; dev falls back to an insecure value with a warning
TRUST_PROXY_HEADERS           # optional; set to "1" when self-hosting behind a trusted non-Vercel proxy
NEXT_PUBLIC_APP_URL
```

## Editing the question pool

`data/questions.json` items are the ground truth — no DB. When editing:
- Keep the 12 / 18 / 10 distribution; `lib/questions.ts:pickProgressiveSet` will throw if a tier is short.
- Verify factuality against the official Claude Code / Anthropic docs (Anthropic docs site, MCP spec, etc.) before merging. If unsure, leave a `// TODO: revisar` adjacent to the JSON entry by way of a separate notes file rather than embedding HTML comments (JSON has no comments).
- IDs follow `q-001..q-040`; keep them stable so `session_id` history stays interpretable in old ranking rows.
