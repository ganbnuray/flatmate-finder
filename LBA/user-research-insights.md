# LBA 1 + LBA 2

**Participants:** 6 interviews across 2 rounds (Round 1: discovery/pain points, Round 2: usability testing on MVP)
**Profiles:** Mix of students and young professionals, ages 20–30, all actively looking for housing or recently went through the process.

---

## Quick Fixes - Need These Soon

Issues flagged by multiple users on the live MVP that are small but hurt credibility:

| Issue | Who flagged it | Suggested fix |
|---|---|---|
| Currency shows £ instead of $ | Serge, Patryk | Change to $ globally |
| Text on match cards is hard to read | Serge, Patryk | Increase contrast on profile card text |
| Can't navigate to a match's profile from Matches or Messages | Serge, Patryk | Link name/avatar to profile view |
| Message input bar drifts down instead of staying fixed | Patryk | Fix message bar to bottom of chat window |
| Can't scroll up in chat | Serge | Fix scrolling in message thread |
| Have to refresh whole page to see new messages | Serge | Add in-UI refresh button or auto-poll |
| No indicator for new/unread messages | Serge | Add unread badge on matches/messages |
| Email verification not enforced — fake emails work | Patryk | Add email verification on signup |

---

## High Priority Feature Gaps

These are missing features that users consistently expected to exist and that affect the core matching journey.

### 1. Filters
The single most-requested feature. Multiple users said the absence of filters is a dealbreaker or adoption stopper.
- Filter by budget range, gender, move-in date, neighborhood, smoking, pets
- Users want to be able to indicate how *strict* they are on a given filter (e.g., budget is firm, smoking is flexible)

### 2. "Looking for a place + flatmate" housing status
Right now the app only covers people who already have a place. Multiple users are in the position of needing both a place and a co-searcher. This is a very common use case that the current onboarding doesn't capture.
- Add a third housing status: **"Looking for a place and a flatmate together"**
- Surface this on cards so users can filter by it

### 3. Neighborhood / area specificity
"City" is too vague. Users want to know which part of the city.
- Add a neighborhood or area field to the profile
- Clarify whether "city" means where the user *is* or where they *want to live*

### 4. Profile fields users expected to see and didn't
Across both rounds, users kept asking for fields that aren't there:
- **Gender** (multiple users — Patryk flagged it's not shown on cards)
- **Move-in date / lease duration** (important for filtering compatibility)
- **Occupation** visible on card (helps assess lifestyle fit)
- **Where they're originally from** (Patryk — helps cultural/social compatibility)
- **Personality type** (Daiana — MBTI-style or just a short descriptor)

---

## Trust & Safety — V2 Priority

Users are willing to use the app but trust is a real barrier, especially for strangers. These features came up repeatedly:

- **Profile verification** — every user mentioned wanting to know the person is real. Even a simple email/ID check would help.
- **Social media linking** — LinkedIn or Instagram as optional profile additions (Fakiya, Daiana). Users use this to self-verify legitimacy.
- **Mutual friends feature** — if a match has mutual friends, users said it significantly increases trust (Fakiya).
- **Reason on unmatch** — users don't want to be ghosted; Fakiya specifically asked that unmatching require a reason.

---

## UX & Design Feedback

- The app **looks too much like a dating app** — dark color scheme feels off for a housing context (Serge, Patryk). Design should feel more domestic/homey.
- **Lack of animations** makes it feel flat and less engaging — swiping and match moments should have some feedback (Patryk).
- **Bio prompts** — users don't know what to write in a freeform bio. Example prompts ("What's your morning like?", "Describe your ideal living situation") would reduce friction on onboarding (Patryk).
- Consider an option to **share contacts instead of messaging in-app** — some users prefer moving to WhatsApp quickly rather than staying in-app (Patryk Round 1).

---

## Behavioral Insights

From Round 1 discovery interviews, these patterns came up consistently:

**How users currently find flatmates**
- Facebook groups, Craigslist, Zillow, university Discord/Slack channels
- The universal complaint: **too fragmented, posts lack structure**, you have to read every post to find basic compatibility info
- Serge screened 30–40 online replies and still chose word-of-mouth — the signal-to-noise ratio online is terrible

**What makes someone decide to commit:**
- Users are looking to reduce uncertainty to a manageable level
- Key insight from Serge: the app functions as an *ice breaker and access point* — the real vetting still happens in conversation and in person
- Daiana prefers living with people she already knows — she represents a segment that needs more trust infrastructure before they'd adopt

**Timing:**
- Almost all users said they start looking **2–3 months before** they need to move
- But in practice, Nataliia noted she'd intend to start a month ahead and end up finding someone 5 days before — urgency is real and the app should work for last-minute searches too

**Most-cited non-negotiables across all users:**
1. Cleanliness / tidiness
2. Sleep schedule / routine compatibility
3. Financial reliability
4. Gender and age group
5. Privacy / personal space

---

## What to Scope into V2

These are valid but not core to the MVP journey:

- Password reset (came up in testing, not from interviews)
- In-app call scheduling (Daiana — "maybe they can set up a quick call?")
- AI-based identity/credit verification (Serge — ambitious, longer term)
- Blacklist/prior eviction history check (Serge)
- Strict vs. flexible preference weighting (Patryk)
- "Looking for a place" vs "Looking for a flatmate" as a matchmaking axis (requires backend logic change)