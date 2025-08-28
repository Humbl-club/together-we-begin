-- =====================================================
-- SUPER ADMIN SYSTEM - Multi-Tenant Platform Management
-- =====================================================

-- Create platform_admins table for super admin roles
CREATE TABLE platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'platform_moderator', 'billing_admin', 'support_admin')),
    permissions TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_active_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, role)
);

-- Create platform_analytics table for cross-organization metrics
CREATE TABLE platform_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN (
        'daily_active_users', 'monthly_active_users', 'new_signups', 'churn_rate',
        'total_events', 'total_posts', 'total_messages', 'total_challenges',
        'revenue', 'subscription_changes', 'storage_usage', 'api_calls'
    )),
    total_value BIGINT NOT NULL DEFAULT 0,
    organization_breakdown JSONB DEFAULT '{}',
    additional_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(date, metric_type)
);

-- Create organization_health_scores table for monitoring
CREATE TABLE organization_health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    engagement_score INTEGER NOT NULL CHECK (engagement_score >= 0 AND engagement_score <= 100),
    growth_score INTEGER NOT NULL CHECK (growth_score >= 0 AND growth_score <= 100),
    retention_score INTEGER NOT NULL CHECK (retention_score >= 0 AND retention_score <= 100),
    content_quality_score INTEGER NOT NULL CHECK (content_quality_score >= 0 AND content_quality_score <= 100),
    technical_health_score INTEGER NOT NULL CHECK (technical_health_score >= 0 AND technical_health_score <= 100),
    risk_factors TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(organization_id, date)
);

-- Create platform_billing table for subscription management
CREATE TABLE platform_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
    trial_ends_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create platform_feature_flags table for A/B testing and rollouts
CREATE TABLE platform_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_organizations UUID[] DEFAULT '{}',
    target_user_segments TEXT[] DEFAULT '{}',
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create platform_incidents table for system monitoring
CREATE TABLE platform_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
    affected_organizations UUID[] DEFAULT '{}',
    affected_services TEXT[] DEFAULT '{}',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    root_cause TEXT,
    resolution_notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create content_moderation_queue table for platform-wide content review
CREATE TABLE content_moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message', 'profile', 'event', 'challenge')),
    content_id UUID NOT NULL,
    reported_by UUID REFERENCES auth.users(id),
    report_reason TEXT NOT NULL,
    report_details TEXT,
    content_snapshot JSONB NOT NULL,
    ai_moderation_score DECIMAL(3,2),
    ai_moderation_flags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')) DEFAULT 'pending',
    moderator_id UUID REFERENCES auth.users(id),
    moderator_notes TEXT,
    moderated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for content_moderation_queue
CREATE INDEX idx_moderation_queue_status_created ON content_moderation_queue (status, created_at);
CREATE INDEX idx_moderation_queue_org_type ON content_moderation_queue (organization_id, content_type);

-- Create system_configurations table for platform settings
CREATE TABLE system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN NOT NULL DEFAULT false,
    environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')) DEFAULT 'production',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create platform_audit_logs table for comprehensive tracking
CREATE TABLE platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for platform_audit_logs
CREATE INDEX idx_audit_logs_admin_created ON platform_audit_logs (admin_id, created_at);
CREATE INDEX idx_audit_logs_org_created ON platform_audit_logs (organization_id, created_at);
CREATE INDEX idx_audit_logs_action_created ON platform_audit_logs (action, created_at);

-- =====================================================
-- ENHANCED ORGANIZATION MANAGEMENT
-- =====================================================

