# Backend user flow & matching logic

This doc describes the **step-by-step user journey** and **database/matching logic**. It maps each step to schema tables and operations.

---

## 1. Auth: sign up & log in

### 1.1 Sign up

**User action:** Submits email + password.

**Backend:**

1. Validate: email format, password length/strength (per product rules).
2. Check `users.email` is not already taken -> 409 if duplicate.
3. Hash password then:
   - `INSERT INTO users (email, password_hash) VALUES (?, ?)`.
4. Create session (e.g. Flask-Login), set secure cookie.
5. Return success; client can redirect to profile onboarding.

**DB state after:** One row in `users`.

---

### 1.2 Log in

**User action:** Submits email + password.

**Backend:**

1. Find user by `users.email`.
2. Verify password against `users.password_hash`.
3. If invalid -> 401.
4. Optionally check `users.is_active = TRUE` -> 403 if inactive.
5. Create session, set cookie.
6. Return success.

---

### 1.3 Log out

**Backend:** Invalidate session / clear auth cookie. No DB write required if using server-side session store; otherwise just client-side cookie clear.

---

## 2. Profile: create & edit

### 2.1 Create profile (first time)

**User action:** After signup (or first visit to “Profile”), submits profile form.

**Backend:**

1. Require auth -> 401 if not logged in.
2. Validate body: `display_name`, `age` (18–100), `city`, `housing_status`, `budget_min`/`budget_max` (min ≤ max), `bio` (length), and lifestyle enums per `db/schema.sql`.
3. Check at most one profile per user:  
   - If `SELECT … FROM profiles WHERE user_id = current_user_id` exists -> 409 or treat as update (see 2.2).
4. `INSERT INTO profiles (user_id, display_name, age, city, housing_status, budget_min, budget_max, bio, cleanliness, smoking, pets, sleep_schedule, guests, noise_level, is_complete)`  
   Set `is_complete = TRUE` only if all required fields are present and valid.
5. Return created profile.

**DB state check:** One row in `profiles` linked to `users.id`. `profiles.is_complete` gates whether this user appears in others’ discovery feed.

---

### 2.2 Update profile

**User action:** Edits profile and saves.

**Backend:**

1. Require auth.
2. Validate as in 2.1.
3. `UPDATE profiles SET … WHERE user_id = current_user_id`.
4. Trigger `profiles_updated_at` will set `updated_at = NOW()` automatically.
5. Recompute `is_complete` if you use it (e.g. set TRUE when all required fields filled).
6. Return updated profile.
---

## 3. Discovery (browse) feed

**User action:** Opens “Discover” and expects a list (or stream) of candidate profiles.

**Backend:**

1. Require auth -> 401 if not logged in.
2. Optional: require `profiles.is_complete = TRUE` for current user -> 403 with “Complete your profile” if not.
3. Build list of candidate user IDs to show:
   - **Include:** users who have a profile with `is_complete = TRUE`.
   - **Exclude:**
     - Current user.
     - Users the current user has already **liked** or **passed**:  
       `SELECT liked_id FROM likes WHERE liker_id = current_user_id`.
     - Users who have **blocked** the current user:  
       `SELECT blocker_id FROM blocks WHERE blocked_id = current_user_id`.
     - Users the current user has **blocked**:  
       `SELECT blocked_id FROM blocks WHERE blocker_id = current_user_id`.
4. Order (e.g. `profiles.updated_at DESC` or random).
5. Paginate (e.g. limit/offset or cursor).
6. For each candidate user ID, load `profiles`. Return profile payloads.

**Tables used:** `profiles`, `likes`, `blocks` (and `users` for auth).

---

## 4. Like / Pass

**User action:** Clicks Like or Pass on a candidate profile.

**Backend:**

1. Require auth.
2. Validate: target user ID exists, is not current user, and is in the “candidate” set (e.g. not already liked/passed, not blocked). If not -> 400 or 404.
3. `INSERT INTO likes (liker_id, liked_id, action) VALUES (current_user_id, target_user_id, 'LIKE' | 'PASS')`.  
   Schema has `UNIQUE (liker_id, liked_id)` so duplicate action on same pair -> 409 or ignore.
4. **If action is LIKE:**  
   Check for mutual like:
   - Query: exists `likes` row where `liker_id = target_user_id` AND `liked_id = current_user_id` AND `action = 'LIKE'`.
   - If yes → **create match** (see 5.1).
5. Return success, so frontend can show “It’s a match!”.

**Tables used:** `likes`; if mutual like, then `matches` (see below).

---

## 5. Match creation (mutual like)

**When:** Right after current user **Likes** someone who has already **Liked** the current user.

**Backend (called from step 4):**

