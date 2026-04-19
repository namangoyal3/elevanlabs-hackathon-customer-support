<div align="center">

# ⚡ CallPilot

### AI Co-Pilot for Customer Support Agents

*Real-time intelligence. Every call. Zero typing.*

[![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-FF6B35?style=flat-square)](https://elevenlabs.io)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA_NIM-76B900?style=flat-square&logo=nvidia&logoColor=white)](https://build.nvidia.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)

[Live Demo](#demo-mode) · [Quick Start](#quick-start) · [Architecture](docs/ARCHITECTURE.md) · [Full Setup](docs/SETUP.md) · [PRD](CALLPILOT_PRD.md)

---

</div>

## The Problem

A support agent is on a live call. The customer's card just got declined — again. The agent is:

- Ctrl+F-ing a 400-page PDF knowledge base mid-sentence
- Typing call notes while still talking
- Missing the customer's rising frustration until they demand a manager

**CallPilot fixes all three. Simultaneously. In real time.**

---

## What It Does

CallPilot is a browser dashboard that sits alongside an agent's phone call. It listens, thinks, and surfaces exactly what the agent needs — before they know they need it.

```
┌─────────────────────────────────────────────────────────────────┐
│                    BEFORE THE CALL                              │
│  ┌──────────────────┐  ┌─────────────────────────────────────┐  │
│  │  Who's calling?  │  │  Predicted KB articles pre-loaded   │  │
│  │  • Name, tier    │  │  based on customer's known intent   │  │
│  │  • Open tickets  │  │                                     │  │
│  │  • Call history  │  │  Agent starts knowledgeable.        │  │
│  └──────────────────┘  └─────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    DURING THE CALL                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  Live        │  │  Intent      │  │  Matching KB       │    │
│  │  Transcript  │  │  Detection   │  │  Articles          │    │
│  │              │  │              │  │  (auto-updated)    │    │
│  │  Agent ↔     │  │  🏦 failed_  │  │  ─────────────     │    │
│  │  Customer    │  │  transaction │  │  § Policy 3.2      │    │
│  │  split view  │  │              │  │  § Refund SLA      │    │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Sentiment ████████████░░░░░░ Neutral → Frustrated     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ⚠ ESCALATION ALERT — Customer sentiment critically low        │
│                                                                  │
│  Suggested replies:                                             │
│  [ I completely understand your frustration... ]               │
│  [ Let me check that transaction status now... ]               │
├─────────────────────────────────────────────────────────────────┤
│                    AFTER THE CALL                               │
│  ✅ Auto-generated summary          ✅ 8-criterion QA score     │
│  ✅ Disposition + follow-ups        ✅ CSAT prediction           │
│  ✅ Sentiment trend analysis        ✅ Coaching suggestions      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### Pre-Call Intelligence
| Feature | What it does |
|---|---|
| **Persona Picker** | 3 demo NovaPay customers with tier, VIP status, open tickets, and predicted intent |
| **Caller Brief Panel** | Avatar, account ID, call history, tier badge (Standard / Premium / Enterprise) |
| **Predictive KB Preload** | KB articles fetched *before* the call starts based on the customer's known issue |

### During-Call Co-Pilot
| Feature | What it does |
|---|---|
| **Live Transcript** | Real-time speech-to-text, split by speaker (Agent / Customer), auto-scrolling |
| **Intent Detection** | Classifies into 8 categories via `llama-3.1-nemotron-nano-8b` every ~2 seconds |
| **Dynamic KB Surfacing** | Vector RAG search triggered on every intent change — top 2 articles always current |
| **Sentiment Bar** | Smooth gradient track: Hostile → Negative → Neutral → Positive, keyword-scored |
| **Escalation Alert** | Red dismissible banner fires when sentiment < −0.6, with 10-second cooldown |
| **Suggested Replies** | 3 canned responses per intent, click-to-clipboard with visual feedback |
| **Live Call Timer** | MM:SS elapsed timer in header during active call |

### Post-Call Automation
| Feature | What it does |
|---|---|
| **AI Call Summary** | Generated by `llama-3.3-nemotron-super-49b-v1.5`, zero agent input |
| **Disposition Classification** | Resolved / Follow-up / Escalated / Abandoned |
| **Follow-up Actions** | Up to 4 structured action items extracted automatically |
| **8-Criterion QA Scorecard** | Greeting, Accuracy, Empathy, Compliance, FCR, Escalation, Duration, CRM Update |
| **CSAT Prediction** | 0–100% score estimated from transcript signals |
| **Coaching Suggestions** | AI-generated improvement notes tied to lowest QA criteria |

### Infrastructure
| Feature | What it does |
|---|---|
| **SSE Real-Time Push** | Server-Sent Events stream per call — no polling, browser auto-reconnects |
| **HMAC Webhook Verification** | Post-call webhook signed with SHA-256, constant-time comparison |
| **Idempotent Processing** | Duplicate `call_end` events from ElevenLabs are safely ignored |
| **Demo Mode** | `?demo=1` — full scripted call simulation, no API keys needed |
| **Audit Log** | Immutable append-only event log for every call lifecycle event |

---

## Tech Stack

```
┌─────────────────────────────────────────────────────┐
│                 FRONTEND                            │
│   Next.js 14 (App Router) · TypeScript · Tailwind  │
│   Zustand (state machine) · ElevenLabs React SDK   │
└────────────────────┬────────────────────────────────┘
                     │ WebRTC (audio) + SSE (updates)
┌────────────────────▼────────────────────────────────┐
│                 BACKEND (API Routes)                │
│   /api/transcript  →  intent + KB + sentiment       │
│   /api/stream      →  SSE pub/sub per callId        │
│   /api/webhooks    →  HMAC-verified post-call hook  │
└────┬──────────────────────────┬─────────────────────┘
     │                          │
┌────▼────────┐        ┌────────▼──────────────────┐
│  NVIDIA NIM │        │       SUPABASE            │
│             │        │                           │
│ nano-8b     │        │ Postgres + pgvector       │
│ (intent,    │        │ HNSW cosine index         │
│  ~2s)       │        │ match_kb_articles() RPC   │
│             │        │ calls · transcripts ·     │
│ super-49b   │        │ kb_articles · qa_scores   │
│ (summary,   │        │ audit_log                 │
│  post-call) │        │                           │
│             │        └───────────────────────────┘
│ nv-embedqa  │
│ (1024-dim   │
│  embeddings)│
└─────────────┘
```

| Layer | Technology |
|---|---|
| Framework | Next.js 14, TypeScript, App Router |
| Styling | Tailwind CSS 3, custom warm-dark design tokens |
| State | Zustand 4 (state-machine with transition guards) |
| Voice | ElevenLabs `@elevenlabs/react` SDK, WebRTC |
| LLM (fast) | NVIDIA `llama-3.1-nemotron-nano-8b-v1` — intent classification |
| LLM (quality) | NVIDIA `llama-3.3-nemotron-super-49b-v1.5` — summary + QA |
| Embeddings | NVIDIA `nv-embedqa-e5-v5` (1024-dim, asymmetric passage/query) |
| Database | Supabase Postgres + pgvector, HNSW index |
| Validation | Zod 3 |
| Tests | Node.js `node:test` (9 suites, 65 tests) |

---

## Quick Start

### Prerequisites
- Node 20+ and npm 10+
- [Supabase](https://supabase.com) project (free tier works)
- [ElevenLabs](https://elevenlabs.io) account
- [NVIDIA NIM](https://build.nvidia.com) API key

### 1 — Clone & Install

```bash
git clone https://github.com/your-org/elevanlabs-hackathon-customer-support
cd elevanlabs-hackathon-customer-support
npm install
```

### 2 — Configure Environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your keys:

```env
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
DATABASE_URL=postgresql://postgres:...@db.xxxx.supabase.co:5432/postgres?sslmode=require

# ElevenLabs
NEXT_PUBLIC_EL_AGENT_ID=your_agent_id
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_WEBHOOK_SECRET=your_hmac_secret

# NVIDIA NIM (covers LLM + embeddings)
NVIDIA_API_KEY=nvapi-...
```

> **Detailed setup for each service:** → [docs/SETUP.md](docs/SETUP.md)

### 3 — Initialize Database

```bash
npm run db:migrate
```

Expected:
```
→ Connected to Postgres
→ Applying db/schema.sql
✅ Migration complete
✅ pgvector ready
```

### 4 — Ingest Knowledge Base

```bash
npm run db:ingest-kb
```

This embeds the 8 NovaPay KB articles via NVIDIA and stores them in Supabase with HNSW vector index.

### 5 — Verify & Run

```bash
npm run dev
```

| URL | What you'll see |
|---|---|
| `http://localhost:3000` | Landing page |
| `http://localhost:3000/agent` | Agent dashboard |
| `http://localhost:3000/api/health` | DB health check |
| `http://localhost:3000/agent?demo=1` | **Demo mode — no API keys needed** |

---

## Demo Mode

No ElevenLabs account? No problem.

```
http://localhost:3000/agent?demo=1
```

This plays back a full scripted NovaPay call — failed transaction → escalation alert → resolution — using recorded transcript chunks. All real-time features activate exactly as they would in a live call. Perfect for evaluation, testing, and demos.

---

## Project Structure

```
├── app/
│   ├── page.tsx                    Landing page
│   ├── agent/page.tsx              Agent dashboard (all panels assembled)
│   └── api/
│       ├── health/                 DB connectivity check
│       ├── kb/preload/             Fetch KB articles by ID
│       ├── transcript/             Live transcript → intent/KB/sentiment
│       ├── stream/                 SSE push stream per callId
│       └── webhooks/call/end/      HMAC-verified post-call webhook
│
├── components/                     10 UI components
│   ├── CallerBrief.tsx             Contact card with tier + VIP badge
│   ├── CallControls.tsx            Start / End / New call state machine
│   ├── DemoCycler.tsx              Scripted demo scenario (?demo=1)
│   ├── EscalationAlert.tsx         Red dismissible alert banner
│   ├── IntentBadge.tsx             Colored intent pill (8 categories)
│   ├── KbCard.tsx                  KB article card with snippet
│   ├── LiveTranscript.tsx          Auto-scrolling speaker-split transcript
│   ├── PersonaPicker.tsx           3-card customer selection screen
│   ├── PostCallSummary.tsx         Summary drawer + QA scorecard
│   ├── SentimentBar.tsx            Gradient sentiment track
│   └── SuggestedReplies.tsx        Click-to-clipboard reply chips
│
├── lib/                            All business logic
│   ├── store.ts                    Zustand state machine
│   ├── transcript-handler.ts       Rolling buffer + 2s debounce
│   ├── intent-parser.ts            Defensive LLM JSON → IntentResult
│   ├── rag.ts                      Vector search via Supabase RPC
│   ├── nvidia-embed.ts             embedPassage() / embedQuery()
│   ├── nvidia-llm.ts               nano-8b + super-49b clients
│   ├── post-call.ts                Summary + QA pipeline
│   ├── sse-bus.ts                  In-memory pub/sub per callId
│   ├── hmac.ts                     HMAC-SHA256 verify + sign
│   └── elevenlabs-agent.ts         useCallPilot() hook
│
├── db/schema.sql                   Idempotent Postgres schema + RPCs
├── kb/novapay/                     8 KB articles (Markdown)
├── scripts/                        migrate · ingest-kb · smoke-rag
├── tests/                          9 test suites (65 tests)
└── docs/
    ├── PLAN.md                     Per-phase implementation plan
    ├── SETUP.md                    Detailed service setup guide
    ├── ARCHITECTURE.md             Technical decisions + data flow
    └── WHISPER_COACH.md            Killer next feature (unimplemented)
```

---

## Commands

```bash
# Development
npm run dev              # Start dev server at :3000
npm run build            # Production build
npm run start            # Start production server

# Quality
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint
npm test                 # Run all 9 test suites (65 tests)

# Database
npm run db:migrate                       # Apply schema (idempotent)
MIGRATE_RESET_KB=true npm run db:migrate # ⚠ Destructive — reset kb_articles
npm run db:ingest-kb                     # Embed KB articles into pgvector
npm run smoke:rag                        # Verify 3 PRD queries retrieve correct articles
```

---

## Intent Categories

The live intent classifier maps every call to one of 8 categories:

| Intent | Description |
|---|---|
| `failed_transaction` | UPI failure, payment not processed |
| `kyc_issue` | KYC verification pending or rejected |
| `loan_status` | Loan application or disbursement query |
| `wallet_topup` | Wallet top-up limits or failures |
| `chargeback` | Dispute or chargeback request |
| `account_freeze` | Account locked or restricted |
| `rewards` | Cashback, points, referral queries |
| `privacy` | Data deletion, consent, privacy requests |

Each intent maps to pre-loaded KB articles and a set of 3 suggested replies.

---

## Knowledge Base

8 Markdown articles for the NovaPay demo, stored as 1024-dim vectors in Supabase:

| Article | Covers |
|---|---|
| [Failed Transaction Policy](kb/novapay/failed-transaction-policy.md) | Refund SLAs, retry logic, reconciliation |
| [KYC Verification Guide](kb/novapay/kyc-verification-guide.md) | Document requirements, re-submission |
| [Loan Disbursement FAQ](kb/novapay/loan-disbursement-faq.md) | Timelines, eligibility, status checks |
| [Wallet Top-up Limits](kb/novapay/wallet-topup-limits.md) | Daily limits, failure reasons, UPI links |
| [Chargeback Disputes](kb/novapay/chargeback-disputes.md) | Dispute window, evidence requirements |
| [Account Freeze Policy](kb/novapay/account-freeze-policy.md) | Freeze triggers, unfreeze process |
| [Rewards & Cashback](kb/novapay/reward-points-cashback.md) | Points system, expiry, redemption |
| [Privacy & Data Deletion](kb/novapay/privacy-data-deletion.md) | DPDP Act compliance, deletion SLAs |

---

## Roadmap

| Phase | Status | Branch | Highlights |
|---|---|---|---|
| Phase 0 — Scaffold | ✅ Done | `phase-0-setup` | Next.js, Supabase schema, env config |
| Phase 1 — KB + RAG | ✅ Done | `phase-1-kb` | 8 articles, HNSW index, 3 demo queries verified |
| Phase 2 — Agent UI | ✅ Done | `phase-2-ui` | 10 components, 4 Zustand state transitions |
| Phase 3 — Live Call | ✅ Done | `phase-3-live-call` | ElevenLabs SDK, intent detection, SSE |
| Phase 4 — Post-Call | ✅ Done | `phase-4-post-call` | HMAC webhook, summary, 8-criterion QA |
| Phase 5 — Polish | ⏳ Active | `phase-5-polish` | Suggested replies, responsive, animations |
| **Whisper Coach** | 💡 Proposed | — | [AI audio coaching in real time →](docs/WHISPER_COACH.md) |

---

## Architecture Deep Dive

→ [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

Key decisions:
- **SSE over WebSocket** — native `ReadableStream`, auto-reconnect, no custom server
- **Two-tier LLM** — `nano-8b` for latency-critical intent (every ~2s), `super-49b` for quality-critical summary (once, post-call)
- **Asymmetric embeddings** — `passage` type at ingest, `query` type at search — material improvement in retrieval recall
- **HNSW index** — better recall than IVFFlat, no training step required
- **Debounced transcript handler** — 10-utterance rolling buffer, 2s silence window, single LLM call per burst

---

## What's Next

The one feature that could make CallPilot genuinely transformative — but isn't built yet:

**[AI Whisper Coach →](docs/WHISPER_COACH.md)**

Instead of text on a screen, the AI *speaks* coaching tips directly into the agent's ear during the live call. The customer doesn't hear it. The agent never breaks eye contact with their screen. ElevenLabs TTS, real-time, private audio channel.

---

<div align="center">

Built for the **ElevenLabs Hackathon** · Demo company: **NovaPay Fintech**

*The agent shouldn't have to think about where the answer is. CallPilot already found it.*

</div>
