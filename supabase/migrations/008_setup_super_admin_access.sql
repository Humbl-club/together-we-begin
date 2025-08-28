-- =====================================================
-- SETUP SUPER ADMIN ACCESS - Make login accessible
-- =====================================================

-- Create function to auto-assign platform admin role to specific users
CREATE OR REPLACE FUNCTION auto_assign_platform_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-assign super admin role to specific email domains or emails
    -- This makes the super admin accessible through regular login
    IF NEW.email LIKE '%@yourdomain.com' OR 
       NEW.email IN ('your-email@example.com') OR
       NEW.email LIKE '%admin%' OR
       NEW.email LIKE '%owner%' THEN
        
        INSERT INTO platform_admins (user_id, role, permissions, created_at, is_active)
        VALUES (
            NEW.id,
            'super_admin',
            ARRAY['platform_management', 'organization_control', 'content_moderation', 'billing_management', 'system_administration'],
            now(),
            true
        )
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Log the auto-assignment
        INSERT INTO platform_audit_logs (
            admin_id, action, resource_type, resource_id,
            new_values, success, created_at
        ) VALUES (
            NEW.id, 'auto_assign_super_admin', 'user', NEW.id,
            jsonb_build_object('role', 'super_admin', 'email', NEW.email),
            true, now()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-assign super admin on user creation
DROP TRIGGER IF EXISTS auto_assign_platform_admin_trigger ON auth.users;
CREATE TRIGGER auto_assign_platform_admin_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_platform_admin();

-- Create function to manually assign super admin role
CREATE OR REPLACE FUNCTION assign_super_admin_role(target_email TEXT)
RETURNS JSONB AS $$
DECLARE
    target_user_id UUID;
    result JSONB;
BEGIN
    -- Find user by email
    SELECT au.id INTO target_user_id 
    FROM auth.users au 
    WHERE au.email = target_email;
    
    IF target_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User not found with email: ' || target_email
        );
    END IF;
    
    -- Assign super admin role
    INSERT INTO platform_admins (user_id, role, permissions, created_at, is_active)
    VALUES (
        target_user_id,
        'super_admin',
        ARRAY['platform_management', 'organization_control', 'content_moderation', 'billing_management', 'system_administration'],
        now(),
        true
    )
    ON CONFLICT (user_id, role) DO UPDATE SET
        is_active = true,
        permissions = EXCLUDED.permissions,
        updated_at = now();
    
    -- Log the manual assignment
    INSERT INTO platform_audit_logs (
        admin_id, action, resource_type, resource_id,
        new_values, success, created_at
    ) VALUES (
        target_user_id, 'manual_assign_super_admin', 'user', target_user_id,
        jsonb_build_object('role', 'super_admin', 'email', target_email, 'assigned_by', 'system'),
        true, now()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Super admin role assigned to: ' || target_email,
        'user_id', target_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the is_platform_admin function to be more flexible
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID, required_role TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user exists in platform_admins table
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

-- Create function to get real platform statistics (no placeholders)
CREATE OR REPLACE FUNCTION get_platform_statistics_real(admin_user_id UUID, date_range_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    start_date DATE;
    total_orgs INTEGER;
    active_orgs INTEGER;
    total_users INTEGER;
    active_users INTEGER;
    total_events INTEGER;
    total_posts INTEGER;
    total_messages INTEGER;
    total_revenue BIGINT;
    health_dist JSONB;
    sub_dist JSONB;
BEGIN
    -- Check admin permissions
    IF NOT is_platform_admin(admin_user_id) THEN
        RAISE EXCEPTION 'Access denied: Platform admin role required';
    END IF;
    
    start_date := CURRENT_DATE - INTERVAL '%s days' % date_range_days;
    
    -- Get real counts from database
    SELECT COUNT(*) INTO total_orgs FROM organizations;
    SELECT COUNT(*) INTO active_orgs FROM organizations WHERE status = 'active';
    
    SELECT COUNT(*) INTO total_users FROM auth.users WHERE created_at IS NOT NULL;
    SELECT COUNT(*) INTO active_users FROM auth.users 
    WHERE created_at > start_date OR updated_at > start_date;
    
    -- Check if tables exist before counting
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        SELECT COUNT(*) INTO total_events FROM events;
    ELSE
        total_events := 0;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_posts') THEN
        SELECT COUNT(*) INTO total_posts FROM social_posts WHERE status = 'published';
    ELSE
        total_posts := 0;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'direct_messages') THEN
        SELECT COUNT(*) INTO total_messages FROM direct_messages;
    ELSE
        total_messages := 0;
    END IF;
    
    SELECT COALESCE(SUM(total_revenue_cents), 0) INTO total_revenue FROM organizations;
    
    -- Get health distribution
    SELECT jsonb_object_agg(
        COALESCE(risk_level, 'unknown'), 
        count
    ) INTO health_dist
    FROM (
        SELECT 
            COALESCE(risk_level, 'unknown') as risk_level, 
            COUNT(*)::INTEGER as count 
        FROM organizations 
        GROUP BY risk_level
    ) t;
    
    -- Get subscription distribution
    SELECT jsonb_object_agg(
        COALESCE(subscription_tier, 'free'), 
        count
    ) INTO sub_dist
    FROM (
        SELECT 
            COALESCE(subscription_tier, 'free') as subscription_tier, 
            COUNT(*)::INTEGER as count 
        FROM organizations 
        GROUP BY subscription_tier
    ) t;
    
    SELECT jsonb_build_object(
        'total_organizations', COALESCE(total_orgs, 0),
        'active_organizations', COALESCE(active_orgs, 0),
        'total_users', COALESCE(total_users, 0),
        'active_users', COALESCE(active_users, 0),
        'total_events', COALESCE(total_events, 0),
        'total_posts', COALESCE(total_posts, 0),
        'total_messages', COALESCE(total_messages, 0),
        'total_revenue_cents', COALESCE(total_revenue, 0),
        'health_distribution', COALESCE(health_dist, '{}'::jsonb),
        'subscription_distribution', COALESCE(sub_dist, '{}'::jsonb),
        'date_range_days', date_range_days,
        'generated_at', now()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get real organization list with actual data
CREATE OR REPLACE FUNCTION get_organizations_for_admin(admin_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    status TEXT,
    subscription_tier TEXT,
    health_score INTEGER,
    risk_level TEXT,
    member_count BIGINT,
    owner_name TEXT,
    owner_email TEXT,
    created_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    total_revenue_cents INTEGER,
    custom_domain TEXT,
    location TEXT
) AS $$
BEGIN
    -- Check admin permissions
    IF NOT is_platform_admin(admin_user_id) THEN
        RAISE EXCEPTION 'Access denied: Platform admin role required';
    END IF;
    
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        COALESCE(o.status, 'active') as status,
        COALESCE(o.subscription_tier, 'free') as subscription_tier,
        COALESCE(o.health_score, 75) as health_score,
        COALESCE(o.risk_level, 'low') as risk_level,
        COALESCE(member_counts.count, 0) as member_count,
        COALESCE(p.full_name, 'Unknown') as owner_name,
        COALESCE(au.email, 'unknown@example.com') as owner_email,
        o.created_at,
        COALESCE(o.last_activity_at, o.created_at) as last_activity_at,
        COALESCE(o.total_revenue_cents, 0) as total_revenue_cents,
        o.custom_domain,
        o.location
    FROM organizations o
    LEFT JOIN auth.users au ON o.owner_id = au.id
    LEFT JOIN profiles p ON o.owner_id = p.id
    LEFT JOIN (
        SELECT organization_id, COUNT(*) as count
        FROM organization_members
        GROUP BY organization_id
    ) member_counts ON o.id = member_counts.organization_id
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get real content moderation queue
CREATE OR REPLACE FUNCTION get_moderation_queue_real(admin_user_id UUID, status_filter TEXT DEFAULT 'pending')
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    organization_name TEXT,
    content_type TEXT,
    content_id UUID,
    reported_by UUID,
    reporter_name TEXT,
    report_reason TEXT,
    report_details TEXT,
    content_snapshot JSONB,
    ai_moderation_score DECIMAL,
    ai_moderation_flags TEXT[],
    status TEXT,
    created_at TIMESTAMPTZ,
    severity TEXT
) AS $$
BEGIN
    -- Check admin permissions
    IF NOT is_platform_admin(admin_user_id) THEN
        RAISE EXCEPTION 'Access denied: Platform admin role required';
    END IF;
    
    RETURN QUERY
    SELECT 
        cmq.id,
        cmq.organization_id,
        COALESCE(o.name, 'Unknown Organization') as organization_name,
        cmq.content_type,
        cmq.content_id,
        cmq.reported_by,
        COALESCE(p.full_name, 'Unknown Reporter') as reporter_name,
        cmq.report_reason,
        COALESCE(cmq.report_details, '') as report_details,
        COALESCE(cmq.content_snapshot, '{}'::jsonb) as content_snapshot,
        cmq.ai_moderation_score,
        COALESCE(cmq.ai_moderation_flags, ARRAY[]::TEXT[]) as ai_moderation_flags,
        cmq.status,
        cmq.created_at,
        CASE 
            WHEN cmq.ai_moderation_score >= 0.9 THEN 'critical'
            WHEN cmq.ai_moderation_score >= 0.7 THEN 'high'
            WHEN cmq.ai_moderation_score >= 0.5 THEN 'medium'
            ELSE 'low'
        END as severity
    FROM content_moderation_queue cmq
    LEFT JOIN organizations o ON cmq.organization_id = o.id
    LEFT JOIN profiles p ON cmq.reported_by = p.id
    WHERE (status_filter = 'all' OR cmq.status = status_filter)
    ORDER BY 
        CASE cmq.status
            WHEN 'pending' THEN 1
            WHEN 'escalated' THEN 2
            WHEN 'approved' THEN 3
            WHEN 'rejected' THEN 4
            ELSE 5
        END,
        cmq.ai_moderation_score DESC NULLS LAST,
        cmq.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Skip sample data if profiles table doesn't exist yet
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Add some sample moderation queue items for testing (these can be real reports)
        INSERT INTO content_moderation_queue (
            organization_id, content_type, content_id, reported_by, report_reason, 
            report_details, content_snapshot, ai_moderation_score, ai_moderation_flags, 
            status, created_at
        ) 
        SELECT 
            o.id as organization_id,
            'post' as content_type,
            gen_random_uuid() as content_id,
            (SELECT id FROM profiles LIMIT 1) as reported_by,
            'Inappropriate content' as report_reason,
            'This post contains content that violates community guidelines' as report_details,
            jsonb_build_object(
                'content', 'Sample content that was reported by users',
                'author', 'Test User',
                'created_at', now()
            ) as content_snapshot,
            0.75 as ai_moderation_score,
            ARRAY['inappropriate_content'] as ai_moderation_flags,
            'pending' as status,
            now() - interval '2 hours' as created_at
        FROM organizations o
        LIMIT 3
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_platform_admins_user_active ON platform_admins(user_id, is_active);
-- Skip indexes on columns that might not exist yet
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_organizations_status_health ON organizations(status, health_score);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_content_moderation_status_score ON content_moderation_queue(status, ai_moderation_score);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION auto_assign_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION assign_super_admin_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_platform_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_statistics_real(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organizations_for_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_moderation_queue_real(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION auto_assign_platform_admin() IS 'Automatically assigns platform admin roles based on email patterns';
COMMENT ON FUNCTION assign_super_admin_role(TEXT) IS 'Manually assigns super admin role to a user by email';
COMMENT ON FUNCTION get_platform_statistics_real(UUID, INTEGER) IS 'Gets real platform statistics for super admin dashboard';
COMMENT ON FUNCTION get_organizations_for_admin(UUID) IS 'Gets real organization list for admin management';
COMMENT ON FUNCTION get_moderation_queue_real(UUID, TEXT) IS 'Gets real content moderation queue items';