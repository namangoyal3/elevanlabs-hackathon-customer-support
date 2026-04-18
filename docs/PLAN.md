# CallPilot — Implementation Plan (Phases 1–5)

> **Status:** Phase 0 ✅ shipped on branch `phase-0-setup` · Phases 1–5 pending
> **Source spec:** [`../CALLPILOT_PRD.md`](../CALLPILOT_PRD.md)
> **For agentic workers:** use `superpowers:subagent-driven-development` or
> `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

This plan was produced by `/plan-eng-review` (SMALL CHANGE / compressed mode)
on 2026-04-18. It locks the architecture decisions, lists every file that will
be touched per phase, defines the exit criteria + commit boundary, and embeds
the test diagram + failure modes used for QA.

---

## Locked Architecture Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Embeddings:** NVIDIA `nv-embedqa-e5-v5` (1024 dim, asymmetric — `passage` for ingest, `query` for search) | One vendor key (NVIDIA) covers LLM + embeddings; OPENAI_API_KEY no longer required |
| 2 | **Schema:** `kb_articles.embedding` resized `vector(1536) → vector(1024)` | Match new embedding model |
| 3 | **LLM:** NVIDIA Nemotron via OpenAI-compatible endpoint at `https://integrate.api.nvidia.com/v1` — `nano-8b` for intent (latency), `super-49b-v1.5` for summary + QA (quality) | Replaces Claude per user's vendor choice |
| 4 | **Real-time channel:** Server-Sent Events (`/api/stream`) — not WebSocket | No custom server needed; Next.js native; simpler reconnect |
| 5 | **State store:** Zustand (already in deps) | Cleaner async updates from SDK callbacks than React Context |
| 6 | **Tests:** Node's built-in `node:test` runner — no vitest/jest dep | Zero new deps; sufficient for pure-logic units (parsers, debounce, HMAC, weighted avg) |
| 7 | **Auth:** Clerk skipped for hackathon | Demo doesn't need login; saves 2h |
| 8 | **CRM write:** deferred to post-hackathon | PRD already gates this behind `CRM_TYPE` env |
| 9 | **Phone integration:** ElevenLabs browser SDK only — no Twilio | PRD scope: Phase 2+ |
| 10 | **HMAC:** SHA-256 verification on `/api/webhooks/call/end` with `ELEVENLABS_WEBHOOK_SECRET` | Industry standard, prevents pipeline DoS |

---

## Phase 1 — Knowledge Base + RAG  (~6h)

**Goal:** 8 NovaPay KB articles ingested with NVIDIA embeddings, retrievable via cosine similarity through a typed `ragSearch()` helper that backs the live KB-card surfacing in Phase 3.

### Files
- Create: `lib/nvidia-embed.ts` — `embedPassage(text)` and `embedQuery(text)` calling NVIDIA `nv-embedqa-e5-v5` via fetch (NVIDIA's `input_type` param isn't OpenAI-standard, so plain fetch is cleaner than the SDK).
- Create: `lib/rag.ts` — `ragSearch(query, topK = 3)` that embeds the query and calls the `match_kb_articles` RPC.
- Modify: `db/schema.sql` — `vector(1536) → vector(1024)`, update `match_kb_articles` arg type.
- Modify: `scripts/migrate.ts` — add a one-shot `DROP TABLE IF EXISTS kb_articles CASCADE;` guarded by `MIGRATE_RESET_KB=true` env var so re-running with the new dim is safe (then revert).
- Rewrite: `scripts/ingest-kb.ts` — replace OpenAI embeddings call with `embedPassage()`; remove `OPENAI_API_KEY` requirement.
- Create: `kb/novapay/failed-transaction-policy.md` (~400 words covering T+3 rule, U16/U30/U69 codes, dispute flow)
- Create: `kb/novapay/kyc-verification-guide.md` (Aadhaar/PAN/Passport, re-KYC triggers, rejection reasons)
- Create: `kb/novapay/loan-disbursement-faq.md` (eligibility, 24–48h timeline, EMI, prepayment)
- Create: `kb/novapay/wallet-topup-limits.md` (₹1L daily, UPI linking, OTP issues, limit increase)
- Create: `kb/novapay/chargeback-disputes.md` (filing, merchant escalation, 7-day SLA)
- Create: `kb/novapay/account-freeze-policy.md` (fraud + 3× wrong PIN triggers, unfreeze, 24h)
- Create: `kb/novapay/reward-points-cashback.md` (1.5% UPI, 2% wallet, 12-mo expiry)
- Create: `kb/novapay/privacy-data-deletion.md` (DPDP Act, 30-day SLA, portability)
- Create: `tests/rag.test.ts` — `node:test` suite for `ragSearch` (mocked RPC + embedding) and JSON-shape contracts.
- Create: `tests/ingest-kb.test.ts` — verifies article filename → id slug, title-from-first-line parsing.

