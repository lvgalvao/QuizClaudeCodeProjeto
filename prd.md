# PRD — Quiz Web "Claude Code Quiz"

> Documento de requisitos de produto destinado ao Claude Code como base para a implementação do projeto.
> **Versão:** 1.0 — **Data:** 2026-04-17 — **Owner:** Luciano Galvão

---

## 1. Visão Geral

### 1.1 O que é
Aplicação web de quiz no formato **Verdadeiro ou Falso** focada em conhecimentos sobre o **Claude Code** (CLI da Anthropic), desde fundamentos até tópicos avançados, incluindo Claude API e Agent SDK.

### 1.2 Proposta de valor
- Ferramenta de **aprendizado lúdico** para desenvolvedores e profissionais de dados que querem dominar o Claude Code.
- **Feedback imediato** com explicação educativa a cada pergunta.
- **Ranking global** que estimula competitividade saudável e rejogabilidade.

### 1.3 Objetivos de negócio
1. Educar usuários sobre Claude Code de forma envolvente.
2. Gerar engajamento (tempo de sessão, retorno, compartilhamentos).
3. Ser base para novos quizzes temáticos no futuro (arquitetura reaproveitável).

### 1.4 Público-alvo
- **Iniciantes**: curiosos sobre IA aplicada a desenvolvimento, querendo entender o que é o Claude Code.
- **Intermediários**: desenvolvedores que já usam IDEs com IA e querem conhecer features específicas.
- **Avançados**: devs e engenheiros de IA que trabalham com API/SDK Anthropic e integrações complexas.

### 1.5 Critérios de sucesso (MVP)
- Partida completa jogável de ponta a ponta (início → 15 perguntas → resultado → ranking).
- 40 perguntas cadastradas (10 iniciantes + 20 intermediárias + 10 avançadas).
- Ranking global funcional via Supabase.
- Deploy ativo na Vercel com domínio acessível.
- Mobile-first responsivo (jogável em celular sem fricção).

---

## 2. Escopo Funcional

### 2.1 Jornada do usuário (fluxo principal)

```
Home → [Iniciar Quiz] → Partida (15 perguntas, timer 10s cada)
     → Feedback imediato a cada pergunta (acerto/erro + explicação)
     → Tela Final (pontuação + resumo)
     → [Opcional] Inserir nickname → Salvar no Ranking Global
     → Ver Ranking → [Jogar novamente] → loop
```

### 2.2 Telas / Rotas

| Rota | Tela | Descrição |
|------|------|-----------|
| `/` | Home | Título, CTA "Iniciar Quiz", link para Ranking e Como Funciona |
| `/quiz` | Partida em andamento | Renderiza perguntas, timer, feedback |
| `/resultado` | Tela Final | Pontuação, acertos/erros, CTA para salvar ranking |
| `/ranking` | Leaderboard | Top 50 jogadores globais (ordem decrescente de pontos) |
| `/sobre` | Sobre | Breve explicação do projeto, créditos, link para Claude Code |

### 2.3 Mecânicas de gameplay

#### 2.3.1 Estrutura de partida
- **15 perguntas por partida**, selecionadas com **dificuldade progressiva**:
  - Perguntas 1–5: nível **Iniciante**
  - Perguntas 6–11: nível **Intermediário**
  - Perguntas 12–15: nível **Avançado**
- Perguntas são **sorteadas aleatoriamente dentro de cada faixa** (evitar repetição em rodadas consecutivas — usar seed por sessão).
- Partida encerra quando as 15 perguntas são respondidas OU o usuário abandona (sem salvar pontuação).

#### 2.3.2 Timer
- **10 segundos por pergunta**.
- Barra de progresso visual no topo da pergunta.
- Se o tempo esgotar sem resposta → conta como **erro** e avança.
- Timer pausa enquanto o feedback está sendo exibido.

#### 2.3.3 Sistema de pontuação
Cada pergunta acertada gera pontos conforme a fórmula:

