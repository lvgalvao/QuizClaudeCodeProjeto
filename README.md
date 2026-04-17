# Claude Code Quiz

Aplicação web Next.js de quiz Verdadeiro/Falso sobre o **Claude Code** da Anthropic. Mobile-first, dark-only, com timer de 10s, scoring com bônus de tempo + streak, e ranking global persistido em Supabase.

Spec completa: [`prd.md`](./prd.md). Convenções para agentes IA: [`CLAUDE.md`](./CLAUDE.md).

## Stack

- **Next.js 16** (App Router, Turbopack, React 19)
- **TypeScript 5** strict
- **Tailwind CSS 4** (CSS-first config)
- **Zustand** para estado client da partida
- **jose** para JWT de sessão (anti-cheat stateless)
- **Supabase** (PostgreSQL + JS client) para ranking global
- **Framer Motion** para animações
- **Zod** para validação de payloads de API

## Setup local

Requisitos: Node 20+ e pnpm 10+ (instalável via `corepack enable pnpm`).

```bash
pnpm install
cp .env.local.example .env.local
# preencher as variáveis (ver seção abaixo)
pnpm dev
```

Acesse http://localhost:3000.

### Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only

QUIZ_SESSION_SECRET=                # >= 16 chars; segredo HMAC do JWT de sessão
IP_HASH_SALT=                       # qualquer string aleatória; salt do hash de IP

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Sem as variáveis Supabase, a aplicação funciona em modo "ranking desabilitado": o quiz é jogável, mas o leaderboard global não aparece e tentativas de salvar pontuação retornam 503.

`QUIZ_SESSION_SECRET` é **obrigatório**: sem ele, `/api/quiz/start` falha em runtime.

## Supabase

Aplique a migração inicial em SQL editor do Supabase:

```bash
# arquivo: supabase/migrations/0001_init.sql
```

Cria a tabela `rankings` com RLS habilitada, public SELECT, sem policy de INSERT (escritas só via service role nas API routes).

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor local com hot reload |
| `pnpm build` | Build de produção |
| `pnpm start` | Roda o build de produção |
| `pnpm lint` | ESLint |

## Arquitetura — fluxo anti-cheat

1. **`POST /api/quiz/start`** — gera `sessionId`, sorteia 15 perguntas (5/6/4 por tier, seed determinística por sessão), assina JWT HS256 contendo `{sid, qids[]}` (TTL 30min), retorna `{token, questions}` **sem** `correctAnswer` ou `explanation`.
2. **`POST /api/quiz/answer`** — para cada pergunta respondida, valida o token, confirma que `questionId` ∈ `qids` e devolve `{correctAnswer, explanation}` para o feedback.
3. **`POST /api/ranking`** — recebe `{token, nickname, answers[]}`. Server-side:
   - valida nickname e shape (Zod);
   - decodifica token, exige que a ordem dos `answers` bata com `qids`;
   - **recalcula o score do zero** com `lib/scoring.ts` (mesma função usada pelo HUD client);
   - rate-limit por hash de IP (10/h);
   - insere no Supabase. UNIQUE em `session_id` impede replay (HTTP 409).
4. **`GET /api/ranking`** — top 50 com `Cache-Control: s-maxage=30`.

A página `/ranking` lê o Supabase server-side (server component); um sub-componente client (`HighlightedRanking`) faz highlight da linha do usuário usando `useSyncExternalStore` em cima de `localStorage`.

## Estrutura

```
app/
  page.tsx                        Home
  quiz/page.tsx                   Partida (client)
  resultado/page.tsx              Tela final + NicknameForm
  ranking/page.tsx                Leaderboard
  sobre/page.tsx                  Sobre
  api/
    quiz/start/route.ts           POST: gera sessão + perguntas
    quiz/answer/route.ts          POST: revela correctAnswer
    ranking/route.ts              POST: salvar / GET: top 50
components/
  Container.tsx
  quiz/                           QuestionCard, Timer, Feedback, ScoreDisplay
  ranking/                        RankingTable, HighlightedRanking, NicknameForm
lib/
  scoring.ts                      Pura, fonte única de scoring (UI + API)
  questions.ts                    Loader + sampler progressivo seedado
  session.ts                      JWT (jose, HS256)
  supabase.ts                     Factories anon/service
  validation.ts                   Schemas Zod
  rateLimit.ts                    Hash IP + janela de 1h
  featureFlags.ts                 isRankingEnabled (fallback sem Supabase)
  store.ts                        Zustand do estado da partida
data/
  questions.json                  40 perguntas (12 beginner / 18 intermediate / 10 advanced)
supabase/
  migrations/0001_init.sql        Schema do ranking
types/quiz.ts                     Tipos compartilhados + constantes (POINTS_BASE, TIER_COUNTS, etc.)
```

## Atalhos de teclado (página `/quiz`)

- `V` ou `←` ou `1` → Verdadeiro
- `F` ou `→` ou `2` → Falso

## Deploy (Vercel)

1. Conecte o repositório.
2. Configure as 5 variáveis de ambiente (mesmas do `.env.local`).
3. Aplique a migração SQL no projeto Supabase.

A app respeita `prefers-reduced-motion` e atinge contraste WCAG AA na paleta dark.
