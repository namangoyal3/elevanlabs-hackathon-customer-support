# CallPilot

AI co-pilot for customer support agents. Real-time KB retrieval, live transcript, sentiment, escalation alerts, and post-call summaries — built on ElevenLabs Conversational AI, NVIDIA Nemotron, and Supabase Postgres + pgvector.

> Full product spec lives in [`CALLPILOT_PRD.md`](./CALLPILOT_PRD.md).

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **ElevenLabs** Conversational AI (browser SDK + post-call webhooks)
- **NVIDIA Nemotron** via NIM (OpenAI-compatible) for intent (`nano-8b`), summary + QA (`super-49b-v1.5`)
- **Supabase** (Postgres + pgvector + JS SDK) for RAG and persistence
- **NVIDIA `nv-embedqa-e5-v5`** (1024-dim, asymmetric) for KB embeddings — passage at ingest, query at search

## Phase 0 — Local setup

### Prerequisites
Node 20+, npm 10+, a Supabase project, ElevenLabs + NVIDIA API keys.

### 1. External services
See setup steps in `CALLPILOT_PRD.md` §13 / §15. Short version:

| Service | What you need |
|---------|---------------|
| Supabase | New project. Database → Extensions → enable `vector`. Settings → Data API → copy `URL`. Settings → API Keys → copy `Publishable` (`sb_publishable_…`) and `Secret` (`sb_secret_…`) keys. Settings → Database → Connection string → URI (Direct, port 5432) → copy as `DATABASE_URL` (append `?sslmode=require`). |
| ElevenLabs | Agent ID + API key. Create agent from "Customer Support" template. |
| NVIDIA | API key from build.nvidia.com. Used for Nemotron LLM family (`nano-8b` + `super-49b-v1.5`) AND embeddings (`nv-embedqa-e5-v5`). |

### 2. Install
```bash
npm install
cp .env.example .env.local      # then fill in real values
```

### 3. Run migrations
```bash
npm run db:migrate
```
Expected output:
```
→ Connected to Postgres
→ Applying db/schema.sql
✅ Migration complete
✅ pgvector ready
```

### 4. Verify
```bash
npm run dev
```
Open http://localhost:3000 → click "Open Agent Dashboard".
Visit http://localhost:3000/api/health → should return `{ ok: true, db: { now: ..., vector_installed: true } }`.

## Project layout

```
app/
  page.tsx                         landing
  agent/page.tsx                   co-pilot dashboard
  api/health/route.ts              DB connectivity check
  api/kb/preload/route.ts          GET ?ids=a,b,c → KB articles
  api/transcript/route.ts          POST live transcript chunk → intent/KB/sentiment pipeline
  api/stream/route.ts              GET SSE for a callId
  api/webhooks/call/end/route.ts   HMAC-verified post-call webhook
lib/
  db.ts                            Supabase admin client (lazy, no-store fetch)
  rag.ts                           ragSearch via match_kb_articles RPC
  nvidia-embed.ts                  embedPassage / embedQuery
  nvidia-llm.ts                    nano-8b + super-49b clients
  intent-parser.ts                 defensive LLM JSON → IntentResult
  transcript-handler.ts            rolling buffer, debounce, sentiment
  sse-bus.ts                       in-memory pub/sub
  elevenlabs-agent.ts              useCallPilot hook
  post-call.ts                     summary + QA pipeline
  summary.ts · qa-criteria.ts      summary/QA helpers + 8-criterion rubric
  hmac.ts                          HMAC-SHA256 verify/sign
  store.ts                         Zustand CallState store
  demo-personas.ts · suggested-replies.ts
components/                        10 UI components (CallerBrief, LiveTranscript, …)
types/index.ts                     shared TypeScript types
db/schema.sql                      idempotent Postgres schema + RPCs
scripts/
  migrate.ts                       applies db/schema.sql
  ingest-kb.ts                     embeds kb/novapay/*.md into pgvector
  smoke-rag.ts                     end-to-end retrieval check
kb/novapay/                        8 knowledge-base markdown articles
tests/                             node:test suites (65 tests)
docs/PLAN.md                       per-phase implementation plan
```

## Roadmap

- **Phase 0 ✅** scaffold · branch [`phase-0-setup`](../../tree/phase-0-setup)
- **Phase 1 ✅** KB + RAG · branch [`phase-1-kb`](../../tree/phase-1-kb) · 8 KB articles, 3 demo scenarios retrieve correctly
- **Phase 2 ✅** Agent UI + Zustand store · branch [`phase-2-ui`](../../tree/phase-2-ui) · 10 components, 4 state transitions
- **Phase 3 ✅** Live call pipeline · branch [`phase-3-live-call`](../../tree/phase-3-live-call) · ElevenLabs SDK + intent detection + SSE
- **Phase 4 ✅** Post-call webhook · branch [`phase-4-post-call`](../../tree/phase-4-post-call) · HMAC + summary + 8-criterion QA
- **Phase 5 ⏳** Polish + deploy · branch [`phase-5-polish`](../../tree/phase-5-polish) · responsive stack, suggested replies

See [`docs/PLAN.md`](docs/PLAN.md) for per-phase exit criteria and locked architecture decisions.

## Commands

```bash
npm run dev                  # Next.js dev server
npm run typecheck            # tsc --noEmit
npm test                     # node:test suites in tests/
npm run db:migrate           # apply db/schema.sql
MIGRATE_RESET_KB=true npm run db:migrate  # destructive — drop + recreate kb_articles
npm run db:ingest-kb         # embed kb/novapay/*.md via NVIDIA → kb_articles
npm run smoke:rag            # verify the 3 PRD demo queries retrieve the right articles
```