```
pontos_base = { iniciante: 100, intermediário: 200, avançado: 300 }
bônus_tempo = floor( (tempo_restante_ms / 10000) * 50 )
streak_bônus = min(streak_atual * 20, 100)  // bônus por sequência de acertos consecutivos
pontos_pergunta = pontos_base + bônus_tempo + streak_bônus  (se acerto)
pontos_pergunta = 0                                            (se erro ou timeout)
```

- **Streak**: contador que incrementa a cada acerto consecutivo, zera ao errar.
- **Pontuação final** = soma de todos os `pontos_pergunta`.
- Pontuação máxima teórica ≈ `(5×100 + 6×200 + 4×300) + 15×50 + streak` ≈ 4.000+ pontos.

#### 2.3.4 Feedback imediato (por pergunta)
Após o usuário clicar em "Verdadeiro" ou "Falso" (ou timeout):
- Exibir por **~3 segundos** (ou até clique em "Próxima"):
  - **Indicador visual**: check verde (acerto) ou X vermelho (erro).
  - **Resposta correta** destacada.
  - **Explicação textual** educativa (2–4 frases) sobre o porquê.
  - Pontos ganhos na pergunta + streak atual.
- Botão **"Próxima pergunta"** para avançar manualmente.

### 2.4 Ranking / Leaderboard

- **Persistência**: Supabase (PostgreSQL + API REST/Edge).
- **Exibição**: Top 50 melhores pontuações de todos os tempos.
- Colunas: Posição, Nickname, Pontuação, Acertos/15, Data.
- Usuário **só salva no ranking após concluir a partida e preencher nickname** (fluxo opt-in).
- Nickname: 2–20 caracteres, alfanumérico + underscore/hífen. Sem autenticação (anônimo).
- Anti-spam básico: rate-limit por IP (máx. 10 submissões/hora), validação server-side da pontuação (rever item 4.4).

### 2.5 Feature extras (in scope v1)
- [x] Feedback imediato com explicação por pergunta.
- [x] Nickname opcional ao final para salvar no ranking.
- [x] Revisão da pontuação e acertos na tela final.

### 2.6 Fora de escopo (v1)
- Autenticação de usuário (OAuth/email).
- Modo prática sem timer.
- Múltipla escolha ou outros formatos de pergunta.
- Compartilhamento social com imagem gerada.
- Admin panel para gerenciar perguntas (editar JSON manualmente no v1).
- Dark/Light toggle (apenas dark mode).
- Internacionalização (apenas pt-BR no v1).

---

## 3. Conteúdo — Banco de Perguntas

### 3.1 Volume e distribuição
- **40 perguntas** no total no JSON inicial.
- Distribuição por dificuldade:
  - **Iniciante**: 12 perguntas (foco em "o que é", conceitos básicos de negócio)
  - **Intermediário**: 18 perguntas (features, fluxos, produtividade)
  - **Avançado**: 10 perguntas (API, SDK, hooks avançados, MCP, internals)

### 3.2 Categorias temáticas
Cada pergunta pertence a uma das categorias abaixo (campo `category`):

| Categoria | Slug | Exemplos de tópicos |
|-----------|------|---------------------|
| Fundamentos do Claude Code | `fundamentals` | O que é, instalação, modelos disponíveis, CLI básica |
| Features e Produtividade | `features` | Hooks, slash commands, MCP servers, subagents, plan mode, CLAUDE.md |
| Claude API / SDK | `api-sdk` | Anthropic SDK, Agent SDK, tool use, prompt caching, modelos |
| Boas Práticas e Casos de Uso | `best-practices` | Permissões, workflows, integração com IDEs, segurança |

### 3.3 Formato de cada pergunta (schema JSON)

```json
{
  "id": "q-001",
  "category": "fundamentals",
  "difficulty": "beginner",
  "statement": "O Claude Code é um CLI oficial da Anthropic para tarefas de engenharia de software.",
  "correctAnswer": true,
  "explanation": "Verdadeiro. O Claude Code é o CLI oficial da Anthropic, projetado para atuar como um agente interativo de engenharia de software, acessível via terminal, apps desktop, web e extensões de IDE."
}
```

