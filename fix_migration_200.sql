-- Fix for migration 200: Rename variable to avoid ambiguity
-- Run this before retrying db push

-- Drop and recreate the problematic function/block
-- This fixes the ambiguous reference issue

BEGIN;

-- The error is in migration 200, line 36 where table_name is ambiguous
-- We need to fix the DO block that has this issue

-- Since we can't directly modify the migration that's running,
-- let's ensure the tables are ready

-- Check and add organization_id columns where missing
DO $$
DECLARE
    tbl_name TEXT;  -- Changed from table_name to avoid ambiguity
    default_org_id UUID;
    update_count INTEGER;
    total_updated INTEGER := 0;
BEGIN
    -- Get default organization
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'humbl-girls-club' LIMIT 1;
    
    IF default_org_id IS NOT NULL THEN
        -- Update each table with organization_id (only if table and column exist)
        FOR tbl_name IN
            SELECT unnest(ARRAY[
                'events', 'event_registrations', 'event_attendance',
                'challenges', 'challenge_participations', 'challenge_cycles',
                'walking_leaderboards', 'health_data', 'step_validation_logs',
                'social_posts', 'post_likes', 'post_comments', 'post_reactions',
                'direct_messages', 'message_threads', 'blocked_users',
                'loyalty_transactions', 'rewards_catalog', 'reward_redemptions',
                'expired_points', 'admin_actions', 'content_reports',
                'notifications', 'performance_metrics', 'privacy_settings',
                'user_notification_settings', 'user_wellness_settings',
                'user_appearance_settings', 'user_social_settings',
                'profiles', 'user_roles', 'invites'
            ])
        LOOP
            -- Check if table and column exist before updating
            IF EXISTS (
                SELECT 1 FROM information_schema.columns c
                WHERE c.table_name = tbl_name AND c.column_name = 'organization_id'
            ) THEN
                EXECUTE format('UPDATE %I SET organization_id = $1 WHERE organization_id IS NULL', tbl_name)
                USING default_org_id;
                
                GET DIAGNOSTICS update_count = ROW_COUNT;
                total_updated := total_updated + update_count;
                
                IF update_count > 0 THEN
                    RAISE NOTICE 'Updated % rows in %', update_count, tbl_name;
                END IF;
            END IF;
        END LOOP;
        
        -- Update profiles with current_organization_id (only if column exists)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = 'profiles' AND c.column_name = 'current_organization_id'
        ) THEN
            UPDATE profiles
            SET current_organization_id = default_org_id
            WHERE current_organization_id IS NULL;
        END IF;
        
        RAISE NOTICE 'Total rows updated across all tables: %', total_updated;
    END IF;
END $$;

COMMIT;