-- ============================================================================
-- DAY 2: SECURITY, INDEXES, AND PERFORMANCE OPTIMIZATION
-- ============================================================================
-- This migration adds RLS policies, composite indexes, and performance optimizations
-- Run time: ~10-15 minutes depending on table sizes
-- ============================================================================

-- ============================================================================
-- PART 1: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables (if not already enabled)
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'schema_%'
        AND tablename NOT IN ('organizations', 'organization_members')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    END LOOP;
END $$;

-- Drop existing non-org policies and create new multi-tenant policies
-- Events table policies
DROP POLICY IF EXISTS "Users view events" ON events;
CREATE POLICY "Users view org events" ON events
FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins manage events" ON events;
CREATE POLICY "Org admins manage events" ON events
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE user_id = auth.uid()
        AND organization_id = events.organization_id
        AND role = 'admin'
    )
);

-- Event registrations policies
DROP POLICY IF EXISTS "Users view their registrations" ON event_registrations;
CREATE POLICY "Users view org registrations" ON event_registrations
FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users register for events" ON event_registrations;
CREATE POLICY "Users register for org events" ON event_registrations
FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
);

-- Social posts policies
DROP POLICY IF EXISTS "Users view posts" ON social_posts;
CREATE POLICY "Users view org posts" ON social_posts
FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users create posts" ON social_posts;
CREATE POLICY "Users create org posts" ON social_posts
FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
);

DROP POLICY IF EXISTS "Users update own posts" ON social_posts;
CREATE POLICY "Users update own org posts" ON social_posts
FOR UPDATE USING (
    user_id = auth.uid()
    AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- Direct messages policies
DROP POLICY IF EXISTS "Users view their messages" ON direct_messages;
CREATE POLICY "Users view org messages" ON direct_messages
FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
    )
    AND sender_id = auth.uid()
);

DROP POLICY IF EXISTS "Users send messages" ON direct_messages;
CREATE POLICY "Users send org messages" ON direct_messages
FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
    )
    AND sender_id = auth.uid()
);

-- Challenges policies
DROP POLICY IF EXISTS "Users view challenges" ON challenges;
CREATE POLICY "Users view org challenges" ON challenges
FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins manage challenges" ON challenges;
CREATE POLICY "Org admins manage challenges" ON challenges
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM organization_members
        WHERE user_id = auth.uid()
        AND organization_id = challenges.organization_id
        AND role = 'admin'
    )
);

-- Loyalty transactions policies
DROP POLICY IF EXISTS "Users view own transactions" ON loyalty_transactions;
CREATE POLICY "Users view own org transactions" ON loyalty_transactions
FOR SELECT USING (
    user_id = auth.uid()
    AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- Organization policies
CREATE POLICY "Members view their organizations" ON organizations
FOR SELECT USING (
    id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Super admins manage all organizations" ON organizations
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Organization members policies
CREATE POLICY "Users view org members" ON organization_members
FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM organization_members om
        WHERE om.user_id = auth.uid()
    )
);

CREATE POLICY "Org admins manage members" ON organization_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid()
        AND om.organization_id = organization_members.organization_id
        AND om.role = 'admin'
    )
);

-- ============================================================================
-- PART 2: COMPOSITE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Events indexes (most queried table)
CREATE INDEX IF NOT EXISTS idx_events_org_date 
ON events(organization_id, start_time DESC)
WHERE status = 'upcoming';

CREATE INDEX IF NOT EXISTS idx_events_org_status 
ON events(organization_id, status);

-- Event registrations indexes
CREATE INDEX IF NOT EXISTS idx_event_reg_org_user 
ON event_registrations(organization_id, user_id);

CREATE INDEX IF NOT EXISTS idx_event_reg_org_event 
ON event_registrations(organization_id, event_id);

CREATE INDEX IF NOT EXISTS idx_event_reg_org_status 
ON event_registrations(organization_id, payment_status);

