# Flatmate Finder — MVP 1 Spec

- **Tech stack**:
  - **Frontend**: React 
  - **Backend**: Flask REST API.
  - **Database**: PostgreSQL (SQL, via SQLAlchemy).
  - **Auth**: email + password, **session-based** using secure cookies (most probably Flask-Login).
- **Hosting (later)**: simple single-region deployment with one Flask API and one React static build.
- **Chat**: basic text messaging; **polling or manual refresh is acceptable** for MVP 1.

## 2. Purpose 

Demonstrate that users can:

**sign up -> create a profile -> browse potential flatmates -> like/pass → get a match -> exchange basic messages.**

This is a **thin, working vertical slice** prioritizing correctness and clarity over feature breadth.

## 3. Scope (MVP 1)

### 3.1 Must-have's

- **Authentication**
  - Sign up with email + password.
  - Log in / log out with session cookies.
- **Profile**
  - Create and edit a simple profile with: name, age, city, budget range, **housing status** (has apartment / looking / either), short bio, 2–3 lifestyle fields (e.g. cleanliness, smoking, pets).
- **Browsing / Discovery**
  - See a scrollable list or simple “next profile” view of other users.
- **Swipe / Like / Pass**
  - Like or pass on a profile and persist that choice.
- **Match creation**
  - When two users like each other, a match record is created for both.
  - Basic “My matches” list.
- **Basic messaging**
  - Text-only conversation between matched users.
  - Messages stored in and retrievable from the database.

### 3.2 Nice-to-have's 

- Personality quiz.
- Verification (email, ID, social).
- Additional filters (smoking, pets, gender preference, etc.).
- Photo uploads.
- Map-based browsing.
- Reporting/blocking system.

### 3.3 Out-of-scope's 

- AI-based matching and complex recommendation algorithms.
- Video/voice calls.
- Payments, contracts, or room listing marketplace features.

## 4. User flow (MVP #1)

1. **Landing / Auth**
   - User sees a simple landing screen with options to **Sign up** or **Log in**.
2. **Sign up**
   - User enters email + password, account is created, and they are logged in.
3. **Create profile**
   - User fills in basic profile fields (including housing status) and saves.
4. **Browse candidates**
   - User views other users as cards or a list.
5. **Like / Pass**
   - User chooses like or pass on each profile.
6. **Match**
   - When there is a mutual like, both users see the other in a **Matches** list.
7. **Messaging**
   - User opens a match, sees the conversation, and can send simple text messages.

## 5. Functional requirements 

### FR1. Authentication

- Users can:
  - create an account with email + password,
  - log in and log out,
  - stay logged in via a secure session cookie.
- Auth-only pages (profile, browse, matches, messaging) are not reachable when logged out.

### FR2. Profiles

- Each user has exactly one profile.
- Profile fields:
  - name (string),
  - age (integer),
  - city (string),
  - budget_min, budget_max (numbers or integers),
  - **housing_status** (enum, e.g. `HAS_APARTMENT`, `LOOKING_FOR_APARTMENT`, `EITHER`),
  - short bio (string, limited length),
  - 2–3 lifestyle attributes (e.g. cleanliness level, smoking preference, pets).
- Users can:
  - create their profile immediately after sign-up,
  - edit these fields later (including housing status, like an “open to work” flag),
  - see their current profile data after refresh.

### FR3. Browsing / Discovery

- Authenticated users can see a list (or paginated feed) of other users’ profiles.
- The list:
  - excludes the logged-in user,
  - excludes users they have already liked or passed.
- Order can be simple (e.g. newest users first or random).

### FR4. Like / Pass and Match Logic

- For each candidate profile, a logged-in user can:
  - **Like** (positive interest),
  - **Pass** (skip).
- Each like/pass is stored in the database.
- When two users both like each other:
  - a match record is created,
  - both users can see this match in their **Matches** list.

### FR5. Messaging 

- Only matched users can exchange messages.
- For a given match:
  - users can see a chronological list of messages,
  - users can send new text messages.
- Messages are stored with:
  - sender,
  - match id,
  - message body,
  - timestamp.
