-- Migration 000: Fix existing tables before running other migrations
-- This handles tables that may already exist from previous partial migrations

BEGIN;

-- Drop existing tables that were partially created without organization_id
DROP TABLE IF EXISTS content_reports CASCADE;
DROP TABLE IF EXISTS user_warnings CASCADE;
DROP TABLE IF EXISTS moderation_actions CASCADE;
DROP TABLE IF EXISTS organization_bans CASCADE;
DROP TABLE IF EXISTS deleted_content CASCADE;

-- Drop other potentially existing tables that might conflict
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS invite_codes CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organization_features CASCADE;
DROP TABLE IF EXISTS feature_catalog CASCADE;

COMMIT;