-- eVoteGH Database Schema for Neon PostgreSQL
-- Run this once to initialise your database.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Events ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id    UUID,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  event_type      TEXT CHECK (event_type IN ('church','university','corporate','community','entertainment','other')),
  region          TEXT,
  physical_event_date TIMESTAMPTZ,
  nomination_start    TIMESTAMPTZ,
  nomination_end      TIMESTAMPTZ,
  voting_start        TIMESTAMPTZ NOT NULL,
  voting_end          TIMESTAMPTZ NOT NULL,
  status          TEXT DEFAULT 'draft'
                  CHECK (status IN ('draft','nomination_open','nomination_closed','voting_open','voting_closed','paid_out')),
  commission_rate NUMERIC DEFAULT 0.15,
  banner_url      TEXT,
  logo_url        TEXT,
  is_public       BOOLEAN DEFAULT TRUE,
  base_vote_price NUMERIC NOT NULL,
  total_revenue   NUMERIC DEFAULT 0,
  total_votes     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Categories ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT,
  cover_image_url TEXT,
  display_order   INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Nominees ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nominees (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id         UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id             TEXT,                 -- Clerk user ID (nullable)
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL,
  bio                 TEXT,
  photo_url           TEXT,
  phone               TEXT,
  email               TEXT,
  nominated_by_name   TEXT,
  nominated_by_phone  TEXT,
  nomination_reason   TEXT,
  approval_status     TEXT DEFAULT 'pending'
                      CHECK (approval_status IN ('pending','approved','rejected')),
  is_claimed          BOOLEAN DEFAULT FALSE,
  is_active           BOOLEAN DEFAULT FALSE,
  total_votes         INTEGER DEFAULT 0,
  total_revenue       NUMERIC DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Organizers ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT,                 -- Clerk user ID
  event_ids           UUID[] DEFAULT '{}',
  organization_name   TEXT NOT NULL,
  contact_name        TEXT NOT NULL,
  phone               TEXT NOT NULL,
  email               TEXT,
  disbursement_method TEXT CHECK (disbursement_method IN ('momo','bank')),
  momo_network        TEXT CHECK (momo_network IN ('mtn','telecel','airteltigo')),
  momo_number         TEXT,
  bank_name           TEXT,
  bank_account_number TEXT,
  bank_account_name   TEXT,
  invite_status       TEXT DEFAULT 'pending'
                      CHECK (invite_status IN ('pending','accepted')),
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Vote Packages ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vote_packages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  votes           INTEGER NOT NULL,
  price_ghs       NUMERIC NOT NULL,
  is_highlighted  BOOLEAN DEFAULT FALSE,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Vote Transactions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vote_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL REFERENCES events(id),
  nominee_id          UUID NOT NULL REFERENCES nominees(id),
  category_id         UUID NOT NULL REFERENCES categories(id),
  package_id          UUID REFERENCES vote_packages(id),
  votes_cast          INTEGER NOT NULL,
  amount_ghs          NUMERIC NOT NULL,
  gateway             TEXT DEFAULT 'paystack',
  gateway_reference   TEXT,
  voter_name          TEXT,
  voter_phone         TEXT,
  voter_email         TEXT,
  status              TEXT DEFAULT 'pending'
                      CHECK (status IN ('pending','confirmed','failed')),
  confirmed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Payouts ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL REFERENCES events(id),
  organizer_id        UUID NOT NULL REFERENCES organizers(id),
  gross_revenue       NUMERIC NOT NULL,
  commission_amount   NUMERIC NOT NULL,
  commission_rate     NUMERIC NOT NULL,
  net_payout          NUMERIC NOT NULL,
  disbursement_method TEXT CHECK (disbursement_method IN ('momo','bank')),
  status              TEXT DEFAULT 'pending'
                      CHECK (status IN ('pending','processing','completed','failed')),
  processed_at        TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit Logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   TEXT,
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT,
  details         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENT ACCESS: organizer (event-wide) & nominee (nominee-specific) invites
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS event_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('organizer', 'nominee')),
  nominee_id UUID REFERENCES nominees(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  clerk_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  invited_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  CONSTRAINT nominee_role_requires_nominee_id CHECK (
    (role = 'nominee' AND nominee_id IS NOT NULL) OR role = 'organizer'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS event_access_unique_active_email
  ON event_access (event_id, email) WHERE status <> 'revoked';
CREATE INDEX IF NOT EXISTS event_access_clerk_user_idx ON event_access (clerk_user_id);
CREATE INDEX IF NOT EXISTS event_access_event_idx ON event_access (event_id);

-- Fast vote counter on each nominee (avoids re-aggregating vote_transactions on every page load)
ALTER TABLE nominees ADD COLUMN IF NOT EXISTS vote_count INTEGER NOT NULL DEFAULT 0;

-- ─── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_slug        ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_is_public   ON events(is_public);
CREATE INDEX IF NOT EXISTS idx_categories_event   ON categories(event_id);
CREATE INDEX IF NOT EXISTS idx_nominees_event     ON nominees(event_id);
CREATE INDEX IF NOT EXISTS idx_nominees_category  ON nominees(category_id);
CREATE INDEX IF NOT EXISTS idx_nominees_user      ON nominees(user_id);
CREATE INDEX IF NOT EXISTS idx_organizers_user    ON organizers(user_id);
CREATE INDEX IF NOT EXISTS idx_organizers_email   ON organizers(email);
CREATE INDEX IF NOT EXISTS idx_vt_event           ON vote_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_vt_nominee         ON vote_transactions(nominee_id);
CREATE INDEX IF NOT EXISTS idx_payouts_organizer  ON payouts(organizer_id);
