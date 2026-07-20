# Alongside — Product Requirements Document

*A calm task companion for women with ADHD.*
Status: Draft v0.2 · Owner: Ashana

---

## 1. Summary

Alongside helps women with ADHD start and finish everyday tasks without the shame spiral that most productivity tools trigger. The user names one thing that's weighing on her; the app breaks it into tiny concrete steps, reveals them one at a time, and a gentle animated companion keeps her company while she works — celebrating each small win and checking in softly if she goes quiet. There are deliberately no streaks, no punishments, and no numbers-based countdowns.

The guiding belief: this user usually has an **execution** problem, not a **motivation** problem — and every design decision is made to lower the effort of starting while protecting her from feeling like she's failing.

---

## 2. Problem

ADHD is substantially underdiagnosed in women. Girls and women more often present with inattentive rather than hyperactive symptoms, are socialized toward compliance, and mask their struggles — so instead of being flagged for a condition, they internalize the difficulty as a personal failing. Late-diagnosed women commonly report guilt, shame, low self-esteem, and self-criticism.

**Consequence for product design:** the target user has likely been failed by every to-do app and habit tracker that made her feel behind. Any mechanic that implies failure — a broken streak, a red overdue badge, a punishing timer — re-opens the wound the app exists to heal.

---

## 3. Goals & non-goals

**Goals**
- Reduce the activation energy required to *start* a task.
- Keep the user company through completion (body-doubling effect).
- Make progress feel safe and encouraging, never pressuring.
- Support multiple in-flight tasks *without* overwhelming the user with them.
- Be usable in seconds, with minimal cognitive load on screen at any moment.

**Non-goals (for v1)**
- Not a medical device, diagnostic tool, or treatment. No clinical claims.
- Not a full project manager, calendar, or team tool.
- Not a habit-streak / gamified-competition app.
- No accounts, no cloud sync, no social features.

---

## 4. Target users

**Primary:** Adult women who suspect or know they have ADHD, are prone to self-criticism, and stall on ordinary tasks (packing, chores, admin, dreaded emails). Often previously bounced off mainstream productivity apps.

**Secondary (future):** Anyone with executive-function challenges (adjacent neurodivergence, burnout, post-illness recovery) who benefits from gentle, low-pressure task support.

---

## 5. Design principles

1. **Never imply failure.** No streaks, no zero-resets, no overdue shaming. Missing is treated gently by design.
2. **The app carries the executive load.** Planning, sequencing, and sizing happen in the app, not in the user's head.
3. **One thing at a time.** Only the current step is prominent; scope on screen stays small.
4. **Presence, not surveillance.** The companion accompanies; it doesn't monitor or nag.
5. **Calm sensory design.** Low-saturation lilac palette, soft motion, respect for reduced-motion preferences.
6. **Immediate, reliable rewards — that don't escalate.** Small consistent wins age better than inflating ones.
7. **Backlog is out of sight by default.** Future/parked tasks stay tucked away; only what's active is visible.

---

## 6. Features — v1 scope

### 6.1 Task creation and breakdown
- User names a task in a single input.
- App generates **3–8 tiny, concrete first actions** via LLM (on-device model preferred; fallback to Claude via backend proxy).
- First step is a near-trivial 2-minute starter.
- More than 4 steps auto-chunk into phases ("phase 1 of 2"); never more than 4 dots at once.
- **User can edit, skip, accept, or split** any generated step.
- Optional **"by when"** date on any task (no red overdue state — see §6.6).

### 6.2 Multi-task model — "Focus + Parking Lot"
- **One task is in Focus** at a time — the companion accompanies it, animations run, check-ins fire.
- Other in-progress tasks sit in a soft **Parking Lot** with their progress preserved.
- **Any parked task can be made active** with a tap; the previously-focused task moves to the lot.
- **Soft cap: 4 active tasks** (Focus + Parking Lot combined). Beyond 4, a gentle message suggests finishing or letting one go — never blocks.
- **Backlog** (§6.3) is separate from the active-task cap.