### 3.4 Exemplos iniciais (seed para o JSON)

**Iniciante (fundamentals)**
- "O Claude Code pode ser usado apenas via terminal." → **Falso** (também existe app desktop, web e extensões de IDE).
- "Para usar o Claude Code é necessário ter uma conta Anthropic." → **Verdadeiro**.
- "O Claude Code é capaz de executar comandos no sistema do usuário mediante permissão." → **Verdadeiro**.

**Intermediário (features)**
- "Slash commands no Claude Code são acionados digitando `/nome-do-comando`." → **Verdadeiro**.
- "Um arquivo `CLAUDE.md` na raiz do projeto serve para instruções persistentes que o Claude Code lê automaticamente." → **Verdadeiro**.
- "Hooks do Claude Code permitem executar shell commands em resposta a eventos como tool calls." → **Verdadeiro**.
- "MCP significa 'Model Context Protocol' e permite conectar servidores externos ao Claude Code." → **Verdadeiro**.

**Avançado (api-sdk)**
- "O prompt caching da Anthropic tem TTL padrão de 5 minutos." → **Verdadeiro**.
- "O Agent SDK da Anthropic permite construir agentes customizados com o mesmo harness do Claude Code." → **Verdadeiro**.
- "Tool use na Claude API requer obrigatoriamente streaming." → **Falso** (streaming é opcional).

> ⚠️ O Claude Code deve gerar as 40 perguntas completas no JSON final, respeitando a distribuição por dificuldade. As explicações devem ser factualmente corretas e didáticas.

---

## 4. Especificação Técnica

### 4.1 Stack

| Camada | Tecnologia | Versão alvo |
|--------|-----------|-------------|
| Framework | Next.js (App Router) | 15.x |
| Linguagem | TypeScript | 5.x (strict mode) |
| Estilização | Tailwind CSS | 4.x |
| Componentes UI | shadcn/ui (opcional, sob demanda) | latest |
| Animações | Framer Motion | latest |
| Banco de dados | Supabase (PostgreSQL) | - |
| Validação | Zod | latest |
| Hospedagem | Vercel | - |
| Gerenciador de pacotes | pnpm (preferido) ou npm | - |

### 4.2 Estrutura de pastas (sugerida)

```
QuizClaudeCodeProjeto/
├── app/
│   ├── layout.tsx               # Layout raiz com tema dark
│   ├── page.tsx                 # Home
│   ├── quiz/
│   │   └── page.tsx             # Tela da partida
│   ├── resultado/
│   │   └── page.tsx             # Tela final
│   ├── ranking/
│   │   └── page.tsx             # Leaderboard
│   ├── sobre/
│   │   └── page.tsx             # Sobre
│   └── api/
│       └── ranking/
│           ├── route.ts         # POST salvar pontuação / GET listar top 50
│           └── validate.ts      # Validação server-side
├── components/
│   ├── quiz/
│   │   ├── QuestionCard.tsx     # Card com enunciado + botões V/F
│   │   ├── Timer.tsx            # Barra de timer animada
│   │   ├── Feedback.tsx         # Overlay de feedback pós-resposta
│   │   └── ScoreDisplay.tsx     # HUD de pontuação + streak
│   ├── ranking/
│   │   ├── RankingTable.tsx     # Tabela do leaderboard
│   │   └── NicknameForm.tsx     # Form para salvar pontuação
│   └── ui/                      # Botões, inputs, etc (shadcn)
├── lib/
│   ├── questions.ts             # Loader + sorteio de perguntas
│   ├── scoring.ts               # Cálculo de pontuação e streak
│   ├── supabase.ts              # Cliente Supabase
│   └── validation.ts            # Schemas Zod
├── data/
│   └── questions.json           # Banco de perguntas (40 perguntas)
├── types/
│   └── quiz.ts                  # Tipos compartilhados
├── public/
│   └── assets/                  # Imagens, favicon
├── .env.local.example           # Template de variáveis
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 4.3 Modelo de dados

#### 4.3.1 Tipos TypeScript principais (`types/quiz.ts`)

```typescript
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

