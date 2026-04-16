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
- **Stage 1 (discovery):** ✅ Complete — 3 interviews (Fakiya, Daiana, Nataliia). Focus: validate problem, current decision process, mental model of flatmate search.
- **Stage 2 (usability):** ✅ Complete — 3 interviews (Serge, Patryk, Daiana). Focus: live usability walkthrough of MVP 1; identify comprehension gaps and workflow blockers.
- **Stage 3 (retention/trust):** Planned after MVP 2 ships.

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

## Stage 2 key findings (feeds MVP 2 scope)

Synthesised from usability sessions with Serge and Patryk on the live MVP 1 demo:

**Bugs hurting credibility (quick fixes):**
- Currency displays as £ instead of $ — confusing and looks broken.
- Text on match/profile cards has low contrast — hard to read.
- No way to navigate from a match or message thread back to that person's full profile.
- Message input bar drifts up instead of staying fixed at the bottom of the chat window.
- Chat thread has no scroll — earlier messages are unreachable.
- New messages only appear after a full page refresh — no polling or refresh button.
- No unread-message indicator on the matches list.
- Email validation is not enforced on signup — fake/garbage emails are accepted.

**Feature gaps users hit during the walkthrough:**
- The `housing_status` field only covers people who already have a place; Serge and Patryk both noted that looking for a place *and* a flatmate at the same time is very common and the app doesn't represent it.
- "City" is too coarse — users want to match by neighbourhood/area.
- Gender is absent from profile cards; users said it's one of their top non-negotiables.
- No filters anywhere in the discovery feed — described as a dealbreaker for continued use.

**Design & tone:**
- Dark colour scheme reads as a dating app. Both users said the visual style should feel more "domestic" or "homey."
- Onboarding bio field has no prompts — users didn't know what to write and left it blank.

---

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

### MVP 2 “must-fix” candidates — added from Stage 2 interviews

6. **”Looking for a place + flatmate” housing status**
   - Add `LOOKING_WITH_FLATMATE` as a third `housing_status` enum value (migration already in `db/migrations/20260411_add_profile_fields.sql`).
   - Surface the value on profile cards so users can self-filter.

7. **Neighbourhood / area field**
   - Replace or augment the coarse `city` field with a `neighbourhood` text field on the profile.
   - Migration adds the column; onboarding and card display need updating.

8. **Gender field on profile and card**
   - Gender was the #1 missing field cited by users.
   - Migration adds `gender_identity` enum and `gender` column; ensure it is visible on discovery cards.

9. **Messaging UX — critical fixes**
   - Fix message input bar to stay pinned to the bottom of the viewport.
   - Fix chat scroll so earlier messages are reachable.
   - Add an in-UI refresh button or lightweight polling so new messages appear without a full page reload.
   - Add unread-message badge on the matches list.

10. **Display and credibility bugs**
    - Change currency symbol from £ to $ globally.
    - Increase text contrast on profile and match cards.
    - Add a link from a match’s name/avatar in Matches and Chat back to their full profile view.

11. **Email verification on signup**
    - Enforce basic email format validation; consider a confirmation email before the account is active.

### MVP 2 “should do” candidates (validated by interviews, lower urgency)

12. **Discovery filters**
    - Most-requested feature across all users; absence described as a dealbreaker for retention.
    - Minimum viable filter set: budget range, move-in date, neighbourhood, smoking, pets.
    - Implement only after must-fix items 1–11 are stable.

13. **Bio prompts on onboarding**
    - Users left the bio blank without guidance.
    - Add 2–3 example prompts inline (e.g. “What does your typical morning look like?”, “Describe your ideal living situation”).

14. **Basic trust indicators**
    - At minimum: enforce email verification (covered in item 11).
    - Optional: display a “verified email” badge on cards.
    - Social media linking (LinkedIn/Instagram) is a Stage 3 decision.

15. **Design tone adjustment**
    - Dark palette reads as a dating app; both Stage 2 users flagged it.
    - Adopt a lighter, more domestic colour scheme before any external user testing.

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

## Deferred to V3

These items came up in interviews but are out of scope until MVP 2 is validated:

- **Social media profile linking** (LinkedIn / Instagram) — trust signal, but adds OAuth complexity.
- **Mutual friends indicator** — requires social graph data not currently collected.
- **In-app call scheduling** — came up in one Stage 1 interview; not validated as a broad need.
- **AI-based identity or credit verification** — technically ambitious; longer-term trust feature.
- **Prior eviction / reference history** — valuable but out of scope for a consumer app at this stage.
- **Strict vs. flexible preference weighting** — interesting UX concept; worth revisiting after filters ship.
- **Password reset flow** — came up during testing, not from interviews; needed before public launch but not blocking MVP 2 usability goals.

---

## What to implement after MVP 2 decisions (next doc updates)

- Update `docs/MVP_1.md` only when MVP 2 permanently changes what we consider “MVP 1 baseline.”
- Update `docs/user-flow-backend.md` as endpoints/logic solidify.
- Write interview synthesis summaries into `LBA/stage-X/` and link them back to MVP 2 decisions.