-- Migration: add gender, neighborhood, and housing status value.

ALTER TYPE housing_status ADD VALUE IF NOT EXISTS 'LOOKING_WITH_FLATMATE';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_identity') THEN
        CREATE TYPE gender_identity AS ENUM ('woman', 'man', 'non_binary', 'other', 'prefer_not_say');
    END IF;
END $$;

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS neighborhood TEXT,
    ADD COLUMN IF NOT EXISTS gender gender_identity NOT NULL DEFAULT 'prefer_not_say';

UPDATE profiles
SET neighborhood = city
WHERE neighborhood IS NULL;

ALTER TABLE profiles
    ALTER COLUMN neighborhood SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_neighborhood ON profiles(neighborhood);