export interface AnswerRecord {
  questionId: string;
  userAnswer: boolean | null; // null = timeout
  correct: boolean;
  timeSpentMs: number;
  pointsEarned: number;
}

export interface GameSession {
  sessionId: string;           // uuid gerado no início da partida
  startedAt: string;           // ISO
  finishedAt?: string;
  questions: Question[];       // as 15 da partida
  answers: AnswerRecord[];
  totalScore: number;
  streakMax: number;
}

export interface RankingEntry {
  id: string;
  nickname: string;
  score: number;
  correctCount: number;  // de 15
  createdAt: string;     // ISO
}
```

#### 4.3.2 Schema Supabase (SQL)

```sql
create table public.rankings (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(nickname) between 2 and 20),
  score integer not null check (score >= 0 and score <= 10000),
  correct_count integer not null check (correct_count between 0 and 15),
  session_id uuid not null unique,   -- previne duplo-submit da mesma sessão
  ip_hash text,                       -- hash da IP para rate-limit
  created_at timestamptz not null default now()
);

create index rankings_score_idx on public.rankings (score desc);

-- RLS: leitura pública, escrita apenas via API route (service role)
alter table public.rankings enable row level security;

create policy "public read" on public.rankings
  for select using (true);
-- Nenhuma policy de insert => só a service_role (server-side) consegue inserir.
```

### 4.4 Segurança e anti-cheat

- **Nunca confiar no cliente para a pontuação final**: a API route `/api/ranking` recebe o array `answers[]` com tempos e recalcula a pontuação server-side antes de gravar.
- **Token de sessão**: ao iniciar `/quiz`, gerar `sessionId` via API (server-side) e retornar as 15 perguntas; ao salvar ranking, enviar o mesmo `sessionId`. Rejeitar se já existir no banco.
- **Rate-limit**: hash de IP armazenado; máximo 10 submissões/hora por hash.
- **Validação Zod** em todo body recebido pela API.
- **Environment variables** sensíveis apenas no server (Service Role Key nunca no client).

### 4.5 Rotas de API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/quiz/start` | Gera `sessionId`, sorteia 15 perguntas (progressivas), retorna para o client. Guarda `{sessionId, questionIds, startedAt}` em cache/KV (ou apenas stateless assinado com JWT curto). |
| `POST` | `/api/ranking` | Body: `{sessionId, nickname, answers[]}`. Valida, recalcula score, insere no Supabase. |
| `GET`  | `/api/ranking` | Retorna top 50 (cacheado 30s). |

> **Nota**: para MVP mais simples, é aceitável não persistir sessão no server e apenas recalcular a partir das respostas + conferindo que os `questionIds` existem e que o nickname não é duplicado em curto intervalo. Decidir na implementação.

### 4.6 Variáveis de ambiente (`.env.local.example`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # server-only
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. Design e UX

### 5.1 Identidade visual
- **Tema**: Dark mode único (sem toggle no v1).
- **Paleta**:
  - Background base: `#0A0A0A` (quase preto) / `#141414` (cards)
  - Accent primário: `#CC785C` (laranja Anthropic)
  - Accent secundário: `#E8B4A0` (variação clara)
  - Sucesso: `#10B981` (verde feedback)
  - Erro: `#EF4444` (vermelho feedback)
  - Texto primário: `#FAFAFA`
  - Texto secundário: `#A1A1AA`
  - Borda sutil: `#27272A`
- **Tipografia**: Inter (sans) + JetBrains Mono (para trechos de código nas explicações).
- **Estética**: minimalista, bastante respiração, cantos arredondados (`rounded-2xl`), sombras sutis.

