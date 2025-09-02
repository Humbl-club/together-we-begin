-- Add Stripe Connect columns to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS charges_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_fee_bps INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_organizations_stripe ON organizations(stripe_account_id);

