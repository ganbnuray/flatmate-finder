-- flatmate finder — postgres schema
-- we need to run this once on a fresh database (supabase or local)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- enums

CREATE TYPE housing_status    AS ENUM ('HAS_APARTMENT', 'LOOKING', 'LOOKING_WITH_FLATMATE', 'EITHER');
CREATE TYPE cleanliness_level AS ENUM ('very_clean', 'clean', 'moderate', 'relaxed');
CREATE TYPE smoking_pref      AS ENUM ('non_smoker', 'outside_only', 'smoker', 'no_preference');
CREATE TYPE pets_pref         AS ENUM ('no_pets', 'has_pets', 'ok_with_pets', 'no_preference');
CREATE TYPE sleep_schedule    AS ENUM ('early_bird', 'night_owl', 'flexible');
CREATE TYPE guests_pref       AS ENUM ('rarely', 'sometimes', 'often', 'no_preference');
CREATE TYPE noise_level       AS ENUM ('quiet', 'moderate', 'lively');
CREATE TYPE gender_identity   AS ENUM ('woman', 'man', 'non_binary', 'other', 'prefer_not_say');
CREATE TYPE like_action       AS ENUM ('LIKE', 'PASS');
CREATE TYPE match_status      AS ENUM ('active', 'unmatched');
CREATE TYPE report_reason     AS ENUM (
    'spam', 'harassment', 'fake_profile', 'inappropriate_content', 'other'
);

-- tables

-- stores auth info only (email + hashed password), kept separate from profile data
CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE
);

-- one profile per user
-- is_complete = false until the user finishes onboarding, which gates feed access
CREATE TABLE profiles (
    id             UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID              NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- basic info
    display_name   TEXT              NOT NULL,
    age            INTEGER           NOT NULL CHECK (age >= 18 AND age <= 100),
    city           TEXT              NOT NULL,
    neighborhood   TEXT              NOT NULL,
    gender         gender_identity   NOT NULL DEFAULT 'prefer_not_say',
    housing_status housing_status    NOT NULL,
    budget_min     INTEGER           NOT NULL CHECK (budget_min >= 0),
    budget_max     INTEGER           NOT NULL CHECK (budget_max >= budget_min),
    bio            TEXT              CHECK (char_length(bio) <= 500),
    avatar_url     TEXT,             -- nullable for now, photo upload is nice-to-have

    -- lifestyle fields
    cleanliness    cleanliness_level NOT NULL,
    smoking        smoking_pref      NOT NULL,
    pets           pets_pref         NOT NULL,
    sleep_schedule sleep_schedule    NOT NULL,
    guests         guests_pref       NOT NULL DEFAULT 'no_preference',
    noise_level    noise_level       NOT NULL DEFAULT 'moderate',

    -- set to true once all required fields are filled in
    is_complete    BOOLEAN           NOT NULL DEFAULT FALSE,

    created_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- stores like and pass decisions
-- unique(liker_id, liked_id) prevents acting on the same profile twice
CREATE TABLE likes (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    liker_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action     like_action NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (liker_id, liked_id),
    CHECK  (liker_id != liked_id)
);

-- created when two users both like each other
-- we always store user_a_id < user_b_id so there's no duplicate (A,B) and (B,A) rows
CREATE TABLE matches (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     match_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE (user_a_id, user_b_id),
    CHECK  (user_a_id < user_b_id)
);

-- messages between matched users
CREATE TABLE messages (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id   UUID        NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body       TEXT        NOT NULL CHECK (
                               char_length(body) > 0 AND char_length(body) <= 2000
                           ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- blocked users are hidden from feed, matches, and messaging
CREATE TABLE blocks (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (blocker_id, blocked_id),
    CHECK  (blocker_id != blocked_id)
);

-- reports are just stored for us to review later, no admin ui needed for mvp
CREATE TABLE reports (
    id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_id UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason      report_reason NOT NULL,
    details     TEXT          CHECK (char_length(details) <= 1000),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CHECK (reporter_id != reported_id)
);

-- indexes

-- speeds up feed queries filtered by city
CREATE INDEX idx_profiles_city     ON profiles(city);
CREATE INDEX idx_profiles_neighborhood ON profiles(neighborhood);
CREATE INDEX idx_profiles_complete ON profiles(is_complete) WHERE is_complete = TRUE;

-- used to exclude users already liked/passed from the feed
CREATE INDEX idx_likes_liker ON likes(liker_id);
CREATE INDEX idx_likes_liked ON likes(liked_id);

-- match lookups from either user's side
CREATE INDEX idx_matches_user_a ON matches(user_a_id);
CREATE INDEX idx_matches_user_b ON matches(user_b_id);

-- fetch messages in order for a given match
CREATE INDEX idx_messages_match_created ON messages(match_id, created_at);

-- block lookups in both directions
CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

-- trigger to keep profiles.updated_at accurate on every update

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