1. Compute canonical pair: `(user_a_id, user_b_id)` where `user_a_id = MIN(current_user_id, target_user_id)` and `user_b_id = MAX(...)` (so `user_a_id < user_b_id`).
2. Check if match already exists:  
   `SELECT id FROM matches WHERE user_a_id = ? AND user_b_id = ? AND status = 'active'`.
3. If not exists:  
   `INSERT INTO matches (user_a_id, user_b_id, status) VALUES (user_a_id, user_b_id, 'active')`.
4. If you need “match created” event for push/email later, do it here; for MVP, returning a flag to the client is enough.

**Important:** One row per pair; schema `CHECK (user_a_id < user_b_id)` and `UNIQUE (user_a_id, user_b_id)`.

---

## 6. Matches list

**User action:** Opens “My matches”.

**Backend:**

1. Require auth.
2. Query matches where current user is either `user_a_id` or `user_b_id`, and `status = 'active'`:
   - `SELECT * FROM matches WHERE (user_a_id = current_user_id OR user_b_id = current_user_id) AND status = 'active'`.
3. For each match, resolve the **other** user’s profile (the “match partner”):  
   if `user_a_id = current_user_id` then partner is `user_b_id`, else `user_a_id`. Load that user’s `profiles` row.
4. (Optionally) exclude partners who have blocked the current user (or whom current user blocked) so they don’t appear in the list.
5. Return list of matches with partner profile summary (e.g. display_name, city, housing_status, avatar_url).

**Tables used:** `matches`, `profiles`, `users` (for resolving partner).

---

## 7. Messaging 

**User action:** Opens a match and sends a message or refreshes the thread.

### 7.1 List messages

**Backend:**

1. Require auth.
2. Validate: `match_id` exists and current user is one of `user_a_id` or `user_b_id`, and `status = 'active'`. If not -> 404.
3. Make sure neither user has blocked the other (if you hide matches after block, no need here).
4. `SELECT * FROM messages WHERE match_id = ? ORDER BY created_at ASC` (or DESC for “newest first” then reverse on client).
5. Return messages (e.g. id, sender_id, body, created_at). Client can map `sender_id` to “me” vs “them”.

**Tables used:** `matches`, `messages`.

---

### 7.2 Send message

**User action:** Submits message body.

**Backend:**

1. Require auth.
2. Validate: `match_id` exists, current user is in the match, match is `active`; body length per schema (e.g. 1–2000 chars).
3. `INSERT INTO messages (match_id, sender_id, body) VALUES (?, current_user_id, ?)`.
4. Return created message (id, created_at, etc.).

**Tables used:** `matches`, `messages`.

---

## 8. Block (Optional, but since we already have  the data model for blocking, we can go ahead with enforcement logic, but no pressure)

**User action:** Blocks another user.

**Backend:**

1. Require auth.
2. Validate: target user exists and is not self.
3. `INSERT INTO blocks (blocker_id, blocked_id) VALUES (current_user_id, target_user_id)` (ignore or 409 if already blocked).
4. Effect: exclude this pair from each other’s discovery feed and, if you implement it, from matches list / messaging. All discovery and match-list queries must filter by `blocks` as in sections 3 and 6.

---

## 9. Report (optional for MVP 1)

**User action:** Reports a user with a reason (and optional details).

**Backend:**

1. Require auth.
2. Validate: target user exists, reason is one of `report_reason` enum values.
3. `INSERT INTO reports (reporter_id, reported_id, reason, details) VALUES (?, ?, ?, ?)`.
4. No automatic action on the reported user; reports are for later review.

---

## 10. Summary: table usage by flow

| Flow            | Tables read/written |
|-----------------|----------------------|
| Sign up         | `users` (insert)     |
| Log in          | `users` (read)       |
| Create/update profile | `profiles` (insert/update) |
| Discovery feed  | `profiles`, `likes`, `blocks` (read) |
| Like/Pass       | `likes` (insert); possibly `matches` (insert) |
| Matches list    | `matches`, `profiles` (read) |
| List/send messages | `matches`, `messages` (read/insert) |
| Block           | `blocks` (insert)     |
| Report          | `reports` (insert)    |

---

## 11. Matching logic checklist (backend)

- [ ] Discovery excludes: self, already liked/passed, blocked in either direction.
- [ ] Discovery only includes users with `is_complete = TRUE` (and optionally same for current user before they can browse).
- [ ] Like/Pass: one row per (liker_id, liked_id); duplicate action -> 409 or no-op.
- [ ] On LIKE: check for existing LIKE in opposite direction; if yes, create match.
- [ ] Match: always store with `user_a_id < user_b_id` and `UNIQUE (user_a_id, user_b_id)`.
- [ ] Messages: only if user is in match and match is active; sender_id must be current user.
- [ ] Block: discovery and match list (and messaging, if implemented) respect blocks.