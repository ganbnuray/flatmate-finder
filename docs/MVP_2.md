# Flatmate Finder — MVP 2 Plan 

## Current state

- **MVP 1 spec:** `docs/MVP.md` (and meeting notes in `docs/PRD.md`):
  - Auth (email/password)
  - Profile create/edit (including `housing_status`)
  - Discovery (browse candidates)
  - Like/Pass + mutual match
  - Matches list
  - 1:1 messaging (text-only)
  - Minimal block/report (defined for future enforcement)
- **Backend implementation work (partial):**
  - PR #4 added **like/pass endpoints** and creates a match on mutual like (currently with placeholder auth in the route layer).
  - Backend direction is documented in `docs/user-flow-backend.md` (step-by-step flow mapped to tables/operations).
- **Frontend implementation work (partial):**
  - PR #5 added a **demoable React frontend** with simulated API behavior to support an end-to-end walkthrough before the Flask backend is fully connected.
- **Database schema exists:**
  - `db/schema.sql` defines enums + tables for: `users`, `profiles`, `likes`, `matches`, `messages`, `blocks`, `reports`, plus indexes and a `profiles.updated_at` trigger.
  - Blocking relationships exist in the schema (`blocks`), but **enforcement is logic**, not automatic at the DB level.
- **Interview learnings repository:**
  - Folder `LBA/` exists for interview documentation and synthesis after each stage.

## MVP 1 must-haves 

MVP 1 is the baseline user journey:

1. Sign up / Log in
2. Create profile (validated, stored)
3. Discover candidates (exclude self + already swiped + optionally gated by completeness)
4. Like/Pass
5. Mutual like -> Match
6. Matches list
7. Chat: open match, view thread, send message

## What we are keeping going into MVP 2

### 2.1 Housing split (“open to work” style)

- We treat the user’s temporary housing situation as a **profile field**: `housing_status`.
- MVP 1 stores and displays it; any filtering/matching logic based on it is an MVP 2 decision after interview feedback.

### 2.2 Matching approach

- Matching is rule-based:
  - Users like/pass candidate profiles.
  - **Mutual like creates one match record**.
- Canonical storage rule (schema): in `matches`, we enforce `user_a_id < user_b_id` to avoid duplicate rows.

## Interview plan (feeds MVP 2)

### Stages and volume

- Plan: **10–12 interviews per stage**, **3 stages total**.

### Do we reuse the same questions?

- Yes, with a shared “core question set” across all stages for comparability.
- Stage-specific questions focus on what changes at each point in the product lifecycle:
  - Stage 1 (before coding): validate problem + current decision process + initial mental model of the flow.
  - Stage 2 (after MVP 1): validate comprehension/UX of the actual workflow; identify breakpoints and adoption blockers.
  - Stage 3 (later): validate trust/safety, retention, and prioritization of improvements.

### Data organization

Store all interview artifacts in `LBA/`:
- Prefer one file per interview (raw notes) plus one synthesis file per stage.
- Tagging/summaries should map to themes like: onboarding friction, decision criteria, trust/safety, messaging expectations, matching mental model, housing_status usefulness.

## MVP 2 objective:

MVP 2 should reduce the biggest **adoption blockers and correctness risks** discovered from:
- Stage 1/Stage 2 user feedback
- Technical gaps surfaced during integration between frontend demo and backend
- Edge cases implied by the schema constraints/enums

Customary rule for iteration planning:
- Freeze a small number of improvements into **1–2 end-to-end “learning vertical slices”**.
- Add features only if they meaningfully change user comprehension/trust or fix a validated break in the workflow.

## Candidate scope for MVP 2 

### MVP 2 “must-fix” candidates (strongly recommended)

1. **Connect frontend to real backend**
   - Remove or disable the dummy-mode behavior.
   - Ensure request/response shapes and routes match the backend contract.
   - Verify the full route flow: onboarding -> discovery -> like/pass -> match -> messages.

2. **Auth integration correctness**
   - Replace any placeholder auth (e.g. hardcoded user id in backend routes) with real session/auth behavior.
   - Ensure protected pages truly require authentication and reflect auth state correctly.

3. **Like/Pass + match robustness**
   - Make mutual-like idempotent and safe against duplicate inserts (race conditions).
   - Validate IDs (e.g. UUID validity) and return consistent error formats.
   - Keep match creation consistent with schema constraints (canonical ordering + unique pair enforcement).

4. **Messaging access control + identity**
   - Remove UI hardcoding of the “current user id” (for threads/bubbles).
   - Enforce server-side: only match participants can read/send messages.
   - Ensure correct ordering and duplication handling (client and server).

5. **Enforce `is_complete` and blocking consistently**
   - Discovery should respect `profiles.is_complete` gating.
   - Blocking relationships (`blocks`) must be enforced in:
     - discovery candidates
     - matches list visibility
     - (if implemented) messaging access rules

### MVP 2 “optional” candidates (only if interviews validate them)

6. **housing_status impact**
   - Add filters and/or prioritization if users say it’s a primary decision driver.
   - Otherwise keep it informational to avoid scope creep.

7. **Basic safety UX**
   - If interviews show concerns, implement a minimal block/report UI loop.
   - Reporting can remain “no admin UI”, but user submission flow must be clear.

## MVP 2 acceptance criteria (how we will verify)

For each MVP 2 selected vertical slice, require:

1. **End-to-end demo works without dummy mode**
   - Real backend is hit for auth, profile, browse, like/pass, match, messages.
2. **Correctness under constraints**
   - No duplicate matches for the same pair.
   - Users cannot message non-matches.
3. **User comprehension**
   - Stage 2 users can explain what happens after Like/Pass and when messaging becomes available.
4. **Error handling is user-visible but developer-debuggable**
   - Consistent error responses; no silent failures.

## What to implement after MVP 2 decisions (next doc updates)

- Update `docs/MVP.md` only when MVP 2 permanently changes what we consider “MVP.”
- Update `docs/user-flow-backend.md` as endpoints/logic solidify.
- Write interview synthesis summaries into `LBA/stage-X/` and link them back to MVP 2 decisions.