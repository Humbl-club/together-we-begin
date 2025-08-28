-- ============================================================================
-- MULTI-TENANT MIGRATION FOR EXISTING TABLES
-- ============================================================================
-- This migration runs AFTER all base tables are created
-- It adds organization_id to existing tables and migrates data
-- ============================================================================

-- Phase 1: Create default organization if not exists
DO $$
DECLARE
    default_org_id UUID;
    user_record RECORD;
BEGIN
    -- Check if organizations table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        -- Check if default organization exists
        IF NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'humbl-girls-club') THEN
            -- Create default organization
            INSERT INTO organizations (name, slug, settings, subscription_tier, max_members)
            VALUES ('Humbl Girls Club', 'humbl-girls-club', 
                    '{"theme": "default", "features": ["events", "challenges", "social", "loyalty"]}',
                    'enterprise', 10000)
            RETURNING id INTO default_org_id;

            RAISE NOTICE 'Created default organization with ID: %', default_org_id;

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

            RAISE NOTICE 'Migrated users to default organization';
        END IF;
    END IF;
END $$;

-- Phase 2: Add organization_id to existing tables (only if they exist)
DO $$
DECLARE
    tbl TEXT;
    default_org_id UUID;
BEGIN
    -- Get default organization ID
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'humbl-girls-club' LIMIT 1;
    
    -- List of tables to add organization_id to
    FOR tbl IN 
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
        -- Check if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl) THEN
            -- Check if column doesn't already exist
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = tbl AND column_name = 'organization_id'
            ) THEN
                -- Add organization_id column
                EXECUTE format('ALTER TABLE %I ADD COLUMN organization_id UUID REFERENCES organizations(id)', tbl);
                RAISE NOTICE 'Added organization_id to table: %', tbl;
                
                -- Update existing rows with default organization
                IF default_org_id IS NOT NULL THEN
                    EXECUTE format('UPDATE %I SET organization_id = $1 WHERE organization_id IS NULL', tbl)
                    USING default_org_id;
                END IF;
            END IF;
        END IF;
    END LOOP;
    
    -- Special case: Add current_organization_id to profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'current_organization_id'
        ) THEN
            ALTER TABLE profiles ADD COLUMN current_organization_id UUID REFERENCES organizations(id);
            UPDATE profiles SET current_organization_id = default_org_id WHERE current_organization_id IS NULL;
            RAISE NOTICE 'Added current_organization_id to profiles';
        END IF;
    END IF;
END $$;

-- Phase 3: Create composite indexes for performance
DO $$
DECLARE
    idx_name TEXT;
    tbl TEXT;
    cols TEXT;
BEGIN
    -- Define indexes to create
    FOR idx_name, tbl, cols IN VALUES
        ('idx_events_org_date', 'events', 'organization_id, start_time DESC'),
        ('idx_event_reg_org_user', 'event_registrations', 'organization_id, user_id'),
        ('idx_posts_org_created', 'social_posts', 'organization_id, created_at DESC'),
        ('idx_messages_org_thread', 'direct_messages', 'organization_id, thread_id'),
        ('idx_challenges_org_status', 'challenges', 'organization_id, status'),
        ('idx_loyalty_org_user', 'loyalty_transactions', 'organization_id, user_id, created_at DESC'),
        ('idx_notifications_org_user', 'notifications', 'organization_id, user_id, created_at DESC')
    LOOP
        -- Check if table exists and has organization_id
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tbl AND column_name = 'organization_id'
        ) THEN
            -- Check if index doesn't already exist
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE indexname = idx_name
            ) THEN
                EXECUTE format('CREATE INDEX %I ON %I (%s)', idx_name, tbl, cols);
                RAISE NOTICE 'Created index: %', idx_name;
            END IF;
        END IF;
    END LOOP;
END $$;

-- Phase 4: Update RLS policies for multi-tenancy
DO $$
DECLARE
    tbl TEXT;
BEGIN
    -- Update policies for key tables
    FOR tbl IN 
        SELECT unnest(ARRAY['events', 'social_posts', 'direct_messages', 'challenges', 'loyalty_transactions'])
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl) THEN
            -- Enable RLS if not already enabled
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
            
            -- Drop old policies if they exist
            EXECUTE format('DROP POLICY IF EXISTS "Users view %s" ON %I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Users create %s" ON %I', tbl, tbl);
            
            -- Create new multi-tenant policies
            EXECUTE format('
                CREATE POLICY "Users view org %s" ON %I
                FOR SELECT USING (
                    organization_id IN (
                        SELECT organization_id FROM organization_members
                        WHERE user_id = auth.uid()
                    )
                )', tbl, tbl);
            
            RAISE NOTICE 'Updated RLS policies for: %', tbl;
        END IF;
    END LOOP;
END $$;

-- Phase 5: Create helper functions
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_current_organization(UUID) TO authenticated;

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
    
    RAISE NOTICE '=== MULTI-TENANT MIGRATION COMPLETE ===';
    RAISE NOTICE 'Organizations: %', COALESCE(org_count, 0);
    RAISE NOTICE 'Members migrated: %', COALESCE(member_count, 0);
    RAISE NOTICE 'Tables with organization_id: %', COALESCE(table_count, 0);
    RAISE NOTICE '========================================';
END $$;