### 6.3 Backlog (future-dated tasks)
- Users can add tasks scheduled for a **future date** — these live in a Backlog section, **hidden from the main screen by default**.
- Backlog does not count against the 4-active cap.
- On the day a backlog task becomes current, it does *not* auto-promote to Focus; instead a quiet indicator appears ("something for today, when you're ready").
- Rationale: ADHD users often feel overwhelmed by seeing every future obligation at once. Out-of-sight-until-ready protects the calm home screen.

### 6.4 Focus mode (single-task experience)
- **Progressive one-step reveal:** only the current step is large; completed steps collapse into dots.
- **Visual time-disk (5 min default):** a lilac wedge slowly depletes — no digital countdown, no alarm. Length configurable in future.
- **Overall progress bar** spans phases ("2 of 8 done").
- **"Too Heavy? Split It"** button breaks the current step into 2–3 tinier actions on demand.
- **Optional dopamine pairing row** (music, tea, snack…) with **None** as the default.
- **Quiet "← Back to tasks"** returns to the home screen without losing progress.

### 6.5 Companion & celebration (unchanged from prototype — this is core)
- Original animated figure: breathes when idle, works alongside when active, tilts gently to check in when quiet.
- **On every sub-step completion:** companion **raises arms, smiles, and a confetti burst plays.** This is a v1 must-keep.
- **On full task completion:** a larger confetti burst.
- All motion respects `prefers-reduced-motion` (celebration falls back to a still smiling frame + soft haptic).

### 6.6 Gentle nudges (never shame)
- **Mid-task idle check-in:** if the user has started a task, completed ≥1 sub-step, then goes idle **10 minutes** with Focus still open, the companion softly nudges: *"still here whenever you're ready — want to pick this back up?"* Options: **I'm here** / **Mark complete** / **Save for later**.
- Copy is intentionally softer than a typical reminder — no counting, no "you left this."
- **No overdue state** for by-when dates. If a date passes, the task's chip reads *"whenever you're ready"* in the same tone. No red, no bold, no badge count.

### 6.7 Recurring tasks (laundry, meds, morning routine)
Recurring is in v1 as a **separate section** ("Rhythms"). Because the standard streak/chain pattern is directly harmful to this audience, Rhythms is built on evidence-supported ADHD-friendly motivators:

- **No streaks, no chains, no counts of consecutive days.** Missing a day never resets or shrinks anything visible.
- **"Never miss twice" framing.** After one miss, the app gently emphasizes today's opportunity — never yesterday's gap.
- **Implementation intentions** (Gollwitzer — one of the most-replicated behavior findings): each rhythm is anchored to a cue, not a clock. *"After my morning coffee, take meds."* The user picks the cue.
- **Habit stacking** onto existing routines rather than inventing new time slots.
- **Body-doubling on rhythms too:** tapping a rhythm opens the same Focus mode with the companion — presence is the motivator, not compliance.
- **Same-size rewards each time.** Celebration animation is identical whether it's day 2 or day 200. Escalating rewards cause hedonic adaptation and drift into pressure.
- **Optional "how did that feel?" one-tap signal** after a rhythm (easy / okay / hard). Used for self-insight over time, never scorekeeping.
- Rhythms live in their own section so the main task list stays about *today's chosen work*.

### 6.8 "Let it go" archive
- Compassionate alternative to Delete. Copy: *"let this one go for now — you can bring it back anytime."*
- Archived tasks are recoverable, out of sight, and never surfaced as a metric of "abandoned things."

### 6.9 Quiet hours
- **Default: 10 pm – 8 am**, configurable.
- No check-in notifications during quiet hours; the app itself still works.

### 6.10 Offline behavior
- If there's no network when the user names a new task and on-device AI is unavailable, the app shows a soft: *"let's try again in a moment"* with a Retry action. It does not fall back to a template list or freeform, in v1.
- All *existing* task data is local and fully usable offline.

---

## 7. UX & visual design

