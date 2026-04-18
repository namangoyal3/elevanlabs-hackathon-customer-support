# CallPilot

AI co-pilot for customer support agents. Real-time KB retrieval, live transcript, sentiment, and post-call summaries — built on ElevenLabs Conversational AI, NVIDIA Nemotron, and Postgres+pgvector.

> Full product spec: [`CALLPILOT_PRD.md`](./CALLPILOT_PRD.md) · Task tracker: [`TASKLIST.md`](./TASKLIST.md)

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript, Tailwind) |
| Telephony | ElevenLabs Conversational AI (browser SDK + webhooks) |
| LLM | NVIDIA Nemotron via NIM — `nano-8b` (intent) · `super-49b-v1.5` (summary/QA) |
| Database | Supabase — Postgres + pgvector (RAG + persistence) |
| Embeddings | OpenAI `text-embedding-3-small` (1536-dim) |
| State | Zustand |

---

## Prerequisites

- Node 20+ and npm 10+
- A [Supabase](https://supabase.com) project
- API keys: ElevenLabs · NVIDIA NIM · OpenAI

---

## Running the Project

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd elevanlabs-hackathon-customer-support
npm install
```

### 2. Configure external services

| Service | What you need |
|---------|---------------|
| **Supabase** | Create a new project. Go to **Settings → API Keys** and copy the `URL`, `Publishable` key, and `Secret` key. Go to **Settings → Database → Connection string → URI** (Direct, port 5432) and copy as `DATABASE_URL` (append `?sslmode=require`). |
| **ElevenLabs** | Create an agent from the "Customer Support" template. Copy the **Agent ID** and your **API Key**. |
| **NVIDIA NIM** | Sign up at [build.nvidia.com](https://build.nvidia.com) and create an API key for the Nemotron model family. |
| **OpenAI** | Create an API key at [platform.openai.com](https://platform.openai.com) (used for KB embeddings only). |

### 3. Set environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in all values:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?sslmode=require

# ElevenLabs
ELEVENLABS_API_KEY=sk_...
NEXT_PUBLIC_EL_AGENT_ID=your_agent_id
ELEVENLABS_WEBHOOK_SECRET=your_webhook_secret

# NVIDIA NIM (Nemotron)
NVIDIA_API_KEY=nvapi-...

# OpenAI (embeddings only)
OPENAI_API_KEY=sk-...
```

### 4. Run database migrations

**Option A — via Supabase SQL Editor (recommended)**

1. Open your Supabase project → **SQL Editor → New query**
2. Paste and run [`db/migrations/001_initial_schema.sql`](./db/migrations/001_initial_schema.sql)
3. Optionally paste and run [`db/migrations/002_seed_demo_data.sql`](./db/migrations/002_seed_demo_data.sql) for demo data

**Option B — via npm script (requires `DATABASE_URL` to be set)**

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

### 5. Ingest the knowledge base (Phase 1)

After creating KB articles in `kb/novapay/*.md`:

```bash
npm run db:ingest-kb
```

This embeds all markdown articles into pgvector using OpenAI embeddings.

### 6. Start the development server

```bash
npm run dev
```

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Landing page |
| http://localhost:3000/agent | Agent co-pilot dashboard |
| http://localhost:3000/api/health | DB health check — should return `{ ok: true, db: { vector_installed: true } }` |

### 7. Type check

```bash
npm run typecheck
```

---

## Project Layout

```
app/
  page.tsx                    Landing page
  agent/page.tsx              Co-pilot dashboard (Phase 2)
  api/
    health/route.ts           DB health check endpoint
    stream/route.ts           SSE push endpoint (Phase 3)
    webhooks/call/end/        ElevenLabs post-call webhook (Phase 4)
lib/
  db.ts                       Supabase admin client (singleton)
  store.ts                    Zustand call state store (Phase 2)
  rag.ts                      Embedding + vector search (Phase 3)
  ai.ts                       NVIDIA Nemotron NIM client (Phase 3)
  use-call-pilot.ts           ElevenLabs hook (Phase 3)
  transcript-handler.ts       Transcript persistence (Phase 3)
  post-call.ts                Summary + QA pipeline (Phase 4)
components/                   UI components (Phase 2)
types/index.ts                Shared TypeScript interfaces
db/
  schema.sql                  Idempotent Postgres schema
  migrations/
    001_initial_schema.sql    Full schema + RPC functions (run in Supabase)
    002_seed_demo_data.sql    Demo calls, transcripts, QA data
scripts/
  migrate.ts                  Runs db/schema.sql via raw pg connection
  ingest-kb.ts                Embeds kb/novapay/*.md into pgvector
kb/novapay/                   Knowledge base markdown articles (Phase 1)
TASKLIST.md                   Phase-by-phase task checklist
CALLPILOT_PRD.md              Full product requirements document
```

---

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 0 — Scaffold | ✅ Complete | Next.js setup, DB schema, types, migration scripts |
| 1 — Knowledge Base | Pending | Write KB articles, ingest into pgvector |
| 2 — Co-Pilot UI | Pending | Agent dashboard, Zustand store, all components |
| 3 — Live Call | Pending | ElevenLabs integration, RAG pipeline, SSE stream |
| 4 — Post-Call | Pending | Webhook, summarization, QA scoring, KB gap detection |
| 5 — Deploy | Pending | Vercel deployment, RLS, demo scenarios |

See [`TASKLIST.md`](./TASKLIST.md) for the detailed checklist and [`CALLPILOT_PRD.md`](./CALLPILOT_PRD.md) for the full spec.
