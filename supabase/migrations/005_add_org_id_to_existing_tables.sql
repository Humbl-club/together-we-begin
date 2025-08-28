-- Migration 005: Safe addition of organization_id to existing tables
-- This migration is safe to run even if tables don't exist yet
-- The actual multi-tenant setup happens in migration 200

-- Skip this migration if tables don't exist
-- The real work is done in migration 200_apply_multitenant_to_existing.sql
SELECT 'Migration 005: Skipping - tables will be updated in migration 200' AS status;