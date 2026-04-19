# Setup Guide

Complete step-by-step setup for all three external services CallPilot depends on.

---

## Table of Contents

1. [Supabase](#1-supabase)
2. [ElevenLabs](#2-elevenlabs)
3. [NVIDIA NIM](#3-nvidia-nim)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Local Development Checklist](#5-local-development-checklist)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Supabase

CallPilot uses Supabase for:
- Postgres storage (calls, transcripts, QA scores, audit log)
- pgvector extension (1024-dim KB article embeddings with HNSW index)
- The `match_kb_articles` RPC for vector similarity search

### 1.1 Create a Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a region close to your users
3. Note the **project URL** (e.g. `https://abcdefgh.supabase.co`)

### 1.2 Enable pgvector

1. In the Supabase dashboard → **Database** → **Extensions**
2. Search for `vector` → **Enable**

> If you skip this, `npm run db:migrate` will fail with: `type "vector" does not exist`

### 1.3 Get Your Keys

Go to **Settings** → **API Keys**:

| Key | Where to find it | Variable name |
|---|---|---|
| Project URL | Settings → Data API → URL | `SUPABASE_URL` |
| Publishable key | Settings → API Keys → `sb_publishable_...` | `SUPABASE_PUBLISHABLE_KEY` |
| Secret key | Settings → API Keys → `sb_secret_...` | `SUPABASE_SECRET_KEY` |

Go to **Settings** → **Database** → **Connection string** → **URI** (Direct, port 5432):

```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

Add `?sslmode=require` at the end → this is your `DATABASE_URL`.

### 1.4 Apply Schema

```bash
npm run db:migrate
```

This runs `scripts/migrate.ts` which:
1. Connects via direct Postgres (`DATABASE_URL`)
2. Applies `db/schema.sql` idempotently (safe to run multiple times)
3. Creates tables: `calls`, `transcript_chunks`, `kb_articles`, `kb_gaps`, `qa_scores`, `audit_log`
4. Creates the `match_kb_articles` RPC for HNSW vector search
5. Verifies pgvector is installed

**Reset the KB table** (destructive, re-ingest only):
```bash
MIGRATE_RESET_KB=true npm run db:migrate
```

### 1.5 Ingest Knowledge Base

```bash
npm run db:ingest-kb
```

Reads the 8 Markdown files in `kb/novapay/`, generates 1024-dim embeddings via NVIDIA, and upserts them into `kb_articles`.

Verify retrieval works:
```bash
npm run smoke:rag
```

Expected output: 3 test queries each retrieve the correct article at rank 1.

---

## 2. ElevenLabs

CallPilot uses ElevenLabs for:
- Browser WebRTC audio session (customer speaks → transcript chunks stream to dashboard)
- Post-call webhook (call ended → full transcript + metadata sent to `/api/webhooks/call/end`)

### 2.1 Create an Agent

1. Go to [elevenlabs.io](https://elevenlabs.io) → **Conversational AI** → **Create Agent**
2. Choose the **Customer Support** template
3. Set the agent's first message to something like:
   > "Thank you for calling NovaPay support. My name is Aria, how can I help you today?"
4. Note the **Agent ID** from the URL or agent settings → `NEXT_PUBLIC_EL_AGENT_ID`

### 2.2 Get Your API Key

**Settings** → **API Keys** → create a new key → `ELEVENLABS_API_KEY`

### 2.3 Configure the Post-Call Webhook

1. In the agent settings → **Webhooks** tab
2. Add a webhook URL:
   - Local dev: use [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
   - Example: `https://your-tunnel.ngrok.io/api/webhooks/call/end`
3. Set the **webhook secret** — this is used for HMAC-SHA256 verification
4. Copy the secret → `ELEVENLABS_WEBHOOK_SECRET`

> **Local development tip:** CallPilot works fine without the webhook configured — you'll just miss the post-call summary panel. Everything during the call works regardless.

### 2.4 Verify

With the dev server running, visit:
```
http://localhost:3000/agent
```

Click **Start Call**. You should see the microphone permission prompt. After accepting, ElevenLabs connects via WebRTC and transcript chunks will start appearing.

---

## 3. NVIDIA NIM

CallPilot uses NVIDIA NIM for all AI inference:
- `llama-3.1-nemotron-nano-8b-v1` — intent classification (every ~2 seconds during a call)
- `llama-3.3-nemotron-super-49b-v1.5` — post-call summary + 8-criterion QA scoring
- `nv-embedqa-e5-v5` — 1024-dim embeddings at ingest and query time

One API key covers all three. NVIDIA provides free credits for evaluation.

### 3.1 Get an API Key

1. Go to [build.nvidia.com](https://build.nvidia.com)
2. Sign in / create account
3. **API Keys** → **Generate API Key**
4. Copy the key (starts with `nvapi-`) → `NVIDIA_API_KEY`

### 3.2 Verify Models Are Available

The models CallPilot uses are on the public NVIDIA NIM catalog:
- [llama-3.1-nemotron-nano-8b-v1](https://build.nvidia.com/nvidia/llama-3_1-nemotron-nano-8b-v1)
- [llama-3.3-nemotron-super-49b-v1.5](https://build.nvidia.com/nvidia/llama-3_3-nemotron-super-49b-v1)
- [nv-embedqa-e5-v5](https://build.nvidia.com/nvidia/nv-embedqa-e5-v5)

All are accessible via `https://integrate.api.nvidia.com/v1` — the OpenAI-compatible endpoint.

> The `OPENAI_API_KEY` in `.env.example` is a legacy artifact. CallPilot does not use OpenAI. Only `NVIDIA_API_KEY` is needed for all inference.

---

## 4. Environment Variables Reference

Full `.env.local` template with all required variables:

```env
# ─── Supabase ──────────────────────────────────────────────────
# Your project URL from Settings → Data API
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Publishable key (safe to use in browser) from Settings → API Keys
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Secret key (server-only, never exposed to browser) from Settings → API Keys
SUPABASE_SECRET_KEY=sb_secret_...

# Direct Postgres connection URI from Settings → Database → URI
# Append ?sslmode=require
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres?sslmode=require

# ─── ElevenLabs ────────────────────────────────────────────────
# Agent ID from your ElevenLabs agent URL or settings
# NEXT_PUBLIC_ prefix makes it available in the browser
NEXT_PUBLIC_EL_AGENT_ID=agent_...

# API key from ElevenLabs Settings → API Keys
ELEVENLABS_API_KEY=sk_...

# HMAC secret configured in your agent's webhook settings
ELEVENLABS_WEBHOOK_SECRET=your_webhook_secret_here

# ─── NVIDIA NIM ────────────────────────────────────────────────
# Single key covers all NIM models (LLM + embeddings)
NVIDIA_API_KEY=nvapi-...
```

### Which keys are used where?

| Variable | Used by | Exposed to browser? |
|---|---|---|
| `SUPABASE_URL` | Supabase client | No (server only via `lib/db.ts`) |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase client | No |
| `SUPABASE_SECRET_KEY` | Supabase admin client | No |
| `DATABASE_URL` | Migration script only | No |
| `NEXT_PUBLIC_EL_AGENT_ID` | ElevenLabs React SDK | **Yes** (agent ID is not secret) |
| `ELEVENLABS_API_KEY` | Webhook verification | No |
| `ELEVENLABS_WEBHOOK_SECRET` | HMAC verification | No |
| `NVIDIA_API_KEY` | LLM + embeddings | No |

---

## 5. Local Development Checklist

```
[ ] Node 20+ installed  (node --version)
[ ] npm 10+ installed   (npm --version)
[ ] npm install         (no errors)
[ ] .env.local created  (cp .env.example .env.local)
[ ] All env vars filled  in .env.local
[ ] Supabase project created with pgvector enabled
[ ] npm run db:migrate  (✅ Migration complete, ✅ pgvector ready)
[ ] npm run db:ingest-kb  (8 articles embedded)
[ ] npm run smoke:rag   (3/3 queries return correct article at rank 1)
[ ] npm run dev         (server starts at :3000)
[ ] http://localhost:3000/api/health → { ok: true, db: { vector_installed: true } }
[ ] http://localhost:3000/agent?demo=1 → demo mode runs without API keys
```

---

## 6. Troubleshooting

### `type "vector" does not exist`
pgvector is not enabled. Go to Supabase → Database → Extensions → enable `vector`.

### `ECONNREFUSED` or timeout on `db:migrate`
Check your `DATABASE_URL`. Make sure it uses port `5432` (direct connection), not `6543` (pooler). Add `?sslmode=require`.

### Transcript chunks aren't appearing
- Check browser console for WebRTC errors
- Verify `NEXT_PUBLIC_EL_AGENT_ID` is set correctly (it's public, so it's used directly in the browser)
- Open browser DevTools → Network → look for the SSE stream at `/api/stream`

### Post-call summary never loads
- The webhook needs to reach your local server — check your ngrok / tunnel URL
- Verify `ELEVENLABS_WEBHOOK_SECRET` matches what's configured in ElevenLabs
- Check server logs for `HMAC verification failed`

### Intent always shows as `unknown`
- Verify `NVIDIA_API_KEY` is valid
- Check server logs for NVIDIA API errors (rate limits or invalid key)
- Try the demo mode (`?demo=1`) — it bypasses all API calls to isolate the issue

### KB retrieval returns wrong articles
Run `npm run smoke:rag`. If queries fail, re-run `npm run db:ingest-kb` to re-embed. If still failing, check `NVIDIA_API_KEY` and `SUPABASE_SECRET_KEY`.

---

← [Back to README](../README.md) | [Architecture →](ARCHITECTURE.md)