### 5.2 Componentes-chave

**Home (`/`)**
- Hero com título "Claude Code Quiz" + subtítulo explicativo.
- CTA grande "Iniciar Quiz".
- Cards secundários: "Ver Ranking", "Como Funciona".
- Contador de "X partidas jogadas" (opcional, fetch do Supabase).

**Partida (`/quiz`)**
- Header fixo: contador `3/15`, pontuação atual, streak (com ícone fogo 🔥 se ≥3).
- Barra de timer no topo (10s → 0, transição de cor verde → amarelo → vermelho).
- Card central com enunciado grande (`text-2xl` ou maior em mobile).
- Dois botões grandes: **Verdadeiro** (verde) e **Falso** (vermelho), ocupando largura igual.
- Badge da categoria + dificuldade em destaque discreto.

**Feedback (overlay/modal após resposta)**
- Grande ícone de check ou X animado (Framer Motion).
- Texto "Resposta correta: Verdadeiro/Falso".
- Box destacada com a explicação.
- Pontos ganhos animados (`+250`).
- Botão "Próxima pergunta".

**Resultado (`/resultado`)**
- Pontuação final grande e destacada.
- `X/15 acertos` + percentual.
- Distribuição por dificuldade (mini gráfico ou barras).
- Form de nickname + botão "Salvar no Ranking" (opcional).
- CTAs: "Jogar Novamente", "Ver Ranking".

**Ranking (`/ranking`)**
- Tabela limpa, top 50.
- Highlight na linha do usuário atual (se existir) via sessionId guardado em localStorage.

### 5.3 Responsividade
- **Mobile-first**. Testar em 375px (iPhone SE) até 1440px.
- Touch targets mínimos de 44×44px nos botões V/F.
- Perguntas longas devem ter scroll interno sem quebrar o layout.

### 5.4 Acessibilidade (WCAG 2.1 AA mínimo)
- Contraste de texto ≥ 4.5:1.
- Todos os elementos interativos acessíveis via teclado (Tab, Enter, Espaço).
- `aria-label` em botões V/F e timer.
- `prefers-reduced-motion` desabilita animações longas.
- Screen reader anuncia o feedback após resposta.

---

## 6. Critérios de Aceite

### 6.1 Funcionais
- [ ] Usuário consegue iniciar uma partida e responder 15 perguntas de ponta a ponta.
- [ ] Timer de 10s funciona e conta timeout como erro.
- [ ] Pontuação calculada corretamente conforme fórmula (base + bônus tempo + streak).
- [ ] Feedback aparece após cada resposta mostrando acerto/erro, resposta correta e explicação.
- [ ] Usuário consegue submeter sua pontuação ao ranking com nickname válido.
- [ ] Ranking global exibe top 50 ordenado por pontuação decrescente.
- [ ] Perguntas seguem dificuldade progressiva (iniciante → intermediário → avançado).
- [ ] Perguntas são sorteadas aleatoriamente dentro de cada faixa.

### 6.2 Não-funcionais
- [ ] Lighthouse score ≥ 90 em Performance, Accessibility, Best Practices.
- [ ] Tempo de carregamento inicial < 2s em 4G simulado.
- [ ] Build sem warnings do TypeScript / ESLint.
- [ ] Zero erros de console em produção.
- [ ] Funciona em Chrome, Safari, Firefox (últimas 2 versões) e mobile Safari/Chrome.

### 6.3 Conteúdo
- [ ] 40 perguntas cadastradas no `questions.json`, distribuídas como especificado.
- [ ] Todas as perguntas têm explicação correta, didática e factual (sem inventar features inexistentes do Claude Code).
- [ ] Sem duplicatas ou perguntas triviais em excesso.

---

## 7. Roadmap de Implementação (sugerido ao Claude Code)