- **Palette:** muted lilac hero (`#9B87C4` / deep `#7D6BA8`) on a soft cool paper; warm apricot reserved only for celebration accents. No alarm reds anywhere.
- **Type:** Fraunces (warm serif) for human moments; DM Sans for body.
- **Layout:** single phone-width column, one focal card, generous whitespace.
- **Home screen:** the Focus card is prominent; Parking Lot is a small row of 0–3 pill cards beneath; Rhythms and Backlog are quiet section links further down.
- **Motion:** soft ambient animation, disabled under `prefers-reduced-motion`. Celebration animation (arms up, smile, confetti) is preserved as a still + haptic when motion is reduced.

---

## 8. Technical architecture

**Client**
- **React Native + Expo (TypeScript)**, iOS and Android, tested via **Expo Go**.
- Companion rendered via **Lottie** (with a static SVG fallback for reduced-motion).
- **expo-notifications** for the idle check-in (scheduled locally on step start, cancelled on completion or task switch).
- **expo-haptics** for confetti/completion.
- State: local component state + a small store (Zustand or Redux Toolkit — TBD).

**Storage (v1: local-only)**
- **expo-sqlite** for tasks, steps, rhythms, archive.
- **expo-secure-store** for the (small) app settings and any future API keys.
- No user account, no server storage of task content.
- Future: opt-in iCloud (iOS) / Google Drive AppData (Android) end-to-end encrypted sync — out of scope for v1.

**AI task breakdown**
- **Prefer on-device** when available: Apple Intelligence Foundation Models (iOS 18+) / Gemini Nano (Android) — checked at runtime.
- **Fallback:** Claude via a **Cloudflare Workers** proxy that holds the API key. The key never ships in the app.
- **Migration path:** proxy is thin and swappable — planned move to AWS Lambda + API Gateway once volume/cost justifies. Same request contract on both sides.
- **Prompt contract:** the proxy accepts `{ taskTitle, contextHints?, targetStepCount }` and returns `{ steps: string[] }`. Task text is not logged or persisted server-side.

**Notifications**
- Only two v1 notification types: (a) idle check-in for the currently-focused task, (b) optional gentle "by-when" reminder on the morning of the date. Both respect quiet hours.

**Distribution**
- **Testing:** Expo Go on real devices (iOS + Android) — supports all v1 features.
- **Release:** EAS Build → TestFlight (iOS) and Play internal testing → App Store + Play Store.
- **Repo:** extend **`ashana46/alongside`** as a monorepo (`/app` for Expo, `/worker` for the Cloudflare proxy).

---

## 9. Operational logging (not behavioral analytics)

v1 does **not** collect behavioral analytics or store task content. It does collect **operational** signals so we know the app works:

- Client-side structured logs (with a switch to enable/disable):
  - `task.create.start / success / fail`
  - `steps.generate.attempt / success / fail` (with source: `on-device` | `proxy`)
  - `proxy.request.latency_ms / status_code`
  - `notification.scheduled / delivered / cancelled`
  - `celebration.played` (motion vs. reduced-motion fallback)
- **No task titles, no step contents, no user identifiers** leave the device.
- Errors and latency counters flush to Cloudflare Workers' own logs (proxy side) and to a local ring buffer viewable in a hidden Settings → "Diagnostics" panel (client side).

---

## 10. Data model (v1 sketch)

```
Task { id, title, status: active|parked|archived|done, focusedAt?, byWhen?, createdAt }
Step { id, taskId, order, text, source: ai|user, status: pending|done|skipped }
Rhythm { id, title, cue, lastDoneAt?, createdAt }  // no streak count
RhythmEvent { id, rhythmId, doneAt, feltLike?: easy|okay|hard }
Settings { quietHoursStart, quietHoursEnd, reducedMotion, defaultDiskMinutes }
```

Only one Task has `status = active AND focused = true` at a time; up to 4 total have `status ∈ {active}`. Backlog = active with `byWhen > today`, hidden from main view until the day.

---

## 11. Research foundation