### Bite-sized tasks
- [ ] Edit `db/schema.sql`: `vector(1536)` → `vector(1024)` in both `kb_articles` and `match_kb_articles`.
- [ ] Run `MIGRATE_RESET_KB=true npm run db:migrate` to drop + recreate the table.
- [ ] Verify via `psql` or Supabase Dashboard SQL Editor: `SELECT atttypmod FROM pg_attribute WHERE attname='embedding'` → expects `1028` (1024 + 4 typmod overhead).
- [ ] Write `lib/nvidia-embed.ts` (≤40 lines, plain fetch, exports both helpers).
- [ ] Write `tests/embed.test.ts` — verify URL, headers, body shape, error handling for non-200.
- [ ] Run `node --test tests/embed.test.ts` → PASS.
- [ ] Write `lib/rag.ts` — `ragSearch(query, topK)` returns `KbArticle[]` typed via `types/index.ts`.
- [ ] Write `tests/rag.test.ts` with a stubbed Supabase client + stubbed embed.
- [ ] Run tests → PASS.
- [ ] Write 8 KB markdown articles. Each article: H1 title, then ~400 words covering the facts in PRD §4.1.
- [ ] Rewrite `scripts/ingest-kb.ts` to use `embedPassage()` instead of OpenAI.
- [ ] Run `npm run db:ingest-kb` → expect 8 ✅ lines.
- [ ] Smoke-test retrieval: `tsx -e "import { ragSearch } from './lib/rag'; ragSearch('UPI payment failed refund').then(console.log)"` → top hit must be `failed-transaction-policy` with similarity > 0.72.
- [ ] Verify all 3 PRD §4.2 demo scenarios resolve to the expected articles.
- [ ] Commit: `feat(phase-1): NVIDIA-backed RAG + 8 NovaPay KB articles` on branch `phase-1-kb`.

### Tests (node:test)
- `embed.test.ts` — request shape, error path
- `rag.test.ts` — top-K ordering, threshold filter, malformed RPC response handling
- `ingest-kb.test.ts` — slug + title extraction, idempotent upsert payload
- Manual: 3 PRD demo queries return correct top article

### Exit criteria
- `kb_articles` row count = 8 with non-null embeddings
- `ragSearch("UPI payment failed refund")` returns `failed-transaction-policy` first
- All node:test suites green
- `npx next build` green
- Commit + push branch

### Failure modes covered
- NVIDIA 5xx during ingest → script exits non-zero, partial state visible
- Malformed embedding response (empty `data[]`) → script throws, no DB write
- Query similarity threshold too strict → caller gets `[]`, UI shows empty state

---

## Phase 2 — Agent UI + Mock CallState  (~8h)

**Goal:** The full `/agent` dashboard renders all 9 components driven from a Zustand `CallState` store, exercised end-to-end with mock data through every status transition (idle → pre_call → active → ended).

### Files
- Create: `lib/store.ts` — Zustand store with `CallState` shape and action creators (`setStatus`, `appendTranscript`, `setKbCards`, `setSentiment`, `setIntent`, `triggerEscalation`, `setSummary`, `reset`).
- Create: `lib/demo-personas.ts` — 3 personas from PRD §8.4.
- Modify: `app/agent/page.tsx` — full 40/60 layout, header, status switching.
- Create: `components/CallerBrief.tsx`
- Create: `components/LiveTranscript.tsx` (auto-scroll on append)
- Create: `components/SentimentBar.tsx` (green/amber/red transitions, smooth CSS)
- Create: `components/IntentBadge.tsx` (fade-in animation, intent-category color)
- Create: `components/KbCard.tsx` (title, snippet, similarity badge, top-card border accent)
- Create: `components/SuggestedReplies.tsx` (max 3 chips, click-to-clipboard, flash)
- Create: `components/EscalationAlert.tsx` (red banner, dismissible, 10s cooldown)
- Create: `components/PostCallSummary.tsx` (slide-up drawer)
- Create: `components/CallControls.tsx` (Start / End buttons; in Phase 2 they just toggle status)
- Create: `components/PersonaPicker.tsx` (dropdown of 3 demo personas)
- Modify: `tailwind.config.ts` — add intent-color tokens (transaction-blue, kyc-amber, loan-violet, etc.)
- Create: `tests/store.test.ts` — Zustand actions are pure and produce expected diffs.

