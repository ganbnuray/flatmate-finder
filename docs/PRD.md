# Flatmate Tinder — Running Meeting Notes (PRD Draft)

## 1. Product Overview

### 1.1 Short Product Statement

Something like: “A web app that helps … find compatible flatmates based on…”.

### 1.2 For this we need to know

What problem are we solving? Whom are we solving it for? #gapanalysis

### 1.3 Target Users

Who are our primary users?

#### User Pain Points

- Pain point 1
- Pain point 2

## 2. Product Goals

- Goal 1
- Goal 2

## 3. Scope Definition

### 3.1 MVP Features

**MVP 1:**

- User registration & login
- Profile creation (preferences, budget, lifestyle)
- Browse potential matches
- Swipe/Like/Pass system
- Match logic
- Basic messaging
- Profile editing
- Database storage

### 3.2 Second Priority

- Personality quiz
- Verification
- Filters (smoking, pets, gender preference)
- Photo uploads
- Map-based browsing
- Reporting/blocking system

### 3.3 What we most likely will not be able to do (but we could be ambitious to try)

Define this clearly to avoid scope creep.

- AI matching algorithms
- Video calls

## 4. User Flow

We could maybe create a diagram here.

## 5. Functional Requirements

### 5.1 Authentication

- Email + password
- Password validation
- Session handling

### 5.2 Profile System

**Fields:**

- Name
- Age
- Budget range
- Cleanliness level
- Smoking preference
- Pets
- Sleep schedule
- Short bio
- Anything else?

### 5.3 Matching System

- Users can like/pass
- Mutual likes create match
- Store match relationships

### 5.4 Messaging

- Simple text messages
- Real-time OR refresh-based
- Stored in database

## 7. Technical Stack

- Frontend:
- Backend:
- Database:
- Hosting:
- Version Control:

## 8. Database Planning (this is for later ig)

**Entities:**

- Users
- Profiles
- Likes
- Matches
- Messages

**Relationships:**

- One user → one profile
- Many users → many matches
- Matches → many messages

## 9. Timeline (3 Months)

### Phase 1 (Weeks 1–3): PM Setup

- Finalize PRD
- Wireframes
- DB schema
- Auth setup

### Phase 2 (Weeks 4–7): Basic Functionality

- Profile system
- Swipe logic
- Match creation
- Messaging system

### Phase 3 (Weeks 8–10): UI Improvements + Testing

- Styling
- Testing
- Security cleanup

### Phase 4 (Weeks 11–12): Polish & Demo

- Deployment
- Final testing
- Documentation

## 11. Metrics for Success

- All MVP features implemented
- No critical bugs
- Code runs reliably
- Clear documentation
- Demo-ready version
- Gotta confirm this with the grading criteria, because, apparently, it’s quite particular

# Flatmate Finder — Lean PRD (MVP)

## Problem statement

Students and young professionals struggle to find compatible flatmates using fragmented channels (group chats, social media posts, generic housing platforms). Existing options emphasize listings and availability rather than **habit compatibility**, leading to mismatches and stressful living situations.

Flatmate Finder focuses on **people-first matching** by letting users discover, like/pass, match, and chat with potential flatmates based on lifestyle and budget preferences.

## Target users

- **Primary**: university students (18–26) looking to find 1–3 flatmates in the next 1–3 months.
- **Secondary**: young professionals (22–30) relocating or changing housing.

## Goals

- Enable users to find and contact compatible flatmates quickly with minimal friction.
- Reduce time spent “sifting” through irrelevant posts by offering structured profiles and filters.
- Provide a safe baseline experience (block/report) appropriate for a university MVP.

## Non-goals

- Not a room-listing marketplace (no property inventory, no rent payments).
- Not an “AI matchmaker” (no ML scoring or recommendations beyond simple filtering).
- Not a full social network (no public searchable profiles).

## MVP scope (what we will ship)

### Must-have

- Sign up / log in / log out
- Create/edit profile (lifestyle, budget, bio, location)
- Discover feed (browse candidates, basic filters)
- Like/pass and mutual matches
- Matches list
- 1:1 chat (HTTP polling)
- Block/report (minimal)

### Nice-to-have (time-permitting)

- Photo upload (single photo)
- More filters / better ranking
- “New match” notifications (in-app only)

## Success metrics (MVP)

**Product metrics**
- Activation: % of signed-up users who complete a profile
- Engagement: median likes/passes per active user session
- Match rate: matches per 100 likes
- Conversation start rate: % of matches where at least one message is sent

**Quality metrics**
- API error rate (5xx) < 1% in normal usage
- Median discovery response time < 500ms for typical dataset

## Timeline (12 weeks, student-realistic)

### Week 1: Foundations (check-in deliverable)

- Repo structure + dev env instructions
- DB schema + migrations
- Basic auth (sign up/log in)
- Basic profile create/edit (happy path)
- Minimal FE routes + navigation skeleton

### Weeks 2–3: Profiles + Discovery

- Profile fields finalized + validation
- Discovery feed endpoint + UI card stack
- Like/pass persistence

### Weeks 4–5: Matching

- Mutual match creation
- Matches list UI
- Basic empty states

### Weeks 6–7: Chat

- Message storage + endpoints
- Chat UI + polling
- Server-side access control (match required)

### Weeks 8–9: Safety + QA hardening

- Block/report
- Error handling + edge cases
- Basic rate limiting (optional)

### Weeks 10–12: Polish + Deployment

- Responsive UX pass
- Seed data for demos
- Deploy FE + BE + DB
- Bug bash + final demo prep

## Dependencies / constraints

- Availability and scope discipline are the main constraints; prioritize must-have features.
- Use proven libraries and avoid bespoke infrastructure.
- Keep architecture simple: REST API + Postgres + basic auth + polling chat.

## Open questions

- Minimum age requirement (18+?) and what identity fields are permitted.
- Required profile fields vs. optional fields for activation.
- Whether to include photo upload in MVP (trade-off: time + storage complexity).

