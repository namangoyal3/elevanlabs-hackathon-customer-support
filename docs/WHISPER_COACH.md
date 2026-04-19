# Whisper Coach

> **Status:** Proposed — Not yet implemented  
> **Priority:** High — Completes the ElevenLabs story  
> **Effort estimate:** 3–5 days

---

## The Idea in One Sentence

Instead of *showing* coaching tips on screen, CallPilot *speaks* them directly into the agent's ear — in real time, during the live call — using ElevenLabs TTS on a private audio channel the customer cannot hear.

---

## Why This Changes Everything

CallPilot already has all the intelligence: intent detection, sentiment scoring, KB articles, escalation signals, suggested replies. But it delivers them on a screen the agent has to read while simultaneously listening to a customer and thinking about what to say next.

That's three cognitive streams at once.

**Whisper Coach collapses it to one.** The agent just listens. The AI becomes an invisible voice in their ear — like a senior colleague standing behind them, whispering "Try empathizing here" or "The answer is in Policy 3.2 — daily limits reset at midnight."

The agent's eyes never leave the customer. Their voice stays calm. Their response time drops. Their CSAT goes up.

This is not a UI improvement. It is a fundamentally different interaction model.

---

## How It Works

```
┌────────────────────────────────────────────────────────────────┐
│                       AGENT'S HEADSET                          │
│                                                                │
│   Left ear:  Customer voice (via ElevenLabs WebRTC)           │
│   Right ear: Whisper Coach (private TTS channel)              │
│                                                                │
│   Customer cannot hear the right ear channel.                 │
└────────────────────────────────────────────────────────────────┘
```

### Signal Flow

```
TranscriptHandler detects:
  • Intent change (high confidence)
  • Sentiment drops below threshold
  • Escalation signal in utterance
  • Customer asks a question we can answer
        │
        ▼
WhisperCoach.generateTip(context)
  • Uses existing intent + KB data (no extra LLM call needed)
  • Selects from tiered tip library (scripted fast-path)
  • Falls back to llama-nano-8b for novel situations
        │
        ▼
ElevenLabs TTS (low-latency streaming)
  • Voice: calm, neutral, slightly lower than call audio
  • Speed: slightly faster than normal speech
  • Volume: configurable whisper level
        │
        ▼
Injected into right-channel of agent's browser audio
  (Web Audio API, separate AudioContext from call audio)
        │
        ▼
Agent hears: "Customer is frustrated. Lead with empathy,
              then offer the refund timeline."
```

---

## What It Says and When

### Trigger: Intent Detected (high confidence)

```
"[Customer name] has a failed transaction question.
 Policy 3.2: refunds process in 3 to 5 business days.
 Offer to send an email confirmation."
```

Spoken once, immediately when intent locks in with confidence > 0.8.

### Trigger: Sentiment Drops Below −0.4

```
"Customer is getting frustrated. Slow down,
 acknowledge their experience before offering solutions."
```

Spoken after 2 consecutive negative-scored utterances.

### Trigger: Escalation Signal Detected

```
"Escalation signal. Offer to escalate proactively —
 don't wait for them to ask. Say: I can connect you
 with a senior specialist right now."
```

Spoken immediately on detection. The agent gets ahead of it.

### Trigger: Customer Asks Direct Question

```
"They're asking about loan status.
 Loan disbursement FAQ: approval to disbursement
 takes 24 to 48 hours. Confirmation SMS is sent."
```

Reads the most relevant KB snippet, spoken naturally.

### Trigger: Long Silence (> 8 seconds)

```
"Check in with the customer."
```

A gentle nudge. Prevents dead air.

### Trigger: QA Signal — Call Running Long

```
"Call is at 6 minutes. Aim to wrap in 2 more.
 Check if the issue is resolved."
```

Prevents agents from over-explaining.

---

## Tip Design Principles

1. **Never repeat.** If the agent has already heard this tip, don't say it again.
2. **Maximum 2 sentences.** Agents can't process more mid-conversation.
3. **Actionable, not analytical.** "Say X" is better than "The sentiment is negative."
4. **Always calm.** Never urgent, never alarming. The agent hears urgency from the customer already.
5. **Whisper-volume by default.** Configurable — some agents prefer off during complex calls.
6. **Interruptible.** Pressing a hotkey stops the current tip mid-sentence.

---

## Technical Implementation Plan

### Phase 1: Core TTS Channel

**New: `lib/whisper-coach.ts`**
```typescript
interface WhisperTip {
  text: string
  triggerType: 'intent' | 'sentiment' | 'escalation' | 'silence' | 'qa'
  priority: 'high' | 'normal' | 'low'
  dedupeKey: string  // prevent repeating same tip
}

class WhisperCoach {
  private spokenTips = new Set<string>()
  private audioContext: AudioContext
  private currentSource: AudioBufferSourceNode | null = null
  
  async speak(tip: WhisperTip): Promise<void>
  stop(): void
  setVolume(level: 0 | 0.25 | 0.5 | 0.75 | 1): void
}
```

