-- =====================================================
-- FIX ADMIN HIERARCHY - Simple Permission System
-- =====================================================

-- Update the is_platform_admin function to be more specific
-- Only YOU should be platform admin (super admin)
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only specific email addresses can be platform admin (YOU)
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_id 
        AND (
            email = 'your-email@example.com' OR
            email LIKE '%@yourdomain.com' OR
            email LIKE '%admin%' OR
            email LIKE '%owner%'
        )
        AND EXISTS (
            SELECT 1 FROM platform_admins 
            WHERE platform_admins.user_id = is_platform_admin.user_id 
            AND is_active = true
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the auto-assign function to be more restrictive
CREATE OR REPLACE FUNCTION auto_assign_platform_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-assign to very specific emails (YOU)
    IF NEW.email = 'your-email@example.com' OR 
       NEW.email LIKE '%@yourdomain.com' THEN
        
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

-- Create simpler organization admin check
-- This is for organization owners who can manage their own clubs
CREATE OR REPLACE FUNCTION is_organization_admin(user_id UUID, organization_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is owner of any organization or specific organization
    IF organization_id IS NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM organizations 
            WHERE owner_id = user_id
        );
    ELSE
        RETURN EXISTS (
            SELECT 1 FROM organizations 
            WHERE owner_id = user_id AND id = organization_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing is_admin function to use organization admin
CREATE OR REPLACE FUNCTION is_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- User is admin if they own an organization
    RETURN is_organization_admin(_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin dashboard data for organization owners
CREATE OR REPLACE FUNCTION get_organization_admin_data(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    org_data RECORD;
    member_count INTEGER;
    recent_activity INTEGER;
BEGIN
    -- Check if user is organization admin
    IF NOT is_organization_admin(user_id) THEN
        RAISE EXCEPTION 'Access denied: Organization admin role required';
    END IF;
    
    -- Get user's organization data
    SELECT o.*, p.full_name as owner_name
    INTO org_data
    FROM organizations o
    LEFT JOIN profiles p ON o.owner_id = p.id
    WHERE o.owner_id = user_id
    LIMIT 1;
    
    IF org_data IS NULL THEN
        RETURN jsonb_build_object('error', 'No organization found for user');
    END IF;
    
    -- Get member count
    SELECT COUNT(*) INTO member_count
    FROM organization_members om
    WHERE om.organization_id = org_data.id;
    
    -- Get recent activity (posts, events in last 7 days)
    SELECT COUNT(*) INTO recent_activity
    FROM (
        SELECT created_at FROM social_posts WHERE organization_id = org_data.id AND created_at > now() - interval '7 days'
        UNION ALL
        SELECT created_at FROM events WHERE organization_id = org_data.id AND created_at > now() - interval '7 days'
    ) activity;
    
    SELECT jsonb_build_object(
        'organization', jsonb_build_object(
            'id', org_data.id,
            'name', org_data.name,
            'slug', org_data.slug,
            'status', COALESCE(org_data.status, 'active'),
            'subscription_tier', COALESCE(org_data.subscription_tier, 'free'),
            'created_at', org_data.created_at,
            'owner_name', org_data.owner_name
        ),
        'stats', jsonb_build_object(
            'member_count', member_count,
            'recent_activity', recent_activity,
            'total_revenue_cents', COALESCE(org_data.total_revenue_cents, 0)
        ),
        'permissions', jsonb_build_object(
            'can_manage_members', true,
            'can_moderate_content', true,
            'can_manage_events', true,
            'can_view_analytics', true,
            'can_manage_billing', true
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for organization admins to get their members
CREATE OR REPLACE FUNCTION get_organization_members_for_admin(user_id UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    role TEXT,
    joined_at TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    is_active BOOLEAN
) AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Check if user is organization admin
    IF NOT is_organization_admin(user_id) THEN
        RAISE EXCEPTION 'Access denied: Organization admin role required';
    END IF;
    
    -- Get user's organization ID
    SELECT o.id INTO org_id
    FROM organizations o
    WHERE o.owner_id = user_id
    LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE EXCEPTION 'No organization found for user';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        COALESCE(p.full_name, 'Unknown') as full_name,
        au.email,
        COALESCE(om.role, 'member') as role,
        om.joined_at,
        p.last_seen,
        COALESCE(p.is_active, true) as is_active
    FROM organization_members om
    JOIN profiles p ON om.user_id = p.id
    JOIN auth.users au ON p.id = au.id
    WHERE om.organization_id = org_id
    ORDER BY om.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_organization_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_admin_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_members_for_admin(UUID) TO authenticated;

COMMENT ON FUNCTION is_organization_admin(UUID, UUID) IS 'Check if user is admin of their organization';
COMMENT ON FUNCTION get_organization_admin_data(UUID) IS 'Get admin dashboard data for organization owners';
COMMENT ON FUNCTION get_organization_members_for_admin(UUID) IS 'Get organization members for admin management';