-- Add additional columns to organizations table for enhanced management
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 75 CHECK (health_score >= 0 AND health_score <= 100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS total_revenue_cents INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_enabled BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS api_enabled BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS compliance_status TEXT DEFAULT 'compliant' CHECK (compliance_status IN ('compliant', 'warning', 'violation', 'suspended'));

-- =====================================================
-- RPC FUNCTIONS FOR SUPER ADMIN OPERATIONS
-- =====================================================

-- Function to check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID, required_role TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    IF required_role IS NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM platform_admins 
            WHERE platform_admins.user_id = is_platform_admin.user_id 
            AND is_active = true
        );
    ELSE
        RETURN EXISTS (
            SELECT 1 FROM platform_admins 
            WHERE platform_admins.user_id = is_platform_admin.user_id 
            AND role = required_role 
            AND is_active = true
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get platform-wide statistics
CREATE OR REPLACE FUNCTION get_platform_statistics(admin_user_id UUID, date_range_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    start_date DATE;
BEGIN
    -- Check admin permissions
    IF NOT is_platform_admin(admin_user_id) THEN
        RAISE EXCEPTION 'Access denied: Platform admin role required';
    END IF;
    
    start_date := CURRENT_DATE - INTERVAL '%s days' % date_range_days;
    
    SELECT jsonb_build_object(
        'total_organizations', (SELECT COUNT(*) FROM organizations),
        'active_organizations', (SELECT COUNT(*) FROM organizations WHERE last_activity_at > start_date),
        'total_users', (SELECT COUNT(*) FROM profiles),
        'active_users', (SELECT COUNT(*) FROM profiles WHERE last_seen_at > start_date),
        'total_events', (SELECT COUNT(*) FROM events),
        'total_posts', (SELECT COUNT(*) FROM social_posts),
        'total_messages', (SELECT COUNT(*) FROM direct_messages),
        'total_revenue_cents', (SELECT COALESCE(SUM(total_revenue_cents), 0) FROM organizations),
        'health_distribution', (
            SELECT jsonb_object_agg(
                risk_level, 
                count
            )
            FROM (
                SELECT risk_level, COUNT(*) as count 
                FROM organizations 
                GROUP BY risk_level
            ) t
        ),
        'subscription_distribution', (
            SELECT jsonb_object_agg(
                subscription_tier, 
                count
            )
            FROM (
                SELECT subscription_tier, COUNT(*) as count 
                FROM organizations 
                GROUP BY subscription_tier
            ) t
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization details for admin
CREATE OR REPLACE FUNCTION get_organization_admin_details(admin_user_id UUID, org_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    org_record RECORD;
BEGIN
    -- Check admin permissions
    IF NOT is_platform_admin(admin_user_id) THEN
        RAISE EXCEPTION 'Access denied: Platform admin role required';
    END IF;
    
    SELECT * INTO org_record FROM organizations WHERE id = org_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organization not found';
    END IF;
    
    SELECT jsonb_build_object(
        'organization', to_jsonb(org_record),
        'member_count', (SELECT COUNT(*) FROM organization_members WHERE organization_id = org_id),
        'admin_count', (SELECT COUNT(*) FROM organization_members WHERE organization_id = org_id AND role IN ('owner', 'admin')),
        'recent_activity', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'type', 'event',
                    'title', title,
                    'date', created_at
                )
            )
            FROM events 
            WHERE organization_id = org_id 
            ORDER BY created_at DESC 
            LIMIT 10
        ),
        'billing_info', (
            SELECT to_jsonb(pb.*) 
            FROM platform_billing pb 
            WHERE pb.organization_id = org_id 
            ORDER BY created_at DESC 
            LIMIT 1
        ),
        'health_score', (
            SELECT to_jsonb(ohs.*) 
            FROM organization_health_scores ohs 
            WHERE ohs.organization_id = org_id 
            ORDER BY date DESC 
            LIMIT 1
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update organization status (suspend/activate)
CREATE OR REPLACE FUNCTION update_organization_status(
    admin_user_id UUID, 
    org_id UUID, 
    new_status TEXT,
    reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    old_status TEXT;
    org_name TEXT;
BEGIN
    -- Check admin permissions
    IF NOT is_platform_admin(admin_user_id, 'super_admin') THEN
        RAISE EXCEPTION 'Access denied: Super admin role required';
    END IF;
    
    -- Get current status
    SELECT status, name INTO old_status, org_name FROM organizations WHERE id = org_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organization not found';
    END IF;
    
    -- Update organization status
    UPDATE organizations 
    SET status = new_status, updated_at = now()
    WHERE id = org_id;
    
    -- Log the action
    INSERT INTO platform_audit_logs (
        admin_id, organization_id, action, resource_type, resource_id,
        old_values, new_values
    ) VALUES (
        admin_user_id, org_id, 'update_organization_status', 'organization', org_id,
        jsonb_build_object('status', old_status),
        jsonb_build_object('status', new_status, 'reason', reason)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'organization_id', org_id,
        'organization_name', org_name,
        'old_status', old_status,
        'new_status', new_status,
        'updated_at', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate and update health scores
CREATE OR REPLACE FUNCTION calculate_organization_health_scores()
RETURNS INTEGER AS $$
DECLARE
    org_record RECORD;
    health_score INTEGER;
    engagement_score INTEGER;
    growth_score INTEGER;
    retention_score INTEGER;
    content_quality_score INTEGER;
    technical_health_score INTEGER;
    updated_count INTEGER := 0;
BEGIN
    FOR org_record IN SELECT * FROM organizations LOOP
        -- Calculate engagement score (0-100)
        SELECT LEAST(100, GREATEST(0, 
            COALESCE(
                (SELECT COUNT(*) FROM social_posts WHERE organization_id = org_record.id AND created_at > CURRENT_DATE - INTERVAL '7 days') * 5 +
                (SELECT COUNT(*) FROM events WHERE organization_id = org_record.id AND created_at > CURRENT_DATE - INTERVAL '30 days') * 2 +
                (SELECT COUNT(*) FROM organization_members WHERE organization_id = org_record.id AND joined_at > CURRENT_DATE - INTERVAL '30 days') * 3
            , 0)
        )) INTO engagement_score;
        
        -- Calculate growth score (0-100)
        SELECT LEAST(100, GREATEST(0,
            COALESCE(
                (SELECT COUNT(*) FROM organization_members WHERE organization_id = org_record.id AND joined_at > CURRENT_DATE - INTERVAL '30 days') * 10
            , 0)
        )) INTO growth_score;
        
        -- Calculate retention score (0-100)
        SELECT LEAST(100, GREATEST(0,
            COALESCE(
                (SELECT COUNT(*) FROM profiles p 
                 JOIN organization_members om ON p.id = om.user_id 
                 WHERE om.organization_id = org_record.id AND p.last_seen_at > CURRENT_DATE - INTERVAL '7 days') * 2
            , 0)
        )) INTO retention_score;
        
        -- Calculate content quality score (0-100) - simplified
        content_quality_score := 80; -- Placeholder
        
        -- Calculate technical health score (0-100) - simplified
        technical_health_score := 90; -- Placeholder
        
        -- Calculate overall health score
        health_score := (
            engagement_score * 0.3 +
            growth_score * 0.2 +
            retention_score * 0.3 +
            content_quality_score * 0.1 +
            technical_health_score * 0.1
        )::INTEGER;
        
        -- Insert or update health score record
        INSERT INTO organization_health_scores (
            organization_id, date, overall_score, engagement_score, 
            growth_score, retention_score, content_quality_score, technical_health_score
        ) VALUES (
            org_record.id, CURRENT_DATE, health_score, engagement_score,
            growth_score, retention_score, content_quality_score, technical_health_score
        )
        ON CONFLICT (organization_id, date) 
        DO UPDATE SET
            overall_score = EXCLUDED.overall_score,
            engagement_score = EXCLUDED.engagement_score,
            growth_score = EXCLUDED.growth_score,
            retention_score = EXCLUDED.retention_score,
            content_quality_score = EXCLUDED.content_quality_score,
            technical_health_score = EXCLUDED.technical_health_score,
            created_at = now();
        
        -- Update organization health score
        UPDATE organizations 
        SET health_score = calculate_organization_health_scores.health_score,
            risk_level = CASE 
                WHEN calculate_organization_health_scores.health_score >= 80 THEN 'low'
                WHEN calculate_organization_health_scores.health_score >= 60 THEN 'medium'
                WHEN calculate_organization_health_scores.health_score >= 40 THEN 'high'
                ELSE 'critical'
            END
        WHERE id = org_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_audit_logs ENABLE ROW LEVEL SECURITY;

-- Platform admin policies - only platform admins can access
CREATE POLICY "platform_admins_access" ON platform_admins
    FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "platform_analytics_access" ON platform_analytics
    FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "organization_health_scores_access" ON organization_health_scores
    FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "platform_billing_access" ON platform_billing
    FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "platform_feature_flags_access" ON platform_feature_flags
    FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "platform_incidents_access" ON platform_incidents
    FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "content_moderation_queue_access" ON content_moderation_queue
    FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "system_configurations_access" ON system_configurations
    FOR ALL USING (is_platform_admin(auth.uid()));

CREATE POLICY "platform_audit_logs_access" ON platform_audit_logs
    FOR ALL USING (is_platform_admin(auth.uid()));

-- =====================================================
-- INITIAL DATA AND SETUP
-- =====================================================

-- Insert default system configurations
INSERT INTO system_configurations (key, value, description) VALUES
    ('max_organizations_per_user', '5', 'Maximum number of organizations a single user can own'),
    ('default_member_limit', '50', 'Default member limit for new organizations'),
    ('feature_flag_refresh_interval', '300', 'Seconds between feature flag checks'),
    ('health_score_calculation_hour', '2', 'Hour of day (UTC) to calculate health scores'),
    ('content_moderation_ai_threshold', '0.8', 'AI confidence threshold for auto-moderation'),
    ('billing_grace_period_days', '7', 'Days before suspending overdue accounts'),
    ('data_retention_days', '2555', 'Days to retain deleted data (7 years)'),
    ('max_api_calls_per_hour', '1000', 'Rate limit for organization API calls')
ON CONFLICT (key) DO NOTHING;

-- Insert default feature flags
INSERT INTO platform_feature_flags (name, description, is_enabled, rollout_percentage) VALUES
    ('advanced_analytics', 'Advanced analytics dashboard for organizations', true, 100),
    ('custom_branding', 'Allow organizations to customize branding', true, 100),
    ('api_access', 'Organization API access', false, 0),
    ('sso_integration', 'Single sign-on integration', false, 10),
    ('ai_content_moderation', 'AI-powered content moderation', true, 50),
    ('webhook_notifications', 'Webhook notifications for events', false, 25)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_analytics_date_type ON platform_analytics(date, metric_type);
CREATE INDEX IF NOT EXISTS idx_organization_health_scores_org_date ON organization_health_scores(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_platform_billing_org_status ON platform_billing(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_organizations_health_risk ON organizations(health_score, risk_level);
CREATE INDEX IF NOT EXISTS idx_organizations_activity ON organizations(last_activity_at);

COMMENT ON TABLE platform_admins IS 'Platform-wide administrative users with various permission levels';
COMMENT ON TABLE platform_analytics IS 'Cross-organization analytics and metrics for platform oversight';
COMMENT ON TABLE organization_health_scores IS 'Health and engagement scoring for organizations';
COMMENT ON TABLE platform_billing IS 'Subscription and billing information for organizations';
COMMENT ON TABLE platform_feature_flags IS 'Feature flags for A/B testing and gradual rollouts';
COMMENT ON TABLE platform_incidents IS 'System incidents and status tracking';
COMMENT ON TABLE content_moderation_queue IS 'Platform-wide content moderation queue';
COMMENT ON TABLE system_configurations IS 'System-wide configuration settings';
COMMENT ON TABLE platform_audit_logs IS 'Comprehensive audit trail for all admin actions';