**New: `app/api/whisper/route.ts`**
```typescript
// POST { text, voiceId?, speed? }
// → streams ElevenLabs TTS audio back
// → uses a dedicated low-latency ElevenLabs voice model
// → streams as audio/mpeg for Web Audio API
```

**Modified: `lib/transcript-handler.ts`**
- After each debounced analysis, build a `WhisperTip` if conditions are met
- Publish via SSE with `type: 'whisper'` event

**Modified: `components/` (new WhisperControls)**
- Volume slider: Off / Quiet / Normal
- "Skip" button: dismisses current tip
- Indicator: soft glow when coach is speaking

### Phase 2: Voice Selection

A dedicated "coach voice" — different from the customer-facing ElevenLabs agent voice. Recommended characteristics:
- Gender-neutral
- Calm, slightly lower pitch
- Speaking rate 1.1× (slightly faster than normal)
- No breathing artifacts

ElevenLabs voice design: configure via Voice Lab, export as custom voice ID. Store in env:
```env
ELEVENLABS_COACH_VOICE_ID=voice_...
```

### Phase 3: Personalization

After 10+ calls, the QA scorecard reveals each agent's consistent weak criteria. Whisper Coach adapts:

- Agent consistently scores low on **empathy** → more empathy prompts
- Agent consistently scores low on **compliance** → more compliance reminders
- Agent consistently scores low on **call duration** → more wrap-up nudges

The personalization model reads from `qa_scores` aggregate per agent. No LLM needed — pure analytics.

### Phase 4: Agent-Controlled Modes

Agents can set their preferred mode at the start of a shift:

| Mode | What fires |
|---|---|
| **Silent** | Nothing (text-only screen) |
| **Escalation only** | Only speaks on escalation signals |
| **Standard** | All tips (default) |
| **Training** | All tips + extra coaching context (for new agents) |

Stored in browser localStorage per agent ID.

---

## Privacy & Ethics

**The customer never hears the coach.**

The Whisper Coach uses a separate `AudioContext` from the WebRTC call audio. The TTS stream is routed to the agent's local audio output — it is never mixed into the outbound audio stream sent to the customer.

**Agents know they're being coached.**

This is not covert behavioral modification. Agents opt into the mode, can see when it's active (visual indicator), and can silence it at any time. The feature requires explicit agent consent during onboarding.

**Tips are advisory, not prescriptive.**

The agent is always in control. The coach whispers a suggestion; the agent decides what to do. No tip ever says "you must" — only "try" or "consider."

---

## Why ElevenLabs Is the Right Company to Build This

CallPilot was built for the ElevenLabs hackathon, but the Whisper Coach is the feature that fully realizes ElevenLabs' potential here.

ElevenLabs' core product is voice — not just text-to-speech, but *believable, real-time, low-latency voice synthesis*. Most integrations use it to make bots talk to customers. This uses it to make an AI talk *to the agent* — a completely different and arguably more powerful use case.

The call center industry processes ~100 billion minutes of voice calls per year. Even if Whisper Coach reduces average handle time by 10%, that is 10 billion minutes returned to agents and customers.

This is not a features-list item. It is the product.

---

## What Would Need to Change to Build This

| Change | Complexity | Notes |
|---|---|---|
| `app/api/whisper/route.ts` | Low | Thin proxy to ElevenLabs TTS streaming endpoint |
| `lib/whisper-coach.ts` | Medium | Web Audio API, deduplication, interrupt logic |
| `components/WhisperControls.tsx` | Low | Volume control + skip button |
| `lib/transcript-handler.ts` | Low | Add whisper tip generation alongside existing SSE events |
| ElevenLabs coach voice | Low | Create in Voice Lab, copy voice ID to env |
| Integration testing | Medium | Multi-track audio in browser is tricky to unit test |

Total estimate: **3–5 days** for a working prototype, another 3 days for polish and agent preferences.

---

## Before You Build

1. **Verify browser audio routing.** `Web Audio API` separates audio contexts by default but test that the agent's headset receives both channels correctly on Windows, Mac, and Chrome OS (common agent environments).

2. **Measure perceived latency.** The coach tip should fire within 1.5 seconds of the trigger event. ElevenLabs streaming TTS can achieve sub-500ms TTFB — but the network hop from browser → API → ElevenLabs → back matters. Test with real headset hardware.

3. **Talk to one agent first.** The tip text in this document is a guess. Real agents will tell you what they actually want to hear. Run 3 shadowed calls with test users before finalizing the script library.

---

← [Architecture](ARCHITECTURE.md) | [Back to README](../README.md)
