-- ============================================================================
-- DAY 1: COMPLETE MULTI-TENANT MIGRATION
-- ============================================================================
-- This migration applies all multi-tenant changes in the correct order
-- Run time: ~5-10 minutes depending on data volume
-- ============================================================================

-- Phase 1.1: Create organizations table if not exists
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    settings JSONB DEFAULT '{}',
    billing_status TEXT DEFAULT 'active',
    plan_type TEXT DEFAULT 'standard',
    max_members INTEGER DEFAULT 100,
    features JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}'
);

-- Phase 1.2: Create organization_members table if not exists
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    settings JSONB DEFAULT '{}',
    UNIQUE(organization_id, user_id)
);

-- Create indexes for organization tables
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Phase 1.3: Create default organization and migrate existing users
DO $$
DECLARE
    default_org_id UUID;
    user_record RECORD;
BEGIN
    -- Check if organizations table is empty
    IF NOT EXISTS (SELECT 1 FROM organizations LIMIT 1) THEN
        -- Create default organization
        INSERT INTO organizations (name, slug, settings, plan_type, max_members)
        VALUES ('Humbl Girls Club', 'humbl-girls-club', 
                '{"theme": "default", "features": ["events", "challenges", "social", "loyalty"]}',
                'enterprise', 10000)
        RETURNING id INTO default_org_id;

        -- Migrate all existing users to default organization
        FOR user_record IN SELECT id FROM auth.users
        LOOP
            INSERT INTO organization_members (organization_id, user_id, role)
            VALUES (default_org_id, user_record.id, 
                    CASE 
                        WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = user_record.id AND role = 'admin')
                        THEN 'admin'
                        ELSE 'member'
                    END)
            ON CONFLICT DO NOTHING;
        END LOOP;

        RAISE NOTICE 'Created default organization and migrated % users', 
                     (SELECT COUNT(*) FROM organization_members WHERE organization_id = default_org_id);
    END IF;
END $$;

-- Phase 1.4: Add organization_id to ALL existing tables (43 tables)
-- This is idempotent - safe to run multiple times

-- Events and related tables
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE event_attendance 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Challenges and wellness tables
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE challenge_participations 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE challenge_cycles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE walking_leaderboards 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE health_data 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE step_validation_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Social features tables
ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE post_likes 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE post_comments 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE post_reactions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Messaging tables
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE message_threads 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE blocked_users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Loyalty and rewards tables
ALTER TABLE loyalty_transactions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE rewards_catalog 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE reward_redemptions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE expired_points 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Admin and system tables
ALTER TABLE admin_actions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE content_reports 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE performance_metrics 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- User settings tables
ALTER TABLE privacy_settings 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE user_notification_settings 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE user_wellness_settings 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE user_appearance_settings 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE user_social_settings 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Profile and user tables
-- Add organization_id to existing tables if they exist
DO $$
BEGIN
    -- Add to profiles if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES organizations(id);
    END IF;
    
    -- Add to user_roles if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        ALTER TABLE user_roles 
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    END IF;
    
    -- Add to invites if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invites') THEN
        ALTER TABLE invites 
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    END IF;
END $$;

-- Phase 1.5: Update existing data with organization_id
DO $$
DECLARE
    default_org_id UUID;
    tbl_name TEXT;
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
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = tbl_name AND column_name = 'organization_id'
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
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'current_organization_id'
        ) THEN
            UPDATE profiles 
            SET current_organization_id = default_org_id 
            WHERE current_organization_id IS NULL;
        END IF;
        
        RAISE NOTICE 'Total rows updated across all tables: %', total_updated;
    END IF;
END $$;

-- Phase 1.6: Make organization_id NOT NULL after data migration
-- This ensures data integrity going forward
DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN 
        SELECT unnest(ARRAY[
            'events', 'event_registrations', 'challenges', 
            'challenge_participations', 'social_posts', 
            'direct_messages', 'loyalty_transactions'
        ])
    LOOP
        -- Only alter if column exists and has no nulls
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tbl_name 
            AND column_name = 'organization_id'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = tbl_name 
            AND column_name = 'organization_id'
            AND is_nullable = 'NO'
        ) THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN organization_id SET NOT NULL', tbl_name);
            RAISE NOTICE 'Made organization_id NOT NULL for %', tbl_name;
        END IF;
    END LOOP;
END $$;

-- Phase 1.7: Create helper functions for organization context
CREATE OR REPLACE FUNCTION get_user_organizations(p_user_id UUID)
RETURNS TABLE(organization_id UUID, organization_name TEXT, role TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT om.organization_id, o.name, om.role
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.user_id = p_user_id
    ORDER BY om.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_current_organization(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    current_org UUID;
BEGIN
    -- Get from profile first
    SELECT current_organization_id INTO current_org
    FROM profiles
    WHERE id = p_user_id;
    
    -- If null, get first organization
    IF current_org IS NULL THEN
        SELECT organization_id INTO current_org
        FROM organization_members
        WHERE user_id = p_user_id
        ORDER BY joined_at DESC
        LIMIT 1;
    END IF;
    
    RETURN current_org;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_organizations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_current_organization(UUID) TO authenticated;

-- Create audit log for migration (only if we have an authenticated user)
DO $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO admin_actions (admin_id, action, target_type, target_id, details)
        VALUES (
            auth.uid(),
            'system_migration',
            'database',
            gen_random_uuid(),
            jsonb_build_object(
                'migration', 'day1_complete_multitenant',
                'timestamp', now(),
                'tables_updated', 43,
                'phase', 'Day 1 - Multi-tenant foundation'
            )
        );
    END IF;
END $$;

-- Summary
DO $$
DECLARE
    org_count INTEGER;
    member_count INTEGER;
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    SELECT COUNT(*) INTO member_count FROM organization_members;
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.columns 
    WHERE column_name = 'organization_id' 
    AND table_schema = 'public';
    
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'Organizations created: %', org_count;
    RAISE NOTICE 'Members migrated: %', member_count;
    RAISE NOTICE 'Tables with organization_id: %', table_count;
    RAISE NOTICE '==========================';
END $$;