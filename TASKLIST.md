# CallPilot — Project Task List

> Tracks all implementation tasks across phases. Check boxes as you go.

---

## Phase 0 — Scaffold ✅ COMPLETE

- [x] Initialize Next.js 14 project (App Router, TypeScript, Tailwind)
- [x] Define shared TypeScript types (`types/index.ts`)
- [x] Create Supabase admin client singleton (`lib/db.ts`)
- [x] Write idempotent PostgreSQL schema (`db/schema.sql`)
  - [x] `calls` table
  - [x] `transcript_chunks` table
  - [x] `kb_articles` table with pgvector (1536-dim, HNSW index)
  - [x] `kb_gaps` table
  - [x] `qa_scores` table
  - [x] `audit_log` table
  - [x] `health()` RPC function
  - [x] `match_kb_articles()` RPC function
- [x] Migration script (`scripts/migrate.ts`)
- [x] KB ingestion script (`scripts/ingest-kb.ts`)
- [x] Landing page (`app/page.tsx`)
- [x] Health check API endpoint (`app/api/health/route.ts`)
- [x] Agent dashboard placeholder (`app/agent/page.tsx`)
- [x] Configure `.env.example` and `.env.local`
- [x] Tailwind custom dark theme (bg, accent, alert, muted)
- [x] Write `CALLPILOT_PRD.md` (full product spec)

---

## Phase 1 — Knowledge Base Ingestion

- [ ] Create `/kb/novapay/` directory
- [ ] Write KB markdown articles (8 total from PRD §4.1):
  - [ ] `upi-payment-failure.md` — UPI payment failure troubleshooting
  - [ ] `loan-emi-schedule.md` — EMI schedule and calculation
  - [ ] `wallet-kyc-upgrade.md` — KYC upgrade process
  - [ ] `account-freeze-dispute.md` — Account freeze and dispute resolution
  - [ ] `cashback-rewards.md` — Cashback and rewards program
  - [ ] `international-transfer.md` — International transfer limits and fees
  - [ ] `fd-premature-closure.md` — Fixed deposit premature closure
  - [ ] `nominee-update.md` — Nominee update process
- [ ] Configure `OPENAI_API_KEY` in `.env.local`
- [ ] Run `npm run db:ingest-kb` and verify embeddings in Supabase
- [ ] Test RAG: query `match_kb_articles()` RPC with a sample embedding

---

## Phase 2 — Co-Pilot UI

### Setup
- [ ] Create `/components/` directory structure
- [ ] Install/verify Zustand store setup

### Zustand Store
- [ ] Create `lib/store.ts` — `CallState` store with `useCallStore` hook
  - [ ] State: `callId`, `status`, `contact`, `transcript`, `kbCards`, `sentimentScore`, `intentLabel`, `escalationRisk`, `suggestedReplies`
  - [ ] Actions: `setContact`, `addTranscriptChunk`, `setKbCards`, `setSentiment`, `setIntent`, `setStatus`

### UI Components (`/components/`)
- [ ] `CallerBrief.tsx` — Contact card (name, tier badge, VIP flag, open tickets, call history)
- [ ] `LiveTranscript.tsx` — Scrolling transcript with speaker labels and auto-scroll
- [ ] `SentimentBar.tsx` — Real-time sentiment meter (−1 to +1 range)
- [ ] `IntentBadge.tsx` — Detected intent label + confidence percentage
- [ ] `KbCard.tsx` — Knowledge base article card with title, snippet, similarity score, URL link
- [ ] `SuggestedReplies.tsx` — Clickable suggested reply chips
- [ ] `EscalationAlert.tsx` — Red banner when escalation risk detected
- [ ] `PostCallSummary.tsx` — Summary panel (disposition, actions, CSAT prediction, QA score)
- [ ] `StartCallButton.tsx` — Idle state CTA with pre-call loading

### Agent Dashboard Layout (`app/agent/page.tsx`)
- [ ] Replace placeholder with full 40/60 split layout
- [ ] Left column (40%): `CallerBrief` → `LiveTranscript` → `SentimentBar`
- [ ] Right column (60%): `IntentBadge` → KB cards list → `SuggestedReplies`
- [ ] Top bar: call status indicator, timer, `EscalationAlert`
- [ ] Footer: `PostCallSummary` (visible after call ends)

---

## Phase 3 — Live Call Integration

### ElevenLabs Integration
- [ ] Configure `ELEVENLABS_API_KEY` and `NEXT_PUBLIC_EL_AGENT_ID` in `.env.local`
- [ ] Create `lib/use-call-pilot.ts` — `useCallPilot` hook
  - [ ] Wrap `@elevenlabs/react` `useConversation`
  - [ ] Wire `onMessage` → transcript chunk handler
  - [ ] Wire `onConnect` / `onDisconnect` → call state transitions
  - [ ] Wire `onError` → toast notification

