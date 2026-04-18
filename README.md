# CallPilot

AI co-pilot for customer support agents. Real-time KB retrieval, live transcript, sentiment, and post-call summaries — built on ElevenLabs Conversational AI, Claude, and Postgres+pgvector.

> Full product spec lives in [`CALLPILOT_PRD.md`](./CALLPILOT_PRD.md).

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **ElevenLabs** Conversational AI (browser SDK + post-call webhooks)
- **Claude** (`claude-sonnet-4-6` / Haiku) for intent, summary, QA scoring
- **Postgres + pgvector** on Railway for RAG and persistence
- **OpenAI `text-embedding-3-small`** for KB embeddings (placeholder until EL embedding API is GA)

## Phase 0 — Local setup

### Prerequisites
Node 20+, npm 10+, a Railway Postgres instance, ElevenLabs / Anthropic / OpenAI API keys.

### 1. External services
See setup steps in `CALLPILOT_PRD.md` §13 / §15. Short version:

| Service | What you need |
|---------|---------------|
| Railway | A Postgres service. Run `CREATE EXTENSION IF NOT EXISTS vector;` once via the Data tab. Copy `DATABASE_URL` (append `?sslmode=require`). |
| ElevenLabs | Agent ID + API key. Create agent from "Customer Support" template. |
| Anthropic | API key from console. |
| OpenAI | API key (used for embeddings only). |

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
  page.tsx              landing
  agent/page.tsx        co-pilot dashboard (Phase 2)
  api/health/route.ts   DB connectivity check
lib/
  db.ts                 pg pool (singleton, SSL-aware)
components/             UI components (Phase 2)
types/index.ts          shared TypeScript types
db/schema.sql           idempotent Postgres schema
scripts/
  migrate.ts            applies db/schema.sql
  ingest-kb.ts          embeds kb/novapay/*.md into pgvector
kb/novapay/             knowledge base markdown (Phase 1)
```

## Roadmap

Phase 0 ✅ scaffold · Phase 1 KB · Phase 2 UI · Phase 3 live call · Phase 4 post-call · Phase 5 deploy.
See `CALLPILOT_PRD.md` §16–17 for the full breakdown.