- “Real-time” can be implemented as:
  - simple page refresh OR
  - lightweight polling (e.g. reload messages every X seconds).

### FR6. Data integrity

- All core data (users, profiles, likes/passes, matches, messages) will be in PostgreSQL.
- Migrations exist to:
  - create these tables from scratch on an empty database,
  - update the schema in a controlled way.

## 6. Non-functional requirements (MVP 1)

- **Security**
  - Passwords are hashed (e.g. bcrypt).
  - Session cookies are HTTP-only; authentication is checked on protected routes.
- **Reliability**
  - Core flows (auth, create profile, like, match, message) work consistently across refresh.
- **Usability**
  - App works on common laptop and phone screen sizes.
  - Clear messages for common error states (invalid login, missing required profile fields).

## 7. Acceptance criteria (MVP 1)

### AC1. Authentication

- A new user can sign up, then log out, then log back in with the same credentials.
- Visiting a protected page while logged out redirects to the login screen.

### AC2. Profile

- After signing up, a user can create their profile (including housing status) and see it after a full page refresh.
- Editing profile fields (including housing status) updates what is shown on subsequent visits.

### AC3. Browsing / Discovery

- The logged-in user never sees their own profile in the browse view.
- After liking or passing on a user, that user does not reappear in the browse view.

### AC4. Match Logic

- When User A likes User B, and User B later likes User A, both users see each other in their **Matches** list.
- Removing or editing a profile does not break the matches view (UI should handle missing data gracefully).

### AC5. Messaging

- From the **Matches** list, a user can open a match and:
  - see previously sent messages in chronological order,
  - send a new message and see it appear in the thread.
- A user who is not part of a match cannot read or send messages for that match.

## 8. Risks / Open Questions

- **Profile fields**: which lifestyle fields are essential for MVP 1 vs. later?
- **Messaging UX**: is polling frequent enough, or do we need to invest in real-time sooner?
- **Scope creep**: keeping personality quizzes, verification, photos, and filters clearly out of MVP 1.
- **Housing status flag**: how strongly should matching/filtering rely on housing status vs. keeping it as a lightweight, editable indicator?

## Assumptions

- Default stack (tentative):
  - **Frontend**: React + TypeScript
  - **Backend**: Node.js + Express (TypeScript)
  - **DB**: PostgreSQL
  - **Auth**: Email + password with **JWT bearer tokens** (simplest for separate FE/BE hosting)
  - **Hosting path**: Vercel (frontend) + Render/Fly.io (backend) + managed Postgres (Render/Fly/Neon/Supabase)
- Matching is rule-based (no ML/AI). “Compatibility” is represented by filters + profile info; the feed is simple.
- Chat is **not real-time** for MVP (HTTP polling is acceptable).

## Purpose

Deliver a simple, reliable MVP that lets users:
sign up → create/edit profile → discover candidates → like/pass → match on mutual like → chat.

## Scope

### In-scope (MVP must-have)

- Authentication (sign up, log in, log out)
- Profile creation and editing (lifestyle + basics)
- Discovery feed (browse candidates, basic filters)
- Swiping actions (like/pass) with persistence
- Mutual match creation (when both like)
- Matches list (view matches)
- 1:1 chat for matched users (send/read messages)
- Basic safety/abuse controls (report/block minimal)
- Basic operational tooling (logging, env config, migrations)

### Nice-to-have (only if time remains)

- Photo upload + cropping (or multiple photos)
- “Undo pass” once per day
- More advanced discovery filters
- Read receipts / typing indicators
- Push/email notifications
- Basic admin dashboard for reports

### Out-of-scope (explicit)

- Room listings, rent collection, payments
- AI/ML matching, “compatibility scores”
- Group chats
- Video calls
- Native iOS/Android apps
- Full moderation tooling / trust & safety pipelines
- Public profiles indexed by search engines

## User flow (MVP)