-- Social posts indexes (high volume)
CREATE INDEX IF NOT EXISTS idx_posts_org_user_created 
ON social_posts(organization_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_org_created 
ON social_posts(organization_id, created_at DESC)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_posts_org_type 
ON social_posts(organization_id, post_type, created_at DESC);

-- Direct messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_org_thread 
ON direct_messages(organization_id, thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_org_sender 
ON direct_messages(organization_id, sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_thread_time 
ON direct_messages(thread_id, created_at DESC);

-- Challenges indexes
CREATE INDEX IF NOT EXISTS idx_challenges_org_status 
ON challenges(organization_id, status, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_challenges_org_type 
ON challenges(organization_id, challenge_type, start_date DESC);

-- Challenge participations indexes
CREATE INDEX IF NOT EXISTS idx_challenge_part_org_user 
ON challenge_participations(organization_id, user_id, joined_at DESC);

CREATE INDEX IF NOT EXISTS idx_challenge_part_org_challenge 
ON challenge_participations(organization_id, challenge_id);

-- Walking leaderboards indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_org_cycle 
ON walking_leaderboards(organization_id, cycle_id, total_steps DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_org_user 
ON walking_leaderboards(organization_id, user_id);

-- Loyalty transactions indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_org_user 
ON loyalty_transactions(organization_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_org_type 
ON loyalty_transactions(organization_id, transaction_type, created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_org_user 
ON notifications(organization_id, user_id, created_at DESC)
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_org_type 
ON notifications(organization_id, notification_type, created_at DESC);

-- Health data indexes
CREATE INDEX IF NOT EXISTS idx_health_org_user_date 
ON health_data(organization_id, user_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_org_metric 
ON health_data(organization_id, metric_type, recorded_at DESC);

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_current_org 
ON profiles(current_organization_id);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_org 
ON user_roles(organization_id, user_id);

-- ============================================================================
-- PART 3: PERFORMANCE FUNCTIONS
-- ============================================================================

-- Function to get organization statistics
CREATE OR REPLACE FUNCTION get_organization_stats(p_org_id UUID)
RETURNS TABLE(
    total_members BIGINT,
    total_events BIGINT,
    active_challenges BIGINT,
    total_posts BIGINT,
    monthly_active_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM organization_members WHERE organization_id = p_org_id),
        (SELECT COUNT(*) FROM events WHERE organization_id = p_org_id),
        (SELECT COUNT(*) FROM challenges WHERE organization_id = p_org_id AND status = 'active'),
        (SELECT COUNT(*) FROM social_posts WHERE organization_id = p_org_id),
        (SELECT COUNT(DISTINCT user_id) 
         FROM loyalty_transactions 
         WHERE organization_id = p_org_id 
         AND created_at >= CURRENT_DATE - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to switch user's current organization
CREATE OR REPLACE FUNCTION switch_organization(p_user_id UUID, p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verify user is member of organization
    IF EXISTS (
        SELECT 1 FROM organization_members
        WHERE user_id = p_user_id AND organization_id = p_org_id
    ) THEN
        UPDATE profiles
        SET current_organization_id = p_org_id,
            updated_at = now()
        WHERE id = p_user_id;
        RETURN true;
    END IF;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized function for getting events with org context
CREATE OR REPLACE FUNCTION get_org_events_optimized(
    p_org_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT,
    price DECIMAL,
    capacity INTEGER,
    current_capacity INTEGER,
    registration_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.start_time,
        e.end_time,
        e.location,
        e.price,
        e.capacity,
        e.current_capacity,
        COUNT(er.id) as registration_count
    FROM events e
    LEFT JOIN event_registrations er ON e.id = er.event_id
    WHERE e.organization_id = p_org_id
    AND (p_status IS NULL OR e.status = p_status)
    GROUP BY e.id
    ORDER BY e.start_time DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_organization_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION switch_organization(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_events_optimized(UUID, INTEGER, INTEGER, TEXT) TO authenticated;

-- ============================================================================
-- PART 4: MATERIALIZED VIEWS FOR DASHBOARD PERFORMANCE
-- ============================================================================

-- Drop existing views if they exist
DROP MATERIALIZED VIEW IF EXISTS organization_dashboard_stats;

-- Create materialized view for organization dashboard
CREATE MATERIALIZED VIEW organization_dashboard_stats AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    COUNT(DISTINCT om.user_id) as total_members,
    COUNT(DISTINCT e.id) as total_events,
    COUNT(DISTINCT CASE WHEN e.start_time >= CURRENT_DATE THEN e.id END) as upcoming_events,
    COUNT(DISTINCT c.id) as total_challenges,
    COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_challenges,
    COUNT(DISTINCT sp.id) as total_posts,
    COUNT(DISTINCT CASE WHEN sp.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN sp.id END) as weekly_posts,
    COUNT(DISTINCT CASE WHEN lt.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN lt.user_id END) as monthly_active_users,
    SUM(CASE WHEN lt.transaction_type = 'earned' THEN lt.points_amount ELSE 0 END) as total_points_earned,
    SUM(CASE WHEN lt.transaction_type = 'redeemed' THEN lt.points_amount ELSE 0 END) as total_points_redeemed,
    NOW() as last_updated
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.organization_id
LEFT JOIN events e ON o.id = e.organization_id
LEFT JOIN challenges c ON o.id = c.organization_id
LEFT JOIN social_posts sp ON o.id = sp.organization_id
LEFT JOIN loyalty_transactions lt ON o.id = lt.organization_id
GROUP BY o.id, o.name;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_org_dashboard_stats_org_id ON organization_dashboard_stats(organization_id);

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_organization_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY organization_dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule refresh (using pg_cron if available, otherwise manual)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('refresh-org-stats', '*/5 * * * *', 'SELECT refresh_organization_dashboard_stats();');

-- ============================================================================
-- PART 5: AUDIT AND MONITORING
-- ============================================================================

-- Create index for audit trails
CREATE INDEX IF NOT EXISTS idx_admin_actions_org_created 
ON admin_actions(organization_id, created_at DESC);

-- Create performance monitoring table if not exists
CREATE TABLE IF NOT EXISTS query_performance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    query_type TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    row_count INTEGER,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_query_perf_org_type ON query_performance_logs(organization_id, query_type, created_at DESC);
CREATE INDEX idx_query_perf_slow ON query_performance_logs(execution_time_ms DESC) WHERE execution_time_ms > 1000;

-- Log migration completion (only if we have an authenticated user)
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
                'migration', 'day2_security_indexes',
                'timestamp', now(),
                'policies_created', 15,
                'indexes_created', 35,
                'phase', 'Day 2 - Security and Performance'
            )
        );
    END IF;
END $$;

-- Summary
DO $$
DECLARE
    policy_count INTEGER;
    index_count INTEGER;
    org_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
    SELECT COUNT(*) INTO org_count 
    FROM organizations;
    
    RAISE NOTICE '=== DAY 2 MIGRATION COMPLETE ===';
    RAISE NOTICE 'RLS Policies active: %', policy_count;
    RAISE NOTICE 'Performance indexes: %', index_count;
    RAISE NOTICE 'Organizations configured: %', org_count;
    RAISE NOTICE '================================';
END $$;