# CallPilot — AI Co-Pilot for Customer Support Agents
### Product Requirements Document + Technical Specification
**Version:** 1.0 — Hackathon MVP  
**Date:** April 2026  
**Stack:** ElevenLabs + Next.js + Claude API + PostgreSQL  
**Status:** Active — Implementation Ready

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Goals](#2-problem-statement--goals)
3. [User Personas](#3-user-personas)
4. [Demo Company — NovaPay Fintech](#4-demo-company--novapay-fintech)
5. [System Architecture](#5-system-architecture)
6. [Three-Phase Lifecycle](#6-three-phase-lifecycle)
7. [Functional Requirements](#7-functional-requirements)
8. [Technical Specification — Pre-Call](#8-technical-specification--pre-call)
9. [Technical Specification — During Call](#9-technical-specification--during-call)
10. [Technical Specification — Post-Call](#10-technical-specification--post-call)
11. [Data Models](#11-data-models)
12. [Agent UI Specification](#12-agent-ui-specification)
13. [ElevenLabs Configuration](#13-elevenlabs-configuration)
14. [Security & Compliance](#14-security--compliance)
15. [Environment Variables](#15-environment-variables)
16. [Implementation Roadmap](#16-implementation-roadmap)
17. [Task Breakdown — Hackathon MVP](#17-task-breakdown--hackathon-mvp)
18. [Design Principles](#18-design-principles)
19. [Demo Script](#19-demo-script)
20. [Open Questions & Placeholders](#20-open-questions--placeholders)

---

## 1. Executive Summary

CallPilot is an AI co-pilot for customer support agents. When a customer calls, the agent has a side-screen dashboard that:
- **Before the call**: Shows who's calling, their history, open tickets, and pre-loaded KB articles matching the predicted query
- **During the call**: Listens to the conversation and auto-surfaces the exact KB snippets and suggested replies the agent needs — in real time, with no typing required
- **After the call**: Auto-generates a call summary, logs it to CRM, and scores the call for QA — without the agent writing a single line

The system is built on ElevenLabs Conversational AI (STT + TTS + KB) with a Next.js agent dashboard, Claude API for reasoning, and PostgreSQL for persistence.

**For the hackathon:** We demo the During-Call co-pilot panel with a fictional fintech company (NovaPay) and a realistic call scenario. A judge calls a number, the agent's screen updates in real time. That is the demo.

---

## 2. Problem Statement & Goals

### 2.1 The Problem

Customer support agents spend significant time:
- Searching for information **mid-call** while the customer waits
- Writing wrap-up notes **after** every call
- Navigating between CRM, KB, and call interface simultaneously
- Missing escalation signals until the customer explicitly asks for a manager

This results in high Average Handle Time (AHT), inconsistent answer quality, slow ramp for new hires, and poor CRM data.

### 2.2 Goals

| # | Goal | Hackathon Signal | Production Metric |
|---|------|-----------------|-------------------|
| G-1 | Reduce Average Handle Time | Demo: agent resolves in <3 min | ↓ 30% AHT within 60 days |
| G-2 | Eliminate manual post-call wrap-up | Demo: auto-summary in dashboard | 100% of calls auto-summarised |
| G-3 | Reduce agent ramp time | Demo: new agent with no training looks competent | New agents productive in days |
| G-4 | Improve CRM data completeness | Demo: CRM entry auto-created | ≥ 95% calls logged with structured data |
| G-5 | Surface escalation risk proactively | Demo: sentiment bar turns red | Alert before customer asks for manager |

### 2.3 Non-Goals (Hackathon Scope)

- Full call automation / replacing human agents
- Outbound dialling campaign management
- Custom voice model fine-tuning
- Multi-language support (English only for MVP)
- Native mobile app
- Twilio phone number (browser-only for hackathon demo)

---

## 3. User Personas

| Persona | Role | Primary Need | Pain Today |
|---------|------|--------------|------------|
| **Support Agent** | Frontline CS rep | Fast, accurate answers during calls | Searching KB mid-call wastes time and embarrasses them |
| **Team Lead** | Manages 8–15 agents | Real-time visibility into call quality | Blind to issues until QA review next week |
| **QA Analyst** | Reviews call recordings | Automated scoring at scale | Manual review of every call is infeasible |
| **Operations Manager** | Owns AHT and CSAT | Actionable metrics, no analyst lag | Data lives in 3 disconnected systems |

**Hackathon Primary Persona:** The Support Agent — this is who sits at the screen the judge watches.

---

## 4. Demo Company — NovaPay Fintech

A fictional Indian fintech offering UPI payments, digital wallets, and instant personal loans. Chosen because:
- Transaction failures, KYC, and loan queries are instantly relatable to any judge
- Rich enough KB to produce realistic retrieval results
- Indian fintech context is differentiated and memorable

### 4.1 Knowledge Base Articles (8 articles, ~400 words each)

| # | Article Title | Key Facts Covered |
|---|--------------|-------------------|
| 1 | **Failed Transaction Policy** | T+3 refund rule, UPI failure codes (U16, U30, U69), dispute filing steps |
| 2 | **KYC Verification Guide** | Accepted documents (Aadhaar, PAN, Passport), re-KYC triggers, rejection reasons |
| 3 | **Loan Disbursement FAQ** | Eligibility criteria, disbursal timeline (24–48h), EMI schedule, prepayment charges |
| 4 | **Wallet Top-Up & Limits** | Daily limit ₹1L, UPI linking steps, OTP troubleshooting, limit increase process |
| 5 | **Chargeback & Disputes** | Filing process, merchant escalation, SLA (7 business days), reference codes |
| 6 | **Account Freeze Policy** | Freeze triggers (fraud flags, 3x wrong PIN), unfreeze steps, timeline (24h) |
| 7 | **Reward Points & Cashback** | Earn rate (1.5% on UPI, 2% on wallet), expiry (12 months), redemption steps |
| 8 | **Privacy & Data Deletion** | DPDP Act compliance, deletion request form, SLA (30 days), data portability |

> **Implementation Note:** Each article stored as `/kb/novapay/<slug>.md` in the repo and synced to ElevenLabs KB via API on deploy. RAG enabled on all articles.

### 4.2 Demo Call Scenarios

**Scenario A — Failed Transaction (Primary Demo)**
> Customer: "My UPI payment of ₹4,500 failed 3 days ago but the money was debited from my account."
> Expected: KB Card 1 (Failed Transaction) + KB Card 5 (Disputes) surface automatically. Suggested reply: "Your refund should arrive within 3 business days from the transaction date."

**Scenario B — KYC Rejection**
> Customer: "I submitted my documents for KYC 2 weeks ago and my account is still frozen."
> Expected: KB Card 6 (Account Freeze) + KB Card 2 (KYC Guide) surface. Suggested reply with document requirements.

**Scenario C — Loan Status**
> Customer: "My loan was approved yesterday but I haven't received the money yet."
> Expected: KB Card 3 (Loan Disbursement) surfaces. 24–48h timeline and bank routing info provided.

---

## 5. System Architecture

### 5.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CALLPILOT SYSTEM                         │
│                                                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │   LAYER 1    │    │    LAYER 2       │    │   LAYER 3     │  │
│  │  TELEPHONY   │───▶│  AI PIPELINE     │───▶│ INTEGRATIONS  │  │
│  │              │    │                  │    │               │  │
│  │ ElevenLabs   │    │ EL STT (stream)  │    │ CRM API       │  │
│  │ Browser SDK  │    │ EL LLM + KB RAG  │    │ WebSocket     │  │
│  │ [Twilio v2]  │    │ Claude API       │    │ Agent Panel   │  │
│  └──────────────┘    └──────────────────┘    └───────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL (pgvector) — calls, transcripts, KB, gaps      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Data Flow — During Call

```
Customer speaks
     │
     ▼
ElevenLabs STT (≤300ms latency)
     │
     ▼
onTranscript callback fires
     │
     ├──▶ Append to rolling transcript buffer (last 10 utterances)
     │
     ├──▶ Intent detection (debounced, max 1 call/2s)
     │         │
     │         ▼
     │    Intent changed? ──Yes──▶ RAG search pgvector
     │                                    │
     │                                    ▼
     │                             Top 3 KB articles
     │                                    │
     │                                    ▼
     │                             WebSocket push to agent panel
     │
     ├──▶ Sentiment scoring (every 5s, customer utterances)
     │         │
     │         ▼
     │    Score < -0.6? ──Yes──▶ Escalation alert to supervisor
     │
     └──▶ Store transcript chunk to PostgreSQL
```

### 5.3 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Voice / AI Agent | ElevenLabs Conversational AI | Integrated STT + TTS + LLM + KB in one SDK call |
| TTS Voice | ElevenLabs Flash v2.5 | 75ms latency, highest quality voice |
| STT | ElevenLabs native (streaming) | Speaker diarization, no extra service |
| LLM (reasoning) | Claude API `claude-sonnet-4-6` | Intent prediction, summarisation, QA scoring |
| Vector store | pgvector on PostgreSQL | No extra service to manage, simple ops |
| Backend | Next.js API routes (Node.js) | Single repo, server components, Vercel deploy |
| Agent UI | Next.js + React + Tailwind | Real-time WebSocket panel, component-driven |
| Real-time | Native WebSocket server or Server-Sent Events | Push events from backend to agent panel |
| Database | PostgreSQL (Supabase) | Free tier, built-in pgvector extension |
| Auth | Clerk | Simple agent login, free tier sufficient |
| Deployment | Vercel | Zero-config, live URL for hackathon demo |

> **Hackathon Simplification:** No Twilio for MVP. ElevenLabs browser SDK handles audio directly. Twilio integration is Phase 2.

---

## 6. Three-Phase Lifecycle

### Phase 1 — Pre-Call Intelligence
**Triggered:** Incoming call detected / call widget opened

What happens before the first word is spoken:
- Caller identity resolved (via CRM lookup or manual entry for demo)
- Last 5 interactions loaded from CRM
- Open tickets surfaced
- LLM predicts likely intent from history
- Top 3 KB articles pre-loaded for predicted intent
- Agent sees a "brief" panel before picking up: who's calling, why they're probably calling, what the policy is

> **Hackathon Status:** Simplified — skip CRM lookup, hardcode NovaPay customer profiles (3 demo personas). Show the pre-call brief panel with mock data.

### Phase 2 — Live Co-Pilot (During Call)
**Triggered:** Call connected, audio stream live

The core product. What the judge sees:
- Live transcript scrolling on left panel
- KB cards auto-surfacing on right panel as topics change
- Intent badge updates in real time
- Sentiment bar tracks customer tone
- Suggested reply chips appear below KB cards
- Escalation alert fires if customer becomes hostile

> **Hackathon Status:** Full implementation. This is the entire demo.

### Phase 3 — Post-Call Automation
**Triggered:** ElevenLabs fires call-end webhook

What happens automatically after the call:
- 3-sentence summary generated via Claude API
- Disposition tagged (resolved / follow-up / escalated / abandoned)
- Follow-up actions listed
- QA scorecard generated across 8 criteria
- Summary pushed to agent dashboard within 30s
- CRM entry written (Salesforce or HubSpot)
- KB gap tickets created for unanswered questions

> **Hackathon Status:** Implement summary + dashboard display. Skip CRM write (no SF/HubSpot for demo). Show the summary card appearing in the agent panel 10–15 seconds after the call ends.

---

## 7. Functional Requirements

### 7.1 Pre-Call Requirements

| ID | Requirement | Priority | Hackathon? |
|----|-------------|----------|------------|
| PC-01 | System loads caller profile (name, tier, history) before first word | P0 | ✅ Mock data |
| PC-02 | System retrieves open tickets for the contact | P0 | ✅ Mock data |
| PC-03 | LLM predicts likely call intent from history + IVR input | P1 | ❌ Phase 2 |
| PC-04 | Pre-loads top 3 KB articles matching predicted intent | P1 | ✅ Static demo |
| PC-05 | Flags VIP customers and high-escalation-risk contacts | P0 | ✅ Mock data |
| PC-06 | Agent brief panel renders within 1.5s of call arrival | P0 | ✅ |
| PC-07 | Policy changes since last contact surfaced as alerts | P2 | ❌ Phase 3 |

### 7.2 During-Call Requirements

| ID | Requirement | Priority | Hackathon? |
|----|-------------|----------|------------|
| DC-01 | Audio captured and streamed via ElevenLabs browser SDK | P0 | ✅ |
| DC-02 | Real-time STT with speaker diarization, ≤300ms latency | P0 | ✅ |
| DC-03 | Intent detected on each transcript chunk, KB lookup triggered | P0 | ✅ |
| DC-04 | Top 2 KB cards rendered on agent panel automatically | P0 | ✅ |
| DC-05 | Suggested reply chips generated from KB content | P0 | ✅ |
| DC-06 | Live sentiment score updated every 5s | P1 | ✅ |
| DC-07 | Escalation alert when customer sentiment < -0.6 | P1 | ✅ (visual) |
| DC-08 | Dynamic call checklist (consent, issue resolved, etc.) | P2 | ❌ Phase 2 |
| DC-09 | Customer never hears AI suggestions (agent panel only) | P0 | ✅ |
| DC-10 | Compliance script pop-up on regulated topic detection | P1 | ❌ Phase 2 |

### 7.3 Post-Call Requirements

| ID | Requirement | Priority | Hackathon? |
|----|-------------|----------|------------|
| PO-01 | Webhook handler receives transcript within 5s of call end | P0 | ✅ |
| PO-02 | LLM generates 3-sentence summary + disposition + follow-ups | P0 | ✅ |
| PO-03 | Summary written to CRM via direct API | P0 | ❌ Phase 2 |
| PO-04 | QA scorecard generated across 8 criteria | P1 | ✅ |
| PO-05 | Unanswered questions flagged as KB gap tickets | P1 | ❌ Phase 2 |
| PO-06 | Agent receives post-call summary in dashboard within 30s | P1 | ✅ |
| PO-07 | CSAT prediction score generated and stored | P2 | ❌ Phase 3 |
| PO-08 | All processing idempotent (duplicate webhooks = no-op) | P0 | ✅ |

---

## 8. Technical Specification — Pre-Call

### 8.1 Entry Point

**Hackathon:** Pre-call state is populated when the agent opens the dashboard and selects a "demo customer" from a dropdown (3 mock personas). No real CRM lookup.

**Production:** Twilio webhook fires on inbound call:

```typescript
// POST /api/webhooks/call/inbound
export async function POST(req: Request) {
  const { From, CallSid, Digits } = await req.json();
  
  // 1. Resolve caller to CRM contact
  const contact = await crmLookup(From);
  
  // 2. Predict intent from IVR input + CRM history
  const intent = await predictIntent(contact, Digits);
  
  // 3. Pre-load KB articles for predicted intent
  const kbArticles = await ragSearch(intent.query, topK = 3);
  
  // 4. Push agent brief via WebSocket (must complete < 1.5s)
  await wsPush(contact.agentId, {
    type: 'pre_call_brief',
    contact,
    intent,
    kbArticles,
    vip: contact.tier === 'enterprise',
    openTickets: contact.openTickets,
  });
  
  return new Response(twilioConnectXml(CallSid), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
```

### 8.2 CRM Lookup (Production)

```typescript
async function crmLookup(phoneNumber: string) {
  const e164 = normalisePhone(phoneNumber); // +91XXXXXXXXXX format
  
  const contact = await crm.contacts.findByPhone(e164);
  if (!contact) return buildUnknownCallerBrief(e164);
  
  const [tickets, history] = await Promise.all([
    crm.tickets.findOpen({ contactId: contact.id }),
    crm.activities.findRecent({ contactId: contact.id, limit: 5 }),
  ]);
  
  return { ...contact, openTickets: tickets, callHistory: history };
}
```

### 8.3 Intent Prediction via Claude

```typescript
async function predictIntent(contact: Contact, ivrInput: string) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: INTENT_SYSTEM_PROMPT, // returns JSON only
    messages: [{
      role: 'user',
      content: buildIntentPrompt(contact.callHistory, ivrInput),
    }],
  });
  
  return JSON.parse(response.content[0].text);
  // { intent: 'failed_transaction', confidence: 0.87, query: 'UPI payment failed refund' }
}

const INTENT_SYSTEM_PROMPT = `
You are an intent classifier for a fintech customer support system.
Given a customer's call history and IVR input, predict their call intent.
Respond ONLY with a valid JSON object. No preamble. No explanation.
Schema: { "intent": string, "confidence": number, "query": string }
Intent options: failed_transaction | kyc_issue | loan_status | wallet_topup | 
                chargeback | account_freeze | rewards | privacy | other
`;
```

### 8.4 Mock Data for Hackathon Demo

```typescript
// /lib/demo-personas.ts
export const DEMO_PERSONAS = [
  {
    id: 'demo-001',
    name: 'Priya Sharma',
    phone: '+919876543210',
    tier: 'standard',
    vip: false,
    openTickets: [],
    callHistory: [
      { date: '2026-03-15', summary: 'Wallet top-up issue, resolved' },
    ],
    predictedIntent: 'failed_transaction',
    preloadedKb: ['failed-transaction-policy', 'chargeback-disputes'],
  },
  {
    id: 'demo-002', 
    name: 'Rahul Mehta',
    phone: '+919898765432',
    tier: 'enterprise',
    vip: true,
    openTickets: [{ id: 'T-4521', title: 'KYC re-submission pending' }],
    callHistory: [
      { date: '2026-04-01', summary: 'Account freeze - KYC expired' },
    ],
    predictedIntent: 'kyc_issue',
    preloadedKb: ['kyc-verification-guide', 'account-freeze-policy'],
  },
  {
    id: 'demo-003',
    name: 'Ananya Krishnan', 
    phone: '+919765432109',
    tier: 'premium',
    vip: false,
    openTickets: [],
    callHistory: [
      { date: '2026-04-10', summary: 'Personal loan application approved' },
    ],
    predictedIntent: 'loan_status',
    preloadedKb: ['loan-disbursement-faq'],
  },
];
```

---

## 9. Technical Specification — During Call

### 9.1 ElevenLabs Agent Configuration

```typescript
// /lib/elevenlabs-agent.ts
import { useConversation } from '@11labs/react';

export function useCallPilot(agentId: string, contact: Contact) {
  const conversation = useConversation({
    onConnect: () => console.log('Call connected'),
    onDisconnect: () => handleCallEnd(),
    onMessage: (message) => handleTranscript(message),
    onError: (error) => console.error('EL error:', error),
  });
  
  const startCall = async () => {
    await conversation.startSession({
      agentId: process.env.NEXT_PUBLIC_EL_AGENT_ID!,
      dynamicVariables: {
        caller_name: contact.name,
        account_tier: contact.tier,
        open_tickets: JSON.stringify(contact.openTickets),
        // kb_context injected via ElevenLabs KB RAG — no manual injection needed
      },
    });
  };
  
  return { conversation, startCall };
}
```

### 9.2 ElevenLabs Agent — System Prompt (NovaPay)

```
You are a customer support AI assistant for NovaPay Fintech.
You are assisting a human support agent during a live customer call.
The customer cannot hear you — you communicate only with the agent.

Your job:
1. Listen to the conversation
2. Surface the most relevant Knowledge Base information
3. Suggest clear, accurate responses the agent can deliver verbatim
4. Flag any escalation risk if the customer becomes agitated

Customer profile:
- Name: {{caller_name}}
- Account tier: {{account_tier}}
- Open tickets: {{open_tickets}}

Always respond in this JSON format:
{
  "intent": "<detected intent>",
  "kb_articles": ["<article_id_1>", "<article_id_2>"],
  "suggested_reply": "<exact text the agent can say>",
  "sentiment": <float -1.0 to 1.0>,
  "escalation_risk": <boolean>,
  "confidence": <float 0.0 to 1.0>
}

Tone: Calm, helpful, professional. NovaPay voice: friendly but precise.
```

### 9.3 Real-Time Transcript Handler

```typescript
// /lib/transcript-handler.ts
interface TranscriptChunk {
  speaker: 'agent' | 'customer';
  text: string;
  timestamp: number;
}

const transcriptBuffer: TranscriptChunk[] = [];
let currentIntent = '';
let intentDebounceTimer: NodeJS.Timeout;

async function handleTranscript(
  chunk: TranscriptChunk,
  onKbUpdate: (articles: KbArticle[]) => void,
  onSentimentUpdate: (score: number) => void,
  onEscalation: () => void,
) {
  // Append to rolling buffer (last 10 utterances)
  transcriptBuffer.push(chunk);
  if (transcriptBuffer.length > 10) transcriptBuffer.shift();
  
  // Persist to DB
  await db.transcriptChunks.insert({ ...chunk, callId: currentCallId });
  
  // Intent detection — debounced (max 1 call per 2 seconds)
  clearTimeout(intentDebounceTimer);
  intentDebounceTimer = setTimeout(async () => {
    const newIntent = await detectIntent(transcriptBuffer);
    
    if (newIntent.intent !== currentIntent && newIntent.confidence > 0.7) {
      currentIntent = newIntent.intent;
      const articles = await ragSearch(newIntent.query, 3);
      onKbUpdate(articles);
    }
  }, 2000);
  
  // Sentiment scoring (customer utterances only)
  if (chunk.speaker === 'customer') {
    const sentiment = await scoreSentiment(chunk.text);
    onSentimentUpdate(sentiment);
    
    if (sentiment < -0.6) {
      onEscalation();
      // POST /api/escalation-alert in production
    }
  }
}
```

### 9.4 Intent Detection

```typescript
async function detectIntent(buffer: TranscriptChunk[]) {
  const recentText = buffer
    .slice(-5) // last 5 utterances
    .map(c => `${c.speaker.toUpperCase()}: ${c.text}`)
    .join('\n');
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 128,
    system: INTENT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: recentText }],
  });
  
  return JSON.parse(response.content[0].text);
  // { intent: 'failed_transaction', confidence: 0.91, query: 'UPI payment failed refund policy' }
}
```

### 9.5 RAG Pipeline

```typescript
// /lib/rag.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function ragSearch(query: string, topK = 3): Promise<KbArticle[]> {
  // Generate query embedding via ElevenLabs or OpenAI embedding API
  const queryEmbedding = await embed(query);
  
  const { data, error } = await supabase.rpc('match_kb_articles', {
    query_embedding: queryEmbedding,
    match_threshold: 0.72,
    match_count: topK,
  });
  
  if (error) throw error;
  return data;
}

// Supabase SQL function (run once during setup):
/*
CREATE OR REPLACE FUNCTION match_kb_articles(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id text,
  title text,
  content text,
  url text,
  similarity float
)
LANGUAGE SQL STABLE
AS $$
  SELECT id, title, content, url,
    1 - (embedding <=> query_embedding) AS similarity
  FROM kb_articles
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
*/

async function embed(text: string): Promise<number[]> {
  // [PLACEHOLDER] Use ElevenLabs embedding API when available,
  // fallback to OpenAI text-embedding-3-small
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}
```

### 9.6 WebSocket Server

```typescript
// /lib/ws-server.ts — runs as Next.js custom server
import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: parseInt(process.env.WS_PORT || '8080') });
const agentSockets = new Map<string, WebSocket>(); // agentId → ws

wss.on('connection', (ws, req) => {
  const agentId = extractAgentId(req); // from ?agentId= query param + JWT validation
  agentSockets.set(agentId, ws);
  
  ws.on('close', () => agentSockets.delete(agentId));
  ws.on('error', (err) => console.error(`WS error for agent ${agentId}:`, err));
});

export function wsPush(agentId: string, payload: object) {
  const ws = agentSockets.get(agentId);
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

// Payload types:
// { type: 'kb_update', articles: KbArticle[] }
// { type: 'sentiment', speaker: string, score: number }
// { type: 'escalation_alert', callId: string }
// { type: 'post_call_summary', summary: CallSummary, qaScore: QAScore }
// { type: 'pre_call_brief', contact: Contact, kbArticles: KbArticle[] }
```

> **Hackathon Simplification:** Use Server-Sent Events (SSE) instead of raw WebSocket server — works natively with Next.js without a custom server:
> `GET /api/stream?agentId=xxx` → SSE endpoint, agent panel subscribes on mount.

---

## 10. Technical Specification — Post-Call

### 10.1 Webhook Handler

```typescript
// /app/api/webhooks/call/end/route.ts
import crypto from 'crypto';

export async function POST(req: Request) {
  // 1. Verify ElevenLabs HMAC signature
  const sig = req.headers.get('x-elevenlabs-signature');
  const body = await req.text();
  const expected = crypto
    .createHmac('sha256', process.env.ELEVENLABS_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  
  if (sig !== `sha256=${expected}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const { call_id, transcript, duration_s, metadata } = JSON.parse(body);
  
  // 2. Idempotency guard
  const existing = await db.calls.findById(call_id);
  if (existing?.processed) {
    return Response.json({ ok: true }); // duplicate webhook, ignore
  }
  
  // 3. Mark as processing immediately (prevents duplicate race)
  await db.calls.upsert({ id: call_id, processed: true, ended_at: new Date() });
  
  // 4. Return 200 fast — all async work runs after response
  // ElevenLabs requires 200 within 5s, but we can't await the pipeline
  
  // Use setImmediate to run after response is sent
  setImmediate(() => {
    runPostCallPipeline(call_id, transcript, metadata).catch(err =>
      console.error(JSON.stringify({ event: 'post_call_pipeline_failed', call_id, err: err.message }))
    );
  });
  
  return Response.json({ ok: true });
}
```

### 10.2 Post-Call Pipeline

```typescript
async function runPostCallPipeline(
  callId: string,
  transcript: TranscriptChunk[],
  meta: CallMetadata,
) {
  // Run summarisation and QA scoring in parallel
  const [summary, qaScore] = await Promise.allSettled([
    generateSummary(transcript),
    scoreQA(transcript, meta),
  ]);
  
  const summaryResult = summary.status === 'fulfilled' ? summary.value : null;
  const qaResult = qaScore.status === 'fulfilled' ? qaScore.value : null;
  
  // CRM write — direct API (no middleware)
  // [PLACEHOLDER] Enable when CRM credentials are configured
  if (process.env.CRM_TYPE && summaryResult) {
    await writeToCRM({
      contactId: meta.contactId,
      callId,
      summary: summaryResult.text,
      disposition: summaryResult.disposition,
      followUps: summaryResult.followUpActions,
      qaScore: qaResult?.total ?? null,
      duration: meta.duration_s,
    }).catch(err => console.error('CRM write failed', { callId, err }));
  }
  
  // KB gap detection (fire-and-forget)
  detectKbGaps(transcript, callId).catch(err =>
    console.error('KB gap detection failed', { callId, err })
  );
  
  // Push summary to agent dashboard via WebSocket
  if (meta.agentId && summaryResult) {
    wsPush(meta.agentId, {
      type: 'post_call_summary',
      summary: summaryResult,
      qaScore: qaResult,
    });
  }
  
  // Persist to DB
  await db.calls.update(callId, {
    summary: summaryResult?.text,
    disposition: summaryResult?.disposition,
    qa_score: qaResult?.total,
    crm_synced: !!process.env.CRM_TYPE,
  });
}
```

### 10.3 LLM Summarisation

```typescript
const SUMMARY_SYSTEM_PROMPT = `
You are a post-call summarisation engine for a fintech customer support system.
Analyse the provided call transcript and return ONLY a valid JSON object.
No preamble, no markdown, no explanation.

Required schema:
{
  "text": "<3 concise sentences summarising the issue, what was done, and outcome>",
  "disposition": "resolved" | "follow_up" | "escalated" | "abandoned",
  "followUpActions": ["<action 1>", "<action 2>"],
  "sentiment_trend": "positive" | "neutral" | "negative" | "recovered",
  "csatPrediction": <float 0.0 to 1.0>
}
`;

async function generateSummary(transcript: TranscriptChunk[]) {
  const transcriptText = transcript
    .map(c => `[${c.speaker.toUpperCase()}] ${c.text}`)
    .join('\n');
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: SUMMARY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: transcriptText }],
  });
  
  return JSON.parse(response.content[0].text);
}
```

### 10.4 QA Scoring

```typescript
const QA_CRITERIA = [
  { id: 'greeting',    label: 'Correct greeting and consent prompt', weight: 0.10 },
  { id: 'accuracy',   label: 'Accurate info provided (vs KB)',       weight: 0.25 },
  { id: 'empathy',    label: 'Empathy and tone',                     weight: 0.15 },
  { id: 'compliance', label: 'Compliance script followed',           weight: 0.20 },
  { id: 'fcr',        label: 'Issue resolved on first contact',      weight: 0.10 },
  { id: 'escalation', label: 'Correct escalation handling',          weight: 0.10 },
  { id: 'duration',   label: 'Call duration within SLA',             weight: 0.05 },
  { id: 'crm',        label: 'CRM updated correctly',                weight: 0.05 },
];

async function scoreQA(transcript: TranscriptChunk[], meta: CallMetadata) {
  const transcriptText = transcript
    .map(c => `[${c.speaker.toUpperCase()}] ${c.text}`)
    .join('\n');
  
  const qaPrompt = `
Evaluate this customer support call transcript across the following criteria.
Return ONLY valid JSON. No preamble.

Criteria: ${JSON.stringify(QA_CRITERIA)}

Schema: { 
  "scores": { "<criterion_id>": { "score": <1-5>, "rationale": "<one sentence>" } },
  "total": <weighted average 1-5>,
  "highlights": ["<positive observation>"],
  "improvements": ["<coaching suggestion>"]
}

Transcript:
${transcriptText}
`;
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: 'You are a QA analyst for a fintech customer support team. Return ONLY valid JSON.',
    messages: [{ role: 'user', content: qaPrompt }],
  });
  
  return JSON.parse(response.content[0].text);
}
```

---

## 11. Data Models

### 11.1 PostgreSQL Schema

```sql
-- Core calls table
CREATE TABLE calls (
  id              TEXT PRIMARY KEY,        -- ElevenLabs call_id
  contact_id      TEXT,                    -- CRM contact ID (or demo persona ID)
  agent_id        TEXT,                    -- internal agent user ID
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  duration_s      INTEGER,
  disposition     TEXT CHECK (disposition IN ('resolved','follow_up','escalated','abandoned')),
  summary         TEXT,
  qa_score        NUMERIC(4,2),
  csat_pred       NUMERIC(3,2),
  processed       BOOLEAN DEFAULT false,
  crm_synced      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Live transcript storage
CREATE TABLE transcript_chunks (
  id          BIGSERIAL PRIMARY KEY,
  call_id     TEXT REFERENCES calls(id) ON DELETE CASCADE,
  speaker     TEXT CHECK (speaker IN ('agent','customer')),
  text        TEXT NOT NULL,
  timestamp   TIMESTAMPTZ NOT NULL,
  sentiment   NUMERIC(4,3)              -- -1.0 to 1.0, customer utterances only
);
CREATE INDEX idx_transcript_call ON transcript_chunks(call_id, timestamp);

-- Knowledge base with vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE kb_articles (
  id          TEXT PRIMARY KEY,           -- slug: 'failed-transaction-policy'
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  url         TEXT,
  embedding   vector(1536),               -- text-embedding-3-small dimensions
  company_id  TEXT DEFAULT 'novapay',     -- multi-tenant ready
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX kb_vec_idx ON kb_articles 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Knowledge gaps detected post-call
CREATE TABLE kb_gaps (
  id            BIGSERIAL PRIMARY KEY,
  call_id       TEXT REFERENCES calls(id),
  question      TEXT NOT NULL,
  occurrences   INTEGER DEFAULT 1,
  status        TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- QA scores per call
CREATE TABLE qa_scores (
  id          BIGSERIAL PRIMARY KEY,
  call_id     TEXT REFERENCES calls(id),
  scores      JSONB,                       -- { criterion_id: { score, rationale } }
  total       NUMERIC(4,2),
  highlights  TEXT[],
  improvements TEXT[],
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Audit log (immutable)
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  event_type  TEXT NOT NULL,
  entity_id   TEXT,
  payload     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### 11.2 TypeScript Types

```typescript
// /types/index.ts

interface Contact {
  id: string;
  name: string;
  phone: string;
  tier: 'standard' | 'premium' | 'enterprise';
  vip: boolean;
  openTickets: Ticket[];
  callHistory: CallHistoryItem[];
}

interface KbArticle {
  id: string;
  title: string;
  content: string;        // full article
  snippet: string;        // 2–3 sentence excerpt for the overlay card
  url?: string;
  similarity: number;     // 0.0 to 1.0
}

interface CallState {
  callId: string;
  status: 'idle' | 'pre_call' | 'active' | 'ended';
  contact: Contact | null;
  transcript: TranscriptChunk[];
  kbCards: KbArticle[];
  sentimentScore: number;
  intentLabel: string;
  intentConfidence: number;
  escalationRisk: boolean;
  suggestedReplies: string[];
}

interface CallSummary {
  text: string;
  disposition: 'resolved' | 'follow_up' | 'escalated' | 'abandoned';
  followUpActions: string[];
  sentimentTrend: 'positive' | 'neutral' | 'negative' | 'recovered';
  csatPrediction: number;
}
```

---

## 12. Agent UI Specification

### 12.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER  [ NovaPay Support ]  [ Agent: Priya ]  [ ● LIVE 02:14 ]  [ ⚙ ] │
├────────────────────────────────┬────────────────────────────────────────│
│                                │                                        │
│  LEFT PANEL (40%)              │  RIGHT PANEL — CO-PILOT (60%)          │
│  ─────────────────             │  ─────────────────────────────         │
│                                │                                        │
│  CALLER BRIEF (pre-call)       │  INTENT BADGE                          │
│  ┌──────────────────────┐      │  [ Failed Transaction · 94% ]          │
│  │ Priya Sharma         │      │                                        │
│  │ Standard · #demo-001 │      │  KB CARD 1                             │
│  │ Last call: Mar 15    │      │  ┌────────────────────────────────┐    │
│  │ 0 open tickets       │      │  │ 📄 Failed Transaction Policy   │    │
│  └──────────────────────┘      │  │ Refund auto-initiated T+3       │    │
│                                │  │ business days. Check: App →     │    │
│  LIVE TRANSCRIPT               │  │ Transactions → Disputes.        │    │
│  ─────────────                 │  └────────────────────────────────┘    │
│  CUSTOMER: My UPI payment      │                                        │
│  failed 3 days ago but the     │  KB CARD 2                             │
│  money was debited...          │  ┌────────────────────────────────┐    │
│                                │  │ 📄 Chargeback & Disputes        │    │
│  AGENT: I'm sorry to hear      │  │ If T+3 refund hasn't arrived,  │    │
│  that. Can I have your         │  │ file dispute. SLA: 7 biz days. │    │
│  registered number?            │  └────────────────────────────────┘    │
│                                │                                        │
│  CUSTOMER: It's 9876543210...  │  SUGGESTED REPLIES                     │
│                                │  [ Your refund arrives in 3 days ]     │
│  SENTIMENT  ████████░░ 78%     │  [ Let me raise a dispute ticket ]     │
│  Customer:  ▓▓▓▓░░░░░ 45%     │  [ Check App → Transactions → Disputes ]│
│                                │                                        │
└────────────────────────────────┴────────────────────────────────────────┘
│  POST-CALL SUMMARY (appears 15s after call ends)                        │
│  [ ✓ Resolved ]  "Customer reported failed UPI transaction of ₹4,500.  │
│  Agent confirmed T+3 refund policy and offered to raise dispute ticket.  │
│  Issue resolved. No follow-up required."  QA: 4.2/5.0                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Key UI Components

**`<CallerBrief />`** — Pre-call card with contact name, tier badge, open tickets list, and VIP flag. Renders from `CallState.contact`.

**`<LiveTranscript />`** — Scrolling transcript with speaker labels. New utterances append at bottom with a fade-in animation. `useEffect` auto-scrolls to bottom.

**`<SentimentBar />`** — Horizontal progress bar, colour transitions: green (>0.3) → amber (0 to 0.3) → red (<0). Smooth CSS transition on value change.

**`<IntentBadge />`** — Pill showing current detected intent + confidence %. Fades in on change. Colour coded by intent category.

**`<KbCard />`** — Article title, 2–3 sentence excerpt, "View full article" link. Top-ranked card has a subtle left-border accent. Cards animate in from right when they update.

**`<SuggestedReplies />`** — Row of clickable pills. Click copies text to clipboard. Visual flash on click. Max 3 pills shown.

**`<EscalationAlert />`** — Full-width red banner: "⚠ Customer frustration detected. Consider offering to escalate." Appears when `CallState.escalationRisk === true`. Dismissible.

**`<PostCallSummary />`** — Appears in a slide-up drawer 10–15s after call ends. Shows summary text, disposition badge, follow-up actions list, QA score breakdown.

### 12.3 Component File Structure

```
/app
  /agent
    page.tsx          -- Agent dashboard route (/agent)
    layout.tsx        -- Auth guard, WS connection init
  /api
    /webhooks
      /call
        end/route.ts  -- POST: ElevenLabs post-call webhook
    /stream/route.ts  -- GET: SSE stream for agent panel events
    /kb
      ingest/route.ts -- POST: Upload KB articles + generate embeddings
/components
  CallerBrief.tsx
  LiveTranscript.tsx
  SentimentBar.tsx
  IntentBadge.tsx
  KbCard.tsx
  SuggestedReplies.tsx
  EscalationAlert.tsx
  PostCallSummary.tsx
  CallControls.tsx    -- Start / End call buttons
/lib
  elevenlabs-agent.ts
  transcript-handler.ts
  rag.ts
  claude.ts
  db.ts               -- Supabase client
  ws-server.ts        -- WebSocket / SSE server
/kb
  /novapay
    failed-transaction-policy.md
    kyc-verification-guide.md
    loan-disbursement-faq.md
    wallet-topup-limits.md
    chargeback-disputes.md
    account-freeze-policy.md
    reward-points-cashback.md
    privacy-data-deletion.md
/types
  index.ts
/scripts
  ingest-kb.ts        -- One-time script: embed KB articles → pgvector
```

---

## 13. ElevenLabs Configuration

### 13.1 Agent Setup Steps

1. Go to [elevenlabs.io/app/agents/templates](https://elevenlabs.io/app/agents/templates)
2. Select **Customer Support** template
3. Configure:
   - **Agent Name:** NovaPay Support Co-Pilot
   - **System Prompt:** Paste the prompt from Section 9.2
   - **Voice:** Meera (Indian-accented English) — test with 3 sample calls
   - **LLM:** Claude claude-sonnet-4-6 (set via ElevenLabs custom LLM or default)
   - **First message:** "Hello, I'm your co-pilot. I'm listening to the call."

4. **Knowledge Base:** Upload all 8 KB markdown files
   - Enable RAG on all articles
   - Set chunk size: 512 tokens, overlap: 64 tokens

5. **Events:** Enable `transcript` and `agent_response` conversation events

6. Copy `AGENT_ID` → add to `.env.local` as `NEXT_PUBLIC_EL_AGENT_ID`

### 13.2 Credit Budget — 131,000 Credits

| Usage | Estimated Credits | Notes |
|-------|------------------|-------|
| Dev + testing (50 calls × 5 min) | ~40,000 | Flash v2.5 model |
| Hackathon demo (20 calls × 5 min) | ~16,000 | Live demo calls |
| Judge/audience testing | ~20,000 | Buffer for peak |
| KB ingestion + embeddings | ~5,000 | One-time setup |
| **Buffer / overflow** | ~50,000 | Safety margin |
| **Total** | **131,000** | ✅ Sufficient |

> Credit rate: ElevenLabs Flash v2.5 ≈ 400 credits/minute of audio.

### 13.3 KB Upload Script

```typescript
// /scripts/ingest-kb.ts
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const KB_DIR = path.join(process.cwd(), 'kb/novapay');
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function ingestKb() {
  const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith('.md'));
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(KB_DIR, file), 'utf-8');
    const title = content.split('\n')[0].replace('# ', '');
    const id = file.replace('.md', '');
    
    // Generate embedding
    const { data } = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content,
    });
    const embedding = data[0].embedding;
    
    // Upsert to Supabase
    await supabase.from('kb_articles').upsert({
      id,
      title,
      content,
      embedding,
      company_id: 'novapay',
      updated_at: new Date().toISOString(),
    });
    
    console.log(`✅ Ingested: ${id}`);
  }
  
  console.log('KB ingestion complete');
}

ingestKb().catch(console.error);
```

---

## 14. Security & Compliance

| Control | Implementation |
|---------|----------------|
| Webhook signature validation | HMAC-SHA256 on all ElevenLabs + Twilio webhooks |
| API key management | All secrets in `.env.local` / Vercel env vars; never committed |
| Transcript encryption at rest | Supabase Vault or row-level encryption on `transcript_chunks` |
| Transport encryption | TLS 1.2+ on all API calls and WebSocket connections |
| PII access control | Transcript data access gated by Clerk auth session |
| Call recording consent | Consent prompt injected at call start via agent system prompt |
| Data retention | Configurable purge job: `DELETE FROM transcript_chunks WHERE timestamp < NOW() - INTERVAL '90 days'` |
| Audit log | All CRM writes, QA scores, and KB gap tickets logged to `audit_log` table |

---

## 15. Environment Variables

```bash
# .env.local

# ── ElevenLabs ──────────────────────────────────────────────
ELEVENLABS_API_KEY=                   # ElevenLabs platform API key
NEXT_PUBLIC_EL_AGENT_ID=             # NovaPay Support Co-Pilot agent ID
ELEVENLABS_WEBHOOK_SECRET=           # HMAC secret for post-call webhook validation

# ── Claude / Anthropic ──────────────────────────────────────
ANTHROPIC_API_KEY=                   # Claude API key (intent + summarisation + QA)

# ── Database (Supabase) ─────────────────────────────────────
SUPABASE_URL=                        # https://xxxx.supabase.co
SUPABASE_ANON_KEY=                   # Public anon key (client-side safe)
SUPABASE_SERVICE_ROLE_KEY=           # Secret — server-side only, never expose to client
DATABASE_URL=                        # postgresql://... (for raw Prisma/pg if needed)

# ── Embeddings ──────────────────────────────────────────────
OPENAI_API_KEY=                      # For text-embedding-3-small (KB ingestion + RAG queries)
# [PLACEHOLDER] Replace with ElevenLabs embedding API when officially available

# ── Auth (Clerk) ────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

# ── WebSocket ───────────────────────────────────────────────
WS_PORT=8080                         # WebSocket server port (or use SSE for hackathon)

# ── CRM (Phase 2) ───────────────────────────────────────────
# [PLACEHOLDER] Configure when CRM integration is added
# CRM_TYPE=                          # 'salesforce' or 'hubspot'
# SF_CLIENT_ID=
# SF_CLIENT_SECRET=
# SF_INSTANCE_URL=
# HUBSPOT_ACCESS_TOKEN=

# ── Twilio (Phase 2) ────────────────────────────────────────
# [PLACEHOLDER] Configure when phone number integration is added
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_PHONE_NUMBER=
```

---

## 16. Implementation Roadmap

| Phase | Duration | Scope | Hackathon? | Deliverable |
|-------|----------|-------|-----------|-------------|
| **0 — Setup** | Day 1 | EL agent config, DB schema, env vars, Next.js scaffold | ✅ | Dev environment live |
| **1 — KB** | Day 1–2 | Write 8 KB articles, ingest to pgvector, test RAG accuracy | ✅ | KB search returning correct articles |
| **2 — Co-Pilot UI** | Day 2–3 | Agent dashboard layout, all UI components, mock data | ✅ | Static UI complete |
| **3 — Live Call** | Day 3–4 | EL SDK integration, transcript handler, real-time KB surfacing | ✅ | Live call updates agent panel |
| **4 — Post-Call** | Day 4–5 | Webhook handler, Claude summarisation, QA score, dashboard display | ✅ | Summary appears after call |
| **5 — Polish** | Day 5–6 | Animations, sentiment bar, escalation alert, 3 demo scenarios tested | ✅ | Demo-ready |
| **6 — Deploy** | Day 6 | Vercel deploy, env vars configured, live URL tested | ✅ | Public URL working |
| **Phase 2 — Phone** | Week 2 | Twilio SIP integration, real phone number, inbound call routing | — | Real phone calls |
| **Phase 2 — CRM** | Week 2–3 | Salesforce/HubSpot adapter, direct API write | — | CRM auto-populated |
| **Phase 3 — Analytics** | Week 4+ | Call analytics dashboard, KB gap workflow, CSAT model | — | Business owner dashboard |

---

## 17. Task Breakdown — Hackathon MVP

### Phase 0 — Setup (Day 1, ~4h)

- [ ] Init Next.js 14 app: `npx create-next-app@latest callpilot --typescript --tailwind --app`
- [ ] Install dependencies: `@11labs/react`, `@supabase/supabase-js`, `@anthropic-ai/sdk`, `openai`, `ws`, `zod`
- [ ] Create Supabase project — enable pgvector extension
- [ ] Run DB schema migrations (Section 11.1)
- [ ] Create ElevenLabs agent from Customer Support template
  - [ ] Paste system prompt (Section 9.2)
  - [ ] Select voice (Meera or Arjun)
  - [ ] Copy Agent ID → `.env.local`
- [ ] Configure all environment variables
- [ ] `git init`, push to GitHub, connect Vercel project

### Phase 1 — Knowledge Base (Day 1–2, ~6h)

- [ ] Write all 8 KB markdown articles (Section 4.1)
  - [ ] `/kb/novapay/failed-transaction-policy.md`
  - [ ] `/kb/novapay/kyc-verification-guide.md`
  - [ ] `/kb/novapay/loan-disbursement-faq.md`
  - [ ] `/kb/novapay/wallet-topup-limits.md`
  - [ ] `/kb/novapay/chargeback-disputes.md`
  - [ ] `/kb/novapay/account-freeze-policy.md`
  - [ ] `/kb/novapay/reward-points-cashback.md`
  - [ ] `/kb/novapay/privacy-data-deletion.md`
- [ ] Upload articles to ElevenLabs KB via dashboard + enable RAG
- [ ] Write `scripts/ingest-kb.ts` (Section 13.3)
- [ ] Run `tsx scripts/ingest-kb.ts` — verify all 8 articles embedded in pgvector
- [ ] Test RAG: query "failed UPI payment refund" → should return article 1 with similarity >0.80
- [ ] Test RAG: query "KYC documents required" → should return article 2

### Phase 2 — Co-Pilot UI (Day 2–3, ~8h)

- [ ] Build `/app/agent/page.tsx` — main dashboard layout
  - [ ] Two-column layout (40/60 split)
  - [ ] Header with call status + timer
- [ ] Build `<CallerBrief />` — uses mock persona data
- [ ] Build `<LiveTranscript />` — scrolling with speaker labels, auto-scroll
- [ ] Build `<SentimentBar />` — animated, colour transitions green/amber/red
- [ ] Build `<IntentBadge />` — fade-in on change, colour coded
- [ ] Build `<KbCard />` — title, excerpt, source, similarity badge
- [ ] Build `<SuggestedReplies />` — chips, click-to-copy, flash animation
- [ ] Build `<EscalationAlert />` — red banner, dismissible
- [ ] Build `<PostCallSummary />` — slide-up drawer with summary + QA breakdown
- [ ] Build `<CallControls />` — Start / End call buttons
- [ ] Wire all components to `CallState` (Zustand or React Context)
- [ ] Test all UI states with mock data (idle → pre-call → active → ended)

### Phase 3 — Live Call Integration (Day 3–4, ~8h)

- [ ] Implement `useCallPilot` hook (`/lib/elevenlabs-agent.ts`)
  - [ ] `startSession` with demo persona dynamic variables
  - [ ] `onMessage` → calls `handleTranscript`
  - [ ] `onDisconnect` → triggers post-call flow
- [ ] Implement `handleTranscript` (`/lib/transcript-handler.ts`)
  - [ ] Rolling buffer (last 10 utterances)
  - [ ] Intent detection with Claude (debounced 2s)
  - [ ] RAG search on intent change
  - [ ] Sentiment scoring on customer utterances
  - [ ] State updates → UI re-renders
- [ ] Implement `ragSearch` (`/lib/rag.ts`)
  - [ ] Query embedding generation
  - [ ] pgvector cosine similarity search
  - [ ] Similarity threshold filter (>0.72)
- [ ] Implement SSE endpoint: `GET /api/stream`
  - [ ] Agent panel subscribes on mount
  - [ ] Events: `kb_update`, `sentiment`, `escalation_alert`
- [ ] End-to-end test: start call → speak "my UPI payment failed" → KB card appears
- [ ] Test all 3 demo scenarios (Section 4.2)

### Phase 4 — Post-Call (Day 4–5, ~4h)

- [ ] Implement `POST /api/webhooks/call/end`
  - [ ] HMAC signature validation
  - [ ] Idempotency guard
  - [ ] Async pipeline dispatch
- [ ] Implement `generateSummary` (`/lib/claude.ts`)
  - [ ] Test with 3 sample transcripts
  - [ ] Verify JSON schema compliance
- [ ] Implement `scoreQA` — 8 criteria, weighted average
- [ ] Wire summary → `wsPush` → `<PostCallSummary />` component
- [ ] Test: end call → wait 15s → summary appears in dashboard

### Phase 5 — Polish & Demo Prep (Day 5–6, ~4h)

- [ ] Deploy to Vercel — confirm live URL
- [ ] Test all 3 demo scenarios from scratch on live URL
- [ ] Record 90s fallback video (in case live demo fails)
- [ ] Prepare demo script (Section 19)
- [ ] Write `tasks/lessons.md` — document ElevenLabs SDK gotchas
- [ ] Confirm ElevenLabs credit balance before demo slot

---

## 18. Design Principles

### The North Star
**The agent must look smarter than they are.** Every design decision serves this goal.

### Six Rules

1. **Attention is the asset** — The agent is on a live call. Every pixel on the co-pilot panel must earn its place. If it doesn't help the agent in the next 10 seconds, it doesn't belong on screen.

2. **Zero search, zero clicks** — The agent never types a search query. KB cards appear automatically. Suggested replies appear automatically. The agent's only job is to talk to the customer.

3. **Progressive disclosure** — Snippet first, full article on click. 2–3 suggested replies, not 10. Intent label, not a list of probabilities. Show the answer, not the work.

4. **Speed over polish** — A KB card in 400ms with clean styling beats a beautiful card in 2 seconds. Perceived latency is the enemy. Optimize render path, minimize re-renders.

5. **Confidence, not noise** — Surface max 2 KB cards at a time. Only show suggestions above 70% intent confidence. Suppress low-signal results entirely. One clear recommendation > five uncertain ones.

6. **The demo must survive contact with reality** — Live demo, not pre-recorded. No mocks during the actual demo call. The system must work under the pressure of a judge's eyes. Build for resilience, not just the happy path.

### Colour & Feel
- Dark background (`#0f1117`) — reduces eye strain during long shifts
- Green accent (`#1a6648`) — NovaPay brand, trust, resolution
- Red alert (`#991b1b`) — escalation risk only, never decorative
- Monospace for transcripts and metadata — distinguishes system from human
- Serif headline for company name — authority and trust

---

## 19. Demo Script

**Duration:** 3 minutes  
**Setup:** Two devices — demo laptop (shows agent panel) + phone/second laptop (plays customer)

### The Script

**[0:00]** Open the agent dashboard. Show the pre-call brief for Priya Sharma — "standard tier customer, no open tickets."

**[0:20]** Click "Start Call." ElevenLabs agent connects. Say (as customer):
> "Hi, my UPI payment of ₹4,500 failed 3 days ago but the money was still debited from my account."

**[0:35]** Point to the panel — **"Watch the right side."** KB Card 1 (Failed Transaction Policy) slides in. Intent badge reads "Failed Transaction · 91%". 

**[0:50]** Say (as customer):
> "I've been waiting for 4 days now. When will I get my refund?"

**[1:00]** Suggested reply chip appears: "Your refund should arrive within 3 business days from the transaction date." Agent clicks it — copied to clipboard. Agent reads it on the call.

**[1:15]** Say (as customer, becoming frustrated):
> "This is absolutely unacceptable. Every time I call I get a different answer. I want to speak to a manager."

**[1:25]** Escalation alert banner appears in red. Point to it: **"The system detected escalation risk before the customer finished the sentence."** Sentiment bar moves to red.

**[1:40]** Click "End Call." 

**[1:45]** Wait 10 seconds. Post-call summary slides up: "Customer reported failed UPI payment. Agent confirmed T+3 policy and offered dispute escalation. QA Score: 4.1/5.0."

**[2:00]** Close the panel. Open the same dashboard — QA breakdown is already there. **"The agent didn't write a single note."**

**[2:15]** Key message: "80% of support queries are repetitive. Every agent already knows the answer — they just can't find it fast enough. CallPilot gives it to them before they need to look."

---

## 20. Open Questions & Placeholders

### Needs Decision Before Implementation

| # | Question | Impact | Recommended Default |
|---|---------|--------|---------------------|
| Q-1 | SSE vs WebSocket for real-time panel updates? | Architecture | **SSE** for hackathon (simpler), WebSocket for production |
| Q-2 | ElevenLabs embedding API or OpenAI for KB embeddings? | Cost + latency | **OpenAI text-embedding-3-small** until EL embedding API is GA |
| Q-3 | Claude model for intent detection — Sonnet or Haiku? | Cost vs quality | **Haiku** for real-time intent (latency-sensitive), **Sonnet** for summarisation |
| Q-4 | pgvector `ivfflat` vs `hnsw` index for KB search? | Query speed | **hnsw** for <1M vectors (better recall, no train step) |
| Q-5 | Zustand vs React Context for `CallState`? | DX complexity | **Zustand** — simpler async updates from WebSocket callbacks |

### Known Gaps (Phase 2+)

| # | Gap | Phase |
|---|-----|-------|
| G-1 | Twilio integration for real phone number (inbound calls) | Phase 2 |
| G-2 | CRM write adapter (Salesforce + HubSpot) | Phase 2 |
| G-3 | Multi-company onboarding (company admin portal) | Phase 2 |
| G-4 | KB gap ticket workflow (Jira/Linear integration) | Phase 2 |
| G-5 | Multilingual support (Hindi, Tamil, Bengali) | Phase 3 |
| G-6 | CSAT prediction model fine-tuning on real call data | Phase 3 |
| G-7 | Mobile app for agents (React Native) | Phase 3 |
| G-8 | A/B testing framework for agent suggestions | Phase 3 |

### Placeholders in Codebase

- `// [PLACEHOLDER] embed()` — swap to ElevenLabs embedding API when available
- `// [PLACEHOLDER] CRM write` — enable when CRM credentials configured
- `// [PLACEHOLDER] Twilio SIP` — enable when phone number purchased
- `// [PLACEHOLDER] detectKbGaps()` — full implementation in Phase 2

---

*CallPilot PRD v1.0 · Confidential · Built for hackathon. Designed for scale.*