### Fase 1 — Setup (dia 1)
1. Inicializar projeto Next.js 15 com TypeScript, Tailwind, App Router.
2. Configurar estrutura de pastas, Prettier, ESLint.
3. Criar tema dark base no `globals.css` + Tailwind config (paleta).
4. Commit inicial.

### Fase 2 — Conteúdo e tipos (dia 1)
5. Criar `types/quiz.ts` com interfaces.
6. Gerar `data/questions.json` com 40 perguntas factualmente corretas (consultar docs do Claude Code quando em dúvida).
7. Criar `lib/questions.ts` com função `sortearPerguntasProgressivas()` (5 iniciantes + 6 intermediárias + 4 avançadas).

### Fase 3 — UI do quiz (dias 2–3)
8. Implementar Home `/`.
9. Implementar `/quiz` com `QuestionCard`, `Timer`, `Feedback`, `ScoreDisplay`.
10. Implementar lógica de scoring em `lib/scoring.ts` com testes unitários.
11. Implementar `/resultado`.

### Fase 4 — Ranking + Supabase (dia 4)
12. Criar projeto no Supabase, aplicar schema SQL.
13. Configurar `.env.local`, cliente Supabase em `lib/supabase.ts`.
14. Implementar API routes `/api/ranking` (POST/GET) com validação Zod e recálculo server-side.
15. Implementar página `/ranking` consumindo a API.
16. Implementar `NicknameForm` na tela de resultado.

### Fase 5 — Polish (dia 5)
17. Animações com Framer Motion (entrada de perguntas, feedback, resultado).
18. Responsividade fina (mobile).
19. Acessibilidade (ARIA, navegação por teclado, reduced-motion).
20. SEO básico (metadata, Open Graph).
21. Testar fluxo completo end-to-end manualmente.

### Fase 6 — Deploy (dia 5)
22. Deploy na Vercel conectando ao repositório Git.
23. Configurar variáveis de ambiente na Vercel.
24. Validar ranking em produção com múltiplas partidas.
25. Documentar README.md com setup local + deploy.

---

## 8. Riscos e Decisões em Aberto

| Item | Risco/Pergunta | Mitigação/Decisão |
|------|----------------|-------------------|
| Qualidade das perguntas | Perguntas factualmente incorretas geram desinformação | Claude Code deve consultar docs oficiais; revisão humana antes do deploy |
| Spam no ranking | Nicknames ofensivos ou bots | Lista de palavras proibidas + rate-limit por IP hash |
| Exposição da service role | Vazamento compromete todo o banco | Apenas em env var server-side; nunca no client |
| Randomização previsível | Usuário pode memorizar ordem | Seed por sessão baseada em `sessionId` + timestamp |
| Deploy sem Supabase configurado | Ranking quebra | Feature-flag para desabilitar ranking se env vars ausentes (fallback localStorage) |

---

## 9. Referências

- [Claude Code — Documentação Oficial](https://docs.claude.com/en/docs/claude-code/overview)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Agent SDK](https://docs.claude.com/en/api/agent-sdk)
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

---

## 10. Instruções finais para o Claude Code

Ao implementar este projeto:
1. **Leia este PRD por completo antes de começar**.
2. Crie um `CLAUDE.md` na raiz do projeto com convenções do codebase, comandos úteis (`pnpm dev`, `pnpm build`, `pnpm lint`) e decisões arquiteturais.
3. Faça commits semânticos pequenos e frequentes ao longo das fases.
4. Antes de cadastrar cada pergunta no `questions.json`, verifique a factualidade consultando a documentação oficial do Claude Code/Anthropic. Se tiver dúvida sobre uma feature, marque a pergunta como `// TODO: revisar` e siga.
5. Priorize **funcionalidade > estética no MVP**, mas não negligencie a acessibilidade.
6. Ao final, rode `pnpm build` e `pnpm lint` — deve passar sem erros.
7. Reporte ao usuário: URL de deploy, cobertura de perguntas atingida, e qualquer decisão que tenha divergido deste PRD com justificativa.

**Boa implementação! 🚀**