1. **Landing** → user chooses Sign up / Log in
2. **Sign up** → create account
3. **Onboarding/Profile** → fill profile + preferences
4. **Discover** → view next candidate card → Like or Pass
5. **Match** → shown when mutual like occurs
6. **Matches list** → open a match
7. **Chat** → send/receive messages (polling)
8. **Settings** → edit profile, log out, block/report

## Functional requirements (MVP)

### FR1. Authentication

- Users can sign up using email + password.
- Users can log in/out.
- Users can access “my profile” and “my matches” only when authenticated.

### FR2. Profiles

- Users can create and update a profile with:
  - display name, age range (or age), pronouns optional
  - location (city/area), budget range
  - lifestyle/habits: cleanliness, sleep schedule, smoking, pets, guests, noise, work/study schedule
  - short bio (free text)
- Users can view other users’ profiles in discovery cards and a profile detail modal/page.

### FR3. Discovery feed

- Users can fetch a feed of candidate profiles excluding:
  - themselves
  - users they have already liked/passed
  - users they have blocked / who blocked them
- Feed supports minimal filters:
  - location (optional)
  - budget overlap (optional)
  - smoking/pets constraints (optional)

### FR4. Like/Pass and Match

- Users can Like or Pass a candidate.
- If both users Like each other, a **Match** is created.
- Users can view a list of their matches.

### FR5. Chat (matched only)

- A matched user can:
  - view message history for that match
  - send a new message
- Chat is accessible **only** between matched users.
- Messages are stored and retrievable; client can poll for new messages.

### FR6. Block/Report (minimal)

- Users can block another user:
  - blocked users disappear from discovery and matches, and cannot message.
- Users can submit a report with:
  - reported user, reason (enum), optional text.

## Non-functional requirements (MVP)

- **Security**
  - Passwords stored using a strong hash (bcrypt/argon2).
  - Auth tokens expire; endpoints require authentication where appropriate.
  - Input validation on all write endpoints.
- **Privacy**
  - Profiles visible only to authenticated users.
  - Blocked relationships enforced server-side.
- **Reliability**
  - API returns consistent error shapes.
  - DB migrations are repeatable.
- **Performance**
  - Discovery feed responds in < 500ms for typical dev-scale data (e.g., < 10k profiles).
- **Usability**
  - Works on mobile web (responsive layout).
  - Clear empty states (no candidates / no matches / no messages).
- **Observability**
  - Basic request logging + error logging; no PII in logs.

## Acceptance criteria (MVP)

### AC1. Authentication

- A new user can sign up and then successfully log in with the same credentials.
- Unauthenticated users cannot access protected pages and are redirected to Log in.
- Token expiration leads to a clear re-auth flow (e.g., “Session expired” → Log in).

### AC2. Profile

- A user can create a profile and see it persisted after refresh and re-login.
- A user can edit profile fields and see updated values immediately on their profile screen.
- Discovery cards render key fields (name, location, budget, 3–5 lifestyle attributes, bio snippet).

### AC3. Discovery feed

- The feed never shows the logged-in user.
- After Like/Pass on a user, that user does not appear again in the feed.
- Blocked users do not appear in the feed.

### AC4. Like/Pass + Match

- Liking a candidate creates a persisted “like” record.
- Passing creates a persisted “pass” record.
- When two users like each other, both see a match in their matches list.

### AC5. Chat

- A user can send a message to a match and see it in the conversation thread.
- Messages are returned in chronological order and include timestamp + sender.
- A non-matched user cannot access the conversation endpoint (403/404).

### AC6. Block/Report

- Blocking a user hides them from discovery and matches immediately.
- A blocked user cannot send messages (server-side enforced).
- Reporting creates a DB record viewable by developers/admin later (no UI needed beyond submission confirmation).

## Risks / open questions

- **Legal/ethics**: minimum age requirement (18+?) and handling of sensitive profile fields.
- **Safety**: how much personal info is allowed (phone numbers, socials) in bio.
- **Hosting**: if FE and BE are on different domains, ensure CORS is correct; JWT approach avoids cookie complexity.
- **Discovery**: what is the minimum “good enough” filter set for early user testing?
- **Chat polling**: decide polling interval vs. load (e.g., 5–10s while chat is open).

