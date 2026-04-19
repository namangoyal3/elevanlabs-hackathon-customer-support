# Screenshot Capture Guide

This folder holds all screenshots used in the main README. Follow the steps below for each screen — the order matches how they appear in the README.

---

## Before You Start

```bash
npm run dev
```

Server must be running at `http://localhost:3000`.

**Recommended setup:**
- Browser: Chrome or Arc (best rendering of the Tailwind dark theme)
- Window width: **1440px or wider** — the dashboard uses a multi-column layout that collapses below 1280px
- Zoom: **100%** (default) — never zoom out for screenshots
- OS: Hide the dock/taskbar for clean captures
- Tool: macOS → `Cmd+Shift+4` or `Cmd+Shift+5` · Windows → Snipping Tool or `Win+Shift+S`

**File naming:** Save each file with the exact filename listed below. The README references these paths directly.

---

## Screenshot 1 — Landing Page

**Save as:** `docs/images/01-landing-page.png`

**What it shows:** The product hero — headline, tagline, animated mockup preview of the dashboard, and the "Open Agent Dashboard" CTA button.

**How to get there:**
1. Open `http://localhost:3000`
2. Wait for the page to fully load (the mockup preview has an entrance animation — wait ~1 second for it to settle)
3. Capture the full viewport — make sure the headline and "Open Agent Dashboard" button are both visible

**What makes a great shot:**
- Full width viewport showing the centered hero layout
- The animated dashboard mockup card visible on the right/center
- The headline "CallPilot" and tagline readable
- Dark background (`#0b0c0f`) fills the frame — no white browser chrome showing

---

## Screenshot 2 — Persona Picker

**Save as:** `docs/images/02-persona-picker.png`

**What it shows:** The agent's starting point — three NovaPay customer cards showing name, account tier (Standard / Premium / Enterprise), VIP badge if applicable, open ticket count, and a hook line about why they're calling.

**How to get there:**
1. Open `http://localhost:3000/agent`
2. The Persona Picker is the first thing shown — no interaction needed
3. Capture the full page showing all 3 customer cards

**What makes a great shot:**
- All 3 cards fully visible: Priya Sharma (Standard), Rohan Mehta (Premium), Kavitha Nair (Enterprise)
- The Enterprise card should show its green accent treatment
- The VIP badge (if any card has one) should be visible
- The "Select a customer to begin" heading visible at the top

---

## Screenshot 3 — Pre-Call Dashboard

**Save as:** `docs/images/03-pre-call-dashboard.png`

**What it shows:** After selecting a customer — the agent sees the full caller brief (avatar, tier, open tickets, call history) and KB articles pre-loaded *before* the call starts. The agent begins every call already informed.

**How to get there:**
1. Open `http://localhost:3000/agent`
2. Click **Kavitha Nair** (the Enterprise customer — she has the richest profile and the VIP badge)
3. The dashboard transitions to the pre-call view with:
   - Left: Caller brief panel (name, phone, account ID, tier badge, tickets, call history)
   - Right: Pre-loaded KB cards (articles predicted based on her known intent)
   - Bottom: "Start Call" button
4. Capture once everything has loaded — no loading spinners visible

**What makes a great shot:**
- Caller brief panel fully visible on the left
- At least 2 KB cards visible on the right
- The "Enterprise" tier badge with its distinct styling
- "Start Call" button visible at the bottom
- No loading states — everything settled

---

## Screenshot 4 — Active Call Dashboard (The Hero Shot)

**Save as:** `docs/images/04-active-call.png`

**What it shows:** The full co-pilot dashboard during a live call — the most important screenshot. Live transcript updating, intent badge classified, KB articles surfaced, sentiment bar tracking, and suggested replies ready. This is the product in action.

**How to get there (Demo Mode — no API keys needed):**
1. Open `http://localhost:3000/agent?demo=1`
2. The Persona Picker appears — click **Priya Sharma** (Standard tier, failed_transaction scenario — this has the most active demo)
3. Click **Start Demo** (or "Start Call" — in demo mode it auto-plays)
4. Wait ~15–20 seconds for the transcript to build up and intent to classify
5. Capture when you see:
   - Several transcript lines visible (both Agent and Customer turns)
   - Intent badge showing `failed_transaction` (or another non-unknown intent)
   - KB cards surfaced (2 articles visible)
   - Sentiment bar somewhere in the mid-to-neutral range
   - At least 2 Suggested Reply chips visible