- **Underdiagnosis, masking, self-criticism in women** — *Scientific Reports* (Nature), 2025; clinical overviews (Cleveland Clinic, Henry Ford Health); ADDitude practitioner writing.
- **Execution-vs-motivation reframe reduces shame** — CBT-for-ADHD clinical practice.
- **Task-shrinking / micro-goals and focus duration** — *Cognitive Therapy and Research*, 2021.
- **Immediate-reward sensitivity** — ADHD + gamification literature.
- **Streaks demotivate after a break** — *Journal of Consumer Research*, 2023 — informs "no streaks" rule.
- **Implementation intentions** — Gollwitzer et al., meta-analysed across hundreds of studies; large effect on translating intention to action, particularly useful for executive-function difficulties — informs Rhythms cue-anchoring.
- **Habit stacking** — behavior-design practice (Fogg; Clear).
- **Body-doubling / virtual coworking** — mixed but supportive evidence; treated as one aid among several.

*Citations to be re-verified before any public/marketing use.*

---

## 12. Success metrics (proposed, privacy-preserving)

Because v1 stores nothing about task content and has no accounts, success is measured on-device with an opt-in aggregate report:

- **Activation:** % of created tasks where the user starts ≥1 step.
- **Completion:** % of started tasks fully completed.
- **Return without guilt:** app opened again ≥ 3 days after a gap without a completion — the health signal is *coming back*, not consistency.
- **Guardrail:** self-reported "did this feel supportive vs. stressful?" one-tap signal ≥ 80% supportive.

---

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Gamification drifts into pressure | Same-size rewards; no counts, chains, or leaderboards; explicit review each release. |
| Multi-task UI reintroduces overwhelm | Hard rule: only Focus card is prominent; Parking Lot ≤ 3 pills; Backlog collapsed by default; soft cap 4. |
| Rhythms section becomes a habit tracker in disguise | No streak counts, no chains, no "you missed" copy anywhere — enforced in copy review. |
| App Store rejection over health claims | Positioned as productivity companion; clear privacy + AI disclosures; no diagnostic language. |
| Sensitive task content leaks | Local-only storage; proxy never logs or persists task text; on-device model preferred. |
| Body-doubling effect is mixed in evidence | One supportive element among several; don't over-promise. |
| Companion feels like surveillance | Copy emphasizes presence and choice; check-ins dismissible; no read-receipts, no "you've been idle for X". |
| On-device AI unavailable on older devices | Cloudflare proxy fallback; offline shows soft retry. |

---

## 14. Future scope (post-v1)

- Opt-in iCloud / encrypted cross-device sync.
- Configurable time-disk length; adaptive step-sizing that learns preferred granularity.
- Companion personalization (appearance, voice/no-voice, motion intensity).
- Live body-doubling sessions with the companion, or (opt-in) with real people.
- Calendar integration and a home-screen widget showing the one next step.
- Localization; broader executive-function audience.
- Insight (never judgment): optional reflections on what pairings/times help most.
- Apple Health / mood context (opt-in) to adapt to energy levels.
- Cheaper LLM backend (self-hosted small model, or aggressive on-device push).
- Clinician-informed content (still non-diagnostic).
- Data export & full ownership.
- Monetization that doesn't exploit shame (calm premium features).

---

## 15. Open questions

- Should the "how did that feel?" signal appear after regular tasks too, or only Rhythms?
- Whether real-human body-doubling belongs in scope, or dilutes the judgment-free advantage.
- Default time-disk length by task type (a "make a call" vs. "clean the kitchen" probably want different defaults).
- Right long-term monetization consistent with the anti-shame ethos.

---

## 16. Delivery plan

1. **Repo scaffold** on `claude/alongside-prd-adhd-app-2ntfhz` — Expo app + Cloudflare Workers proxy in a monorepo.
2. **Single-task Focus mode** ported to Expo (matches prototype visually).
3. **Local persistence** (SQLite) — one task can be created, its steps stored, celebration + confetti verified on device via Expo Go.
4. **Multi-task home** — Focus + Parking Lot + soft cap.
5. **Backlog + optional by-when.**
6. **Rhythms section** with cue anchoring and no-streaks copy.
7. **Idle check-in** local notification + quiet hours.
8. **Cloudflare Workers proxy** + on-device model detection.
9. **Operational logging + Diagnostics panel.**
10. **EAS Build → TestFlight + Play internal testing.**

---

*Alongside is an early prototype. It is not medical advice, a diagnosis, or a treatment for ADHD.*