### RAG Pipeline
- [ ] Create `lib/rag.ts`
  - [ ] `embed(text: string): Promise<number[]>` — OpenAI `text-embedding-3-small`
  - [ ] `searchKb(query: string, threshold?: number, topK?: number): Promise<KbArticle[]>` — calls `match_kb_articles` RPC

### Intent & Sentiment
- [ ] Create `lib/ai.ts` — NVIDIA Nemotron NIM client (OpenAI-compatible)
  - [ ] `detectIntent(transcript: TranscriptChunk[]): Promise<{ label: string; confidence: number }>`
  - [ ] `scoreSentiment(text: string): Promise<number>` — returns −1.0 to +1.0
  - [ ] `detectEscalationRisk(transcript: TranscriptChunk[], sentimentScore: number): Promise<boolean>`
  - [ ] `suggestReplies(transcript: TranscriptChunk[], kbCards: KbArticle[]): Promise<string[]>`

### SSE Endpoint
- [ ] Create `app/api/stream/route.ts` — Server-Sent Events endpoint
  - [ ] Accept `callId` query param
  - [ ] Push `kb_cards`, `sentiment`, `intent`, `suggested_replies` events
  - [ ] Handle client disconnect cleanup

### Transcript Persistence
- [ ] Create `lib/transcript-handler.ts`
  - [ ] `saveChunk(callId: string, chunk: TranscriptChunk): Promise<void>` — upsert to `transcript_chunks`
  - [ ] `initCall(contactId: string): Promise<string>` — insert to `calls`, return `callId`

### Pre-Call Loading
- [ ] Implement pre-call contact lookup (mock data or Supabase `contacts` table)
- [ ] Pre-load KB articles for predicted intent before call starts

---

## Phase 4 — Post-Call Automation

### Webhook Handler
- [ ] Configure `ELEVENLABS_WEBHOOK_SECRET` in `.env.local`
- [ ] Create `app/api/webhooks/call/end/route.ts`
  - [ ] Verify ElevenLabs HMAC signature
  - [ ] Extract `call_id`, transcript, duration from payload
  - [ ] Trigger post-call pipeline (async)

### Post-Call Pipeline (`lib/post-call.ts`)
- [ ] `generateSummary(callId: string): Promise<CallSummary>` — NVIDIA Nemotron `super-49b-v1.5`
  - [ ] Disposition classification
  - [ ] Follow-up actions extraction
  - [ ] Sentiment trend analysis
  - [ ] CSAT prediction
- [ ] `scoreQa(callId: string, summary: CallSummary): Promise<void>` — score against QA rubric, insert to `qa_scores`
- [ ] `detectKbGaps(callId: string): Promise<void>` — identify unanswered questions, insert to `kb_gaps`
- [ ] `updateCall(callId: string, summary: CallSummary, qaScore: number): Promise<void>` — update `calls` row
- [ ] `logAudit(event: string, entityId: string, payload: object): Promise<void>` — append to `audit_log`

### CRM Sync (Placeholder)
- [ ] Create `lib/crm.ts` — stub `writeToCrm()` gated behind `CRM_TYPE` env var
- [ ] Wire to post-call pipeline after summary is generated

---

## Phase 5 — Polish & Deploy

### Demo Prep
- [ ] Set up 3 demo scenarios in KB (from PRD):
  - [ ] Scenario A: UPI payment failure (resolved)
  - [ ] Scenario B: Loan EMI dispute (escalated)
  - [ ] Scenario C: KYC upgrade request (follow-up)
- [ ] Record demo video (fallback for live demo failures)
- [ ] Prepare demo script with talking points

### Production Config
- [ ] Enable Row Level Security (RLS) on all Supabase tables
- [ ] Add `contacts` table (or mock data seeding script)
- [ ] Set production environment variables in Vercel
- [ ] Configure ElevenLabs agent for production (voice, system prompt)

### Deployment
- [ ] Deploy to Vercel (`vercel --prod`)
- [ ] Verify `/api/health` returns `vector_installed: true` in prod
- [ ] Test live ElevenLabs call in production environment
- [ ] Run end-to-end demo flow for all 3 scenarios

### Stretch Goals
- [ ] Add Clerk authentication (agent login)
- [ ] Real CRM integration (HubSpot or Salesforce)
- [ ] Twilio SIP integration for real phone calls
- [ ] Analytics dashboard (call volume, avg QA score, KB hit rate)
- [ ] KB gap triage UI for support managers

---

## Ongoing

- [ ] Keep `types/index.ts` in sync with actual database schema
- [ ] Update `CALLPILOT_PRD.md` with any scope changes
- [ ] Add `CHANGELOG.md` entries for each phase completion
