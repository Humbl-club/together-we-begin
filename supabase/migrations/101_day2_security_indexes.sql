-- ============================================================================
-- PRODUCTION-READY SECURITY & PERFORMANCE MIGRATION
-- ============================================================================
-- Only includes RLS policies and indexes for tables that exist in production
-- ============================================================================

-- ============================================================================
-- PART 1: ROW LEVEL SECURITY (RLS) POLICIES FOR EXISTING TABLES
-- ============================================================================

-- Enable RLS on core tables that exist
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Events policies
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

CREATE POLICY "Admins manage all organizations" ON organizations
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
-- PART 2: PERFORMANCE INDEXES FOR EXISTING TABLES
-- ============================================================================

-- Events indexes (core table)
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

-- Social posts indexes (high volume)
CREATE INDEX IF NOT EXISTS idx_posts_org_user_created 
ON social_posts(organization_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_org_created 
ON social_posts(organization_id, created_at DESC)
WHERE status = 'active';

-- Challenges indexes
CREATE INDEX IF NOT EXISTS idx_challenges_org_status 
ON challenges(organization_id, status, start_date DESC);

-- Challenge participations indexes
CREATE INDEX IF NOT EXISTS idx_challenge_part_org_user 
ON challenge_participations(organization_id, user_id, joined_at DESC);

CREATE INDEX IF NOT EXISTS idx_challenge_part_org_challenge 
ON challenge_participations(organization_id, challenge_id);

-- Loyalty transactions indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_org_user 
ON loyalty_transactions(organization_id, user_id, created_at DESC);

-- Post interactions indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_org_user 
ON post_likes(organization_id, user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_org_post 
ON post_comments(organization_id, post_id, created_at DESC);

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_current_org 
ON profiles(current_organization_id);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_org 
ON user_roles(organization_id, user_id);

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
    
    RAISE NOTICE '=== PRODUCTION SECURITY MIGRATION COMPLETE ===';
    RAISE NOTICE 'RLS Policies active: %', policy_count;
    RAISE NOTICE 'Performance indexes: %', index_count;
    RAISE NOTICE 'Organizations configured: %', org_count;
    RAISE NOTICE '=============================================';
END $$;