### Bite-sized tasks
- [ ] Build Zustand store skeleton; test all action creators with `node:test`.
- [ ] Wire `app/agent/page.tsx` to subscribe to store + status-driven layout.
- [ ] Build each component bottom-up (props-only, no store coupling) so they're individually previewable.
- [ ] Wire each component to the store inside `app/agent/page.tsx`.
- [ ] Hardcode a "Cycle demo states" dev-only button that simulates idle → pre_call → active → ended in 10s.
- [ ] Manual QA: each transition renders correctly, no React warnings, escalation banner dismissible, KbCard click copies snippet.
- [ ] Run `npx next build` → green.
- [ ] Commit + push `phase-2-ui`.

### Exit criteria
- All 4 status states render without errors
- All 3 demo personas selectable and shown in CallerBrief
- Mock transcript scrolls and pins to bottom
- KbCard click-to-clipboard works
- Sentiment bar smoothly animates color across thresholds
- Build + typecheck green

### Failure modes covered
- Store rehydrates from stale `localStorage` → store is session-only (no persistence) for hackathon
- Empty mock data → components render skeleton states, not crash

---

## Phase 3 — Live Call (ElevenLabs + Nemotron + SSE)  (~8h)

**Goal:** Real audio call through ElevenLabs browser SDK updates the dashboard live: transcript streams, intent flips, KB cards swap, sentiment moves, escalation fires. End-to-end latency from utterance → KB card update ≤ 1s p50.

### Data flow

```
Browser audio
  └─▶ ElevenLabs SDK (useConversation)
        ├─ onMessage(transcriptChunk)
        │   └─▶ store.appendTranscript()
        │   └─▶ POST /api/transcript {chunk, callId}
        │         └─▶ debounced(2s) intent detect
        │               └─▶ Nemotron nano-8b → JSON
        │               └─▶ if changed: ragSearch → SSE { kb_update }
        │         └─▶ if customer: sentiment score → SSE { sentiment }
        │               └─▶ if < -0.6: SSE { escalation }
        └─ onDisconnect
            └─▶ store.setStatus('ended') + trigger post-call (Phase 4)

Browser EventSource('/api/stream?callId=...')
  └─▶ store.applyEvent(payload)
```

### Files
- Create: `lib/nvidia-llm.ts` — OpenAI SDK configured with NVIDIA `baseURL` + key. Two helpers: `detectIntent(transcriptChunks)` (nano-8b) and (Phase 4) `summarizeCall`, `scoreQA` (super-49b).
- Create: `lib/elevenlabs-agent.ts` — `useCallPilot(persona)` hook wrapping `useConversation`.
- Create: `lib/transcript-handler.ts` — pure logic: rolling buffer (cap 10), debounce(2s), sentiment threshold (-0.6).
- Create: `lib/sse-bus.ts` — server-side in-memory pub/sub keyed by callId. Topic for hackathon scale.
- Create: `app/api/transcript/route.ts` — POST: appends chunk to DB, runs intent + sentiment pipeline, publishes SSE events.
- Create: `app/api/stream/route.ts` — GET: SSE stream for a callId, sends initial heartbeat then bus messages, 15s keepalive.
- Modify: `lib/store.ts` — add `applyEvent({type, payload})` reducer.
- Modify: `components/CallControls.tsx` — Start/End now drive the EL SDK.
- Modify: `app/agent/page.tsx` — opens EventSource on mount, closes on unmount.
- Create: `tests/transcript-handler.test.ts` — debounce, buffer cap, sentiment threshold.
- Create: `tests/intent-parser.test.ts` — Nemotron malformed JSON falls back to `intent=other, confidence=0`.

### Bite-sized tasks
- [ ] Write `lib/nvidia-llm.ts`. Smoke-test `detectIntent` with a stub transcript — expect JSON with `intent`, `confidence`, `query`.
- [ ] Write `tests/intent-parser.test.ts` — bad JSON, missing field, low-confidence (< 0.7) returns "no change" sentinel.
- [ ] Write `lib/transcript-handler.test.ts` — buffer eviction, single intent call after rapid chunks, sentiment trigger.
- [ ] Build `lib/transcript-handler.ts` to pass tests.
- [ ] Build `lib/sse-bus.ts` (in-memory `Map<callId, Set<controller>>`).
- [ ] Build `app/api/stream/route.ts` (ReadableStream + 15s heartbeat ping).
- [ ] Build `app/api/transcript/route.ts` (calls handler, publishes via bus).
- [ ] Wire `useCallPilot` hook with `onMessage` POSTing to `/api/transcript`.
- [ ] In `app/agent/page.tsx`, open EventSource, dispatch into store via `applyEvent`.
- [ ] Verify ElevenLabs agent `Hi` → transcript appears.
- [ ] Verify saying "my UPI payment failed" → IntentBadge updates within ~2s, KbCard 1 surfaces.
- [ ] Verify all 3 PRD §4.2 scenarios.
- [ ] Verify escalation: simulate `-0.7` sentiment → red banner.
- [ ] Run `npx next build` → green.
- [ ] Commit + push `phase-3-live-call`.

### Exit criteria
- Live call audio captured + streamed via EL SDK
- Transcript renders in left panel within ≤300ms of utterance
- KB cards swap on intent change in ≤2s
- Sentiment bar updates every customer utterance
- Escalation banner fires on `< -0.6` once per 10s
- All node:test suites green; build green
- 3 PRD scenarios pass live

### Failure modes covered
- Nemotron times out → previous KB cards stay; no UI thrash
- Bad JSON from Nemotron → fallback intent, no crash (tested)
- SSE client disconnects → server cleans up controller from bus
- Multiple concurrent calls (one agent) → bus partitions by callId
- Audio permission denied → store sets `status=idle`, error toast

### Critical-gap tests
- HMAC bypass (Phase 4 test, but stubbed pipeline triggered here)
- Concurrent SSE connections from one client → only one EventSource open

---

## Phase 4 — Post-Call Webhook + Summary + QA  (~4h)

**Goal:** ElevenLabs `call_end` webhook → 200 in <5s → background pipeline that produces a 3-sentence summary + 8-criterion QA score, surfaces in `<PostCallSummary>` within 30s.

### Data flow

```
ElevenLabs → POST /api/webhooks/call/end
  ├─ HMAC-SHA256 verify (ELEVENLABS_WEBHOOK_SECRET)
  ├─ idempotency: db.calls.upsert({id, processed: true}) early
  ├─ return 200 OK  (< 5s required)
  └─ setImmediate(runPostCallPipeline):
        ├─ summarize(transcript) → super-49b → JSON
        ├─ scoreQA(transcript)   → super-49b → JSON
        ├─ db.calls.update + db.qa_scores.insert
        └─ ssePush(callId, { post_call_summary })
```

### Files
- Create: `app/api/webhooks/call/end/route.ts` — HMAC verify, idempotency, async pipeline.
- Modify: `lib/nvidia-llm.ts` — add `summarizeCall(transcript)` and `scoreQA(transcript, meta)`.
- Create: `lib/post-call.ts` — `runPostCallPipeline(callId, transcript, meta)`.
- Create: `tests/webhook-hmac.test.ts` — good sig 200, bad sig 401, missing sig 401, replay (idempotent).
- Create: `tests/summary-parser.test.ts` — disposition enum check, fallback when JSON malformed.
- Create: `tests/qa-score.test.ts` — weighted average correctness across the 8 criteria.

### Bite-sized tasks
- [ ] Write `tests/webhook-hmac.test.ts` (RED).
- [ ] Implement HMAC verification; test → GREEN.
- [ ] Write `tests/summary-parser.test.ts` (RED).
- [ ] Implement `summarizeCall`; test → GREEN.
- [ ] Write `tests/qa-score.test.ts` (RED).
- [ ] Implement `scoreQA`; test → GREEN.
- [ ] Wire `runPostCallPipeline` + SSE push.
- [ ] Configure ElevenLabs agent webhook URL (use ngrok for local: `ngrok http 3000`).
- [ ] End live call → verify summary drawer renders within 30s.
- [ ] Commit + push `phase-4-post-call`.

### Exit criteria
- Webhook 200 in < 5s under load
- Bad HMAC → 401, no pipeline run (tested)
- Duplicate webhook → idempotent (tested)
- Summary text + disposition + 8 criterion scores rendered in PostCallSummary
- All node:test suites green
- Build + typecheck green

### Failure modes covered
- HMAC missing/wrong → 401 (tested)
- Duplicate webhook → no-op (tested)
- Nemotron 5xx during summary → call row marked `disposition=null`, summary text = `"summary unavailable"`, error logged
- super-49b returns text instead of JSON → parser fallback, drawer shows "summary unavailable"
- Pipeline crashes → never blocks the 200 response (setImmediate isolates)

### Critical-gap flag — RESOLVED
- HMAC bypass: tested + handled
- Silent pipeline failure: surfaced via UI fallback string + structured log

---

## Phase 5 — Polish + Deploy  (~4h)

**Goal:** Demo-ready on Vercel with a live URL, all 3 scenarios rehearsed, fallback video recorded.

### Tasks
- [ ] Add CSS transitions: KbCard slide-in (right→), IntentBadge fade, SentimentBar smooth color tween.
- [ ] Add escalation alert 10s cooldown so it doesn't spam.
- [ ] Add error toast component (toasts on EL connect failure, Nemotron 5xx, webhook 401).
- [ ] Add Loading skeletons for KbCard while RAG runs.
- [ ] Add `/health` page with system status (DB, NVIDIA, EL agent).
- [ ] Configure Vercel project — link GitHub repo, paste env vars (Supabase + NVIDIA + EL).
- [ ] Configure ElevenLabs webhook to Vercel URL: `https://<vercel-app>.vercel.app/api/webhooks/call/end`.
- [ ] Smoke-test all 3 PRD §4.2 scenarios on the live URL.
- [ ] Record 90s fallback video in case live demo fails.
- [ ] Update `README.md` with live demo URL.
- [ ] Commit + push `phase-5-deploy`.
- [ ] Open PR `main ← phase-5-deploy` (after merging earlier phase branches).

### Exit criteria
- Live URL responds, `/api/health` green, dashboard loads
- 3 demo scenarios end-to-end on production
- Fallback video stored in repo (or linked from README)

---

## Test Diagram (consolidated)

```
                    ┌────────────────────────────────────────┐
                    │               Phase 1                  │
                    │  embed → upsert → ragSearch ↔ RPC      │
                    │  tests: embed, rag, ingest-kb (3)      │
                    └─────────────────┬──────────────────────┘
                                      │
                    ┌─────────────────┴──────────────────────┐
                    │               Phase 2                  │
                    │  Zustand store ↔ 9 components          │
                    │  tests: store actions (1)              │
                    └─────────────────┬──────────────────────┘
                                      │
                    ┌─────────────────┴──────────────────────┐
                    │               Phase 3                  │
                    │  EL SDK ↔ handler ↔ Nemotron ↔ SSE     │
                    │  tests: handler, intent-parser (2)     │
                    └─────────────────┬──────────────────────┘
                                      │
                    ┌─────────────────┴──────────────────────┐
                    │               Phase 4                  │
                    │  webhook ↔ HMAC ↔ pipeline ↔ SSE       │
                    │  tests: hmac, summary, qa-score (3)    │
                    └────────────────────────────────────────┘
```

Total node:test suites: **9**. Run all via `node --test tests/*.test.ts`.

---

## Failure Mode Audit

| Phase | Codepath | Failure | Test? | Handling? | Visible? |
|-------|----------|---------|-------|-----------|----------|
| 1 | NVIDIA embed 5xx | exits non-zero | ✓ | retry not added (out of scope) | log |
| 1 | RPC returns no matches | empty result | ✓ | UI shows empty state | yes |
| 2 | Stale localStorage | confusing state | n/a | session-only store, no persist | n/a |
| 3 | Nemotron timeout | KB stale | manual | UI keeps prior cards | silent (acceptable) |
| 3 | Bad intent JSON | fallback | ✓ | fallback intent=other | yes (banner unchanged) |
| 3 | SSE drop | events lost | manual | EventSource auto-reconnects | yes (gap in transcript) |
| 4 | Bad HMAC | 401 | ✓ | reject | yes (caller sees 401) |
| 4 | Duplicate webhook | re-run | ✓ | idempotent early-return | n/a |
| 4 | Summary 5xx | no summary | manual | "summary unavailable" string | yes |