**What makes a great shot:**
- The full 3-column layout visible: [Caller Brief] [Transcript + Sentiment] [Intent + KB + Replies]
- Active call timer running in the header (e.g. `02:14`)
- Intent badge colored and labeled (not "Detecting...")
- Transcript has 4+ lines of conversation showing real dialogue
- Sentiment bar has the marker dot somewhere visible (not at the far ends)
- **This is the hero screenshot** — take multiple and pick the one with the most content visible

**Pro tip:** Widen your browser to 1600px+ for this shot — the layout shows more at wider widths.

---

## Screenshot 5 — Escalation Alert

**Save as:** `docs/images/05-escalation-alert.png`

**What it shows:** The real-time escalation detection — a red dismissible alert banner fires when the customer's sentiment drops critically low. This demonstrates the proactive risk detection capability.

**How to get there:**
1. Open `http://localhost:3000/agent?demo=1`
2. Click any persona → Start Demo
3. **Wait for the escalation moment** — the demo script includes a frustrated customer segment at approximately **30–45 seconds** into the call
4. Watch the sentiment bar — when it moves to the "Hostile" end (dark red zone), the alert banner fires
5. Capture immediately when the red banner appears at the top of the dashboard — **do not dismiss it**

**What makes a great shot:**
- The red "ESCALATION ALERT" banner prominently visible at the top
- Sentiment bar visible and showing the negative/hostile zone (bar marker far left, red coloring)
- Some transcript visible showing the escalation-triggering utterances
- The overall dashboard still visible behind the banner

**If you miss it:** Refresh the page and start the demo again — the demo script is deterministic and always hits the escalation moment at the same point.

---

## Screenshot 6 — Post-Call Summary & QA Scorecard

**Save as:** `docs/images/06-post-call-summary.png`

**What it shows:** The automated post-call intelligence — AI-generated summary, disposition classification, follow-up action items, CSAT prediction score, and the full 8-criterion QA scorecard. Zero agent input required.

**How to get there:**

**Option A — With real ElevenLabs webhook (real call):**
1. Complete a real call through the agent dashboard
2. ElevenLabs sends the post-call webhook automatically
3. The PostCallSummary panel slides in automatically after ~8–12 seconds

**Option B — Demo mode (no API keys):**
1. Open `http://localhost:3000/agent?demo=1`
2. Click any persona → Start Demo
3. Let the demo play for ~60 seconds (or let it finish naturally)
4. Click **End Call**
5. The post-call summary panel loads with pre-populated demo data within ~2–3 seconds

4. Capture when the full summary panel is visible and loading is complete (no skeleton/loading states)

**What makes a great shot:**
- The full PostCallSummary panel visible (may need to scroll down to show it all)
- Disposition badge visible (e.g. "Resolved" in green or "Escalated" in red)
- CSAT prediction score visible (e.g. "78%")
- The QA scorecard with multiple criteria and their scores visible
- Follow-up action items list visible
- **Consider a tall crop** — the post-call summary has vertical content, so capture at ~800px height minimum, or take two shots (summary top + QA scorecard bottom)

---

## After Capturing

1. Save all 6 files in this folder (`docs/images/`) with the exact filenames listed
2. Commit them:
   ```bash
   git add docs/images/
   git commit -m "docs: add product screenshots"
   ```
3. Push to GitHub — the README will automatically display them

---

## Quick Reference

| # | Filename | URL | Key interaction |
|---|---|---|---|
| 1 | `01-landing-page.png` | `localhost:3000` | None — just load |
| 2 | `02-persona-picker.png` | `localhost:3000/agent` | None — first screen |
| 3 | `03-pre-call-dashboard.png` | `localhost:3000/agent` | Click Kavitha Nair |
| 4 | `04-active-call.png` | `localhost:3000/agent?demo=1` | Click Priya → Start Demo → wait 20s |
| 5 | `05-escalation-alert.png` | `localhost:3000/agent?demo=1` | Same — wait for 30–45s mark |
| 6 | `06-post-call-summary.png` | `localhost:3000/agent?demo=1` | Click Priya → Start Demo → End Call |
