# Architecture

Technical deep-dive into how CallPilot works.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Call Lifecycle](#2-call-lifecycle)
3. [Real-Time Pipeline](#3-real-time-pipeline)
4. [Vector RAG Pipeline](#4-vector-rag-pipeline)
5. [Post-Call Pipeline](#5-post-call-pipeline)
6. [State Machine](#6-state-machine)
7. [Key Design Decisions](#7-key-design-decisions)
8. [Data Model](#8-data-model)
9. [Scalability Notes](#9-scalability-notes)

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          BROWSER                                     │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              Agent Dashboard (Next.js)                      │   │
│   │                                                             │   │
│   │  PersonaPicker → CallerBrief → LiveTranscript               │   │
│   │  IntentBadge → KbCards → SentimentBar → SuggestedReplies    │   │
│   │  EscalationAlert → PostCallSummary                          │   │
│   │                                                             │   │
│   │  useCallPilot() ─── ElevenLabs useConversation()            │   │
│   │  Zustand store  ─── SSE EventSource (/api/stream)           │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                    │ WebRTC (audio)     │ SSE (updates)              │
└────────────────────┼────────────────────┼─────────────────────────────┘
                     │                    │
          ┌──────────▼──────┐   ┌─────────▼──────────────────────────┐
          │  ElevenLabs      │   │          Next.js API Routes         │
          │  Conversational  │   │                                     │
          │  AI (WebRTC STT) │   │  POST /api/transcript               │
          │                  │   │    → TranscriptHandler              │
          │  POST webhook    │   │    → detectIntent() [NVIDIA nano]   │
          │  (call_end)      │   │    → ragSearch() [Supabase RPC]     │
          └──────────────────┘   │    → sentimentScore() [sync]        │
                     │           │    → SSE push via sse-bus           │
                     │           │                                     │
                     │           │  GET /api/stream?callId=...         │
                     │           │    → ReadableStream (SSE)           │
                     │           │    → 15s keepalive heartbeat        │
                     │           │                                     │
          ┌──────────▼──────┐   │  POST /api/webhooks/call/end        │
          │  HMAC verify    │───▶│    → HMAC verify                    │
          │  + idempotency  │   │    → runPostCallPipeline()          │
          └─────────────────┘   │    → summarizeCall() [super-49b]    │
                                 │    → scoreQA() [super-49b]          │
                                 │    → DB write + SSE push            │
                                 └─────────────────────────────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        │                                             │
               ┌────────▼────────┐                   ┌───────────────▼──────┐
               │   NVIDIA NIM    │                   │      SUPABASE        │
               │                 │                   │                      │
               │ nano-8b         │                   │  kb_articles         │
               │  intent class.  │                   │  (vector 1024-dim)   │
               │                 │                   │  ← HNSW cosine idx   │
               │ super-49b       │                   │                      │
               │  summary + QA   │                   │  calls               │
               │                 │                   │  transcript_chunks   │
               │ nv-embedqa-e5   │                   │  qa_scores           │
               │  passage/query  │                   │  audit_log           │
               └─────────────────┘                   └──────────────────────┘
```

---

## 2. Call Lifecycle

```
idle
  │
  ▼ pickPersona(contact)
pre_call                    ← KB preloaded, caller brief shown
  │
  ▼ startCall()
active                      ← ElevenLabs WebRTC connected
  │                         ← SSE stream open at /api/stream?callId=...
  │                         ← transcript chunks → /api/transcript (POST)
  │                         ← TranscriptHandler debouncing utterances
  │                         ← intent updated every ~2s
  │                         ← KB cards updated on intent change
  │                         ← sentiment bar updated per chunk
  │
  ▼ endCall() or onDisconnect
ended                       ← waiting for post-call webhook
  │
  ▼ [webhook: POST /api/webhooks/call/end]
ended+summary               ← PostCallSummary panel shows
  │
  ▼ reset()
idle
```

---

## 3. Real-Time Pipeline

Every transcript chunk goes through this pipeline in under 2 seconds (p99):

```
ElevenLabs onMessage
  │
  ▼
lib/elevenlabs-agent.ts:useCallPilot()
  POST /api/transcript { callId, speaker, text, timestamp }
  │
  ▼
app/api/transcript/route.ts
  │
  ├─ TranscriptHandler.addChunk(chunk)
  │     rolling buffer: last 10 utterances
  │     keyword sentiment scoring (synchronous, <1ms)
  │     debounce timer reset (fires after 2s of silence)
  │
  └─ [DEBOUNCE FIRES] ──────────────────────────────────────────┐
                                                                 │
       detectIntent(last10utterances)                            │
         POST https://integrate.api.nvidia.com/v1/chat          │
         model: llama-3.1-nemotron-nano-8b-v1                   │
         → JSON { intent, confidence, reasoning }               │
         → defensive parse: strip markdown fences,              │
           extract first {...}, clamp confidence 0–1            │
         → fallback to "unknown" on any parse failure           │
                                                                 │
       [if intent changed] ragSearch(query, intent)              │
         Supabase RPC: match_kb_articles(embedding, limit=2)     │
         embedQuery(text) → nvidia nv-embedqa-e5-v5             │
         → top 2 articles by cosine similarity                  │
                                                                 │
       sseBus.publish(callId, {                                  │
         type: 'intent', intent, confidence,                     │
         type: 'kb', articles: [KbArticle, KbArticle],           │
         type: 'sentiment', score: -1..1,                        │
         type: 'transcript', chunk                               │
       })                                                        │
                                                                 ▼
                                              Browser EventSource receives
                                              → Zustand store updated
                                              → Components re-render
```

### Sentiment Scoring

Synchronous keyword-based scoring, never waits for LLM:

```typescript
// Keyword weights (from lib/transcript-handler.ts)
positive: ['thanks', 'great', 'resolved', 'perfect', ...]  → +0.3 each
negative: ['angry', 'frustrated', 'unacceptable', ...]     → -0.4 each
escalation: ['manager', 'supervisor', 'lawsuit', ...]      → -0.7 each
```

Score is the bounded sum over the last utterance. A separate "escalation alert" fires when the rolling average drops below −0.6.

---

## 4. Vector RAG Pipeline

### Ingestion (run once)

```
kb/novapay/*.md
  │
  ▼ scripts/ingest-kb.ts
  │
  ├─ Read markdown file
  ├─ embedPassage(content)         ← NVIDIA nv-embedqa-e5-v5, inputType="passage"
  │   → float32[1024]
  │
  └─ supabase.from('kb_articles').upsert({
       id,          -- SHA-256 of filepath
       title,
       content,
       embedding    -- vector(1024)
     })
```

The `passage` input type is critical. NVIDIA's `nv-embedqa-e5-v5` is an asymmetric model — using `query` at ingest time would degrade recall by ~15%.

### Search (every intent change)

```
query string (user utterance context)
  │
  ▼ embedQuery(query)              ← inputType="query"
  │   → float32[1024]
  │
  ▼ supabase.rpc('match_kb_articles', {
      query_embedding: float32[1024],
      match_threshold: 0.5,
      match_count: 2
    })
  │
  ▼ Postgres: SELECT ... ORDER BY embedding <=> $1 LIMIT 2
              (cosine distance via pgvector HNSW index)
  │
  ▼ [KbArticle, KbArticle]        ← top 2 by similarity
```

The HNSW index (`USING hnsw (embedding vector_cosine_ops)`) was chosen over IVFFlat because:
- No training step required at ingest
- Better recall at small table sizes (< 100K rows)
- Consistent p99 latency regardless of recent inserts

---

## 5. Post-Call Pipeline

Triggered by the HMAC-verified ElevenLabs webhook. Runs in ~8–12 seconds total.

```
POST /api/webhooks/call/end
  │
  ├─ verifyHmac(signature, body, secret)
  │   uses timingSafeEqual — constant-time comparison prevents timing attacks
  │
  ├─ [idempotency check]
  │   SELECT processed FROM calls WHERE id = callId
  │   if processed: return 200 immediately (no-op)
  │
  ├─ upsert calls SET processed=true    ← claim the work
  │
  └─ runPostCallPipeline(callId, transcript)
       │
       ├─ [parallel]
       │   ├─ summarizeCall(transcript)
       │   │     model: llama-3.3-nemotron-super-49b-v1.5
       │   │     → { summary, disposition, followUps, sentimentTrend }
       │   │     → defensive JSON parse with fallbacks
       │   │
       │   └─ scoreQA(transcript)
       │         model: llama-3.3-nemotron-super-49b-v1.5
       │         8 criteria: greeting, accuracy, empathy, compliance,
       │                     fcr, escalation, duration, crmUpdate
       │         → { scores: Record<Criterion, 0–10>, highlights, suggestions }
       │         → weightedAverage() → single 0–100 score
       │
       ├─ DB writes (parallel):
       │   ├─ calls table: summary, disposition, csatPrediction, qaScore
       │   ├─ qa_scores table: per-criterion scores as JSONB
       │   └─ audit_log: call_summarized event
       │
       └─ sseBus.publish(callId, { type: 'summary', ...result })
             → browser PostCallSummary panel renders
```

### QA Criteria Weights

```
criterion       weight
─────────────────────
greeting          0.08
accuracy          0.25   ← highest — getting the answer right matters most
empathy           0.15
compliance        0.12
fcr               0.18   ← first call resolution — strong business signal
escalationHandling 0.08
callDuration      0.07
crmUpdate         0.07
```

---

## 6. State Machine

Zustand store (`lib/store.ts`) enforces a strict state machine. Invalid transitions are silent no-ops.

```
States: idle | pre_call | active | ended

idle      ──pickPersona()──▶  pre_call
pre_call  ──startCall()───▶  active
pre_call  ──reset()────────▶  idle
active    ──endCall()──────▶  ended
active    ──reset()────────▶  idle        (emergency exit)
ended     ──reset()────────▶  idle
```

Actions that require a specific prior state:
```typescript
pickPersona: only from idle
startCall:   only from pre_call
endCall:     only from active
```

This prevents race conditions where a late-arriving SSE event triggers a state update after the user has already reset.

---

## 7. Key Design Decisions

### SSE over WebSocket
Native `ReadableStream` API response — no `ws` package, no custom server upgrade handler. The browser `EventSource` auto-reconnects on drop. 15-second keepalive heartbeat prevents proxy timeouts.

### In-Memory SSE Bus
`lib/sse-bus.ts` is a `Map<callId, Set<Subscriber>>`. Each SSE subscription adds itself to the set; when the connection closes it removes itself. The API route fans out to all subscribers.

**Limitation:** Only works single-process. Multiple Next.js worker processes (e.g. `cluster` mode, Vercel Edge) would miss events published to other workers. Production fix: Redis pub/sub or Upstash.

### Two-Tier LLM Strategy
| Model | Latency | Quality | Used for |
|---|---|---|---|
| `nano-8b` | ~300ms | Adequate | Intent every 2s during live call |
| `super-49b` | ~8s | High | Summary + QA once post-call |

The cost of a wrong intent prediction is low (agent sees a slightly wrong KB card for 2s). The cost of a wrong summary is high (permanent record). So we use different models for each path.

### Defensive LLM Parsing
Both `parseIntentResponse()` and `parseSummaryResponse()` are defensive:
1. Strip markdown code fences (` ```json ... ``` `)
2. Extract the first `{...}` from surrounding prose
3. Clamp numeric values to expected ranges
4. Fall back to safe defaults on any parse failure

The LLMs never directly crash the app, even if they hallucinate non-JSON output.

### Asymmetric Embeddings
NVIDIA's `nv-embedqa-e5-v5` is trained with separate `passage` and `query` input types. Using the wrong type at either end degrades cosine similarity scores by ~15% in our smoke tests. The code enforces this at the API level:
```typescript
embedPassage(text: string)  // for kb_articles at ingest time
embedQuery(text: string)    // for search queries at runtime
```

### Webhook Idempotency
ElevenLabs may deliver `call_end` webhooks multiple times (at-least-once delivery). The handler:
1. Checks `SELECT processed FROM calls WHERE id = ?`
2. If already processed: returns 200 immediately
3. Otherwise: upserts `processed = true` then starts the pipeline

This makes the webhook safe to receive any number of times with identical results.

---

## 8. Data Model

```sql
calls
  id            TEXT PRIMARY KEY   -- ElevenLabs call ID
  contact_id    TEXT
  started_at    TIMESTAMPTZ
  ended_at      TIMESTAMPTZ
  duration_s    INTEGER
  summary       TEXT
  disposition   TEXT               -- resolved|follow_up|escalated|abandoned
  sentiment_trend TEXT
  csat_prediction FLOAT
  qa_score      FLOAT              -- weighted average 0–100
  processed     BOOLEAN DEFAULT FALSE

transcript_chunks
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  call_id       TEXT REFERENCES calls(id)
  speaker       TEXT               -- agent|customer
  text          TEXT
  sentiment     FLOAT              -- -1 to +1
  ts            TIMESTAMPTZ

kb_articles
  id            TEXT PRIMARY KEY   -- SHA-256 of filepath
  title         TEXT
  content       TEXT
  embedding     vector(1024)       -- HNSW cosine index
  intent_tags   TEXT[]
  created_at    TIMESTAMPTZ

kb_gaps
  id            UUID DEFAULT gen_random_uuid()
  call_id       TEXT
  query         TEXT
  created_at    TIMESTAMPTZ

qa_scores
  id            UUID DEFAULT gen_random_uuid()
  call_id       TEXT REFERENCES calls(id)
  scores        JSONB              -- Record<Criterion, 0–10>
  highlights    TEXT[]
  suggestions   TEXT[]

audit_log
  id            UUID DEFAULT gen_random_uuid()
  call_id       TEXT
  event         TEXT
  payload       JSONB
  created_at    TIMESTAMPTZ DEFAULT now()
```

The `audit_log` table is append-only by convention — rows are never updated or deleted. It records every call lifecycle event for debugging and compliance.

---

## 9. Scalability Notes

This is a hackathon MVP. Here's what would need to change for production scale:

| Current | Production replacement | Reason |
|---|---|---|
| In-memory SSE bus (`Map<callId, Set>`) | Redis pub/sub (Upstash) | Multi-process / multi-region fan-out |
| No auth | Clerk or Auth.js | Agent identity, session management |
| Single Supabase project | Connection pooler (PgBouncer) | High concurrent connections |
| HNSW on `kb_articles` | Partitioned by tenant | Multi-tenant isolation |
| In-process debounce timer | Durable queue (BullMQ, etc.) | Survives process restart |
| Keyword sentiment | Fine-tuned embedding classifier | Better accuracy, multilingual |
| 8 KB articles | Full KB with hybrid search (BM25 + vector) | Scale to thousands of articles |

None of these are blockers for a single-tenant demo or small team deployment.

---

← [Setup Guide](SETUP.md) | [Back to README](../README.md) | [Whisper Coach →](WHISPER_COACH.md)