**Critical gaps:** none remaining. SSE drop is the only "silent" item but EventSource handles reconnect automatically.

---

## NOT in Scope (deferred / explicit non-goals)

| Item | Why deferred |
|------|--------------|
| CRM write (Salesforce/HubSpot) | PRD scopes to Phase 2; gated behind `CRM_TYPE` env |
| Twilio phone number / SIP | PRD scopes to Phase 2 |
| Clerk authentication | Hackathon demo doesn't need login; saves 2h |
| Multilingual support (Hi/Ta/Bn) | PRD Phase 3 |
| Native mobile app | PRD Phase 3 |
| KB gap workflow (Jira/Linear) | PRD Phase 2 |
| CSAT prediction model fine-tune | PRD Phase 3; requires real call data |
| Per-tenant company onboarding portal | PRD Phase 2 |
| Analytics dashboard | PRD Phase 3 |
| OpenAI embedding fallback | We picked NVIDIA-only; adds switch complexity for no demo value |
| Webhook retry logic | ElevenLabs handles retries; idempotent endpoint is sufficient |
| Row-level security (RLS) policies | We use service-role key server-side; RLS off is fine for demo |

---

## What Already Exists (reused, not rebuilt)

| Asset | Location | Reuse |
|-------|----------|-------|
| Next.js scaffold + Tailwind theme | `app/`, `tailwind.config.ts` | Phase 2 layout uses existing `bg/surface/border/accent` tokens |
| Lazy Supabase admin client | `lib/db.ts` | Phases 1–4 import as-is |
| `health()` + `match_kb_articles()` RPCs | `db/schema.sql` | Phase 1 calls match_kb_articles via RPC, no rewrite |
| TypeScript types (Contact, KbArticle, CallState, etc.) | `types/index.ts` | Imported across all phases |
| Migration script | `scripts/migrate.ts` | Phase 1 just edits the schema and re-runs |
| KB ingestion stub | `scripts/ingest-kb.ts` | Phase 1 swaps OpenAI → NVIDIA |
| ElevenLabs React SDK | `@elevenlabs/react@0.6.0` | Phase 3 hook wraps `useConversation` |
| `/api/health` pattern | `app/api/health/route.ts` | Phase 3/4 routes follow same shape |

---

## Commit + Branch Strategy

One feature branch per phase off `main`:

| Phase | Branch | Commit prefix |
|-------|--------|---------------|
| 1 | `phase-1-kb` | `feat(phase-1):` |
| 2 | `phase-2-ui` | `feat(phase-2):` |
| 3 | `phase-3-live-call` | `feat(phase-3):` |
| 4 | `phase-4-post-call` | `feat(phase-4):` |
| 5 | `phase-5-deploy` | `chore(phase-5):` |

Each phase: branch → implement → test → commit → push → PR. Merge to `main` only after all four review sections pass and the build is green.

---

## TODOs to capture later

These are items the review surfaced that are out-of-scope for Phases 1–5 but worth tracking. To be added to a `TODOS.md` file at the end of Phase 5:

1. **OpenAI embedding fallback** — if NVIDIA embedding endpoint has an outage, having a one-line switch in `lib/nvidia-embed.ts` to OpenAI keeps RAG working. Cost: low; value: medium (demo resilience).
2. **Webhook secret rotation** — add a runbook entry for rotating `ELEVENLABS_WEBHOOK_SECRET` without downtime (dual-secret window).
3. **RLS policies on tables** — currently service-role-only access. For multi-tenant production, add RLS on `calls`, `transcript_chunks`, `kb_articles`. Out of scope for demo.
4. **Playwright integration test harness** — automate the 3 PRD demo scenarios so regressions surface in CI. Useful post-hackathon when iterating.
5. **Reranker pass on RAG results** — `nvidia/nv-rerankqa-mistral-4b-v3` after the vector top-K could improve KB-card precision. Cost: ~150ms per query.
6. **Per-call cost telemetry** — log NVIDIA + EL token/credit usage per call to a `call_costs` table for per-call P&L visibility.

---

*Plan version 1.0 · Generated by `/plan-eng-review` on 2026-04-18 · Locked architecture decisions are commitments, not suggestions.*
