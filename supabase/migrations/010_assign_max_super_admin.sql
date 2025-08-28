-- =====================================================
-- ASSIGN SUPER ADMIN TO MAX.HUFSCHLAG@GOOGLEMAIL.COM
-- =====================================================

-- Update the auto-assign function to include Max's email
CREATE OR REPLACE FUNCTION auto_assign_platform_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-assign super admin to Max
    IF NEW.email = 'max.hufschlag@googlemail.com' THEN
        
        INSERT INTO platform_admins (user_id, role, permissions, created_at, is_active)
        VALUES (
            NEW.id,
            'super_admin',
            ARRAY['platform_management', 'organization_control', 'content_moderation', 'billing_management', 'system_administration'],
            now(),
            true
        )
        ON CONFLICT (user_id, role) DO UPDATE SET
            is_active = true,
            permissions = EXCLUDED.permissions,
            last_active_at = now();
        
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

-- Update is_platform_admin to recognize Max's email
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is Max (platform owner)
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_id 
        AND email = 'max.hufschlag@googlemail.com'
    ) OR EXISTS (
        SELECT 1 FROM platform_admins 
        WHERE platform_admins.user_id = is_platform_admin.user_id 
        AND role = 'super_admin'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manually assign super admin to Max if user already exists
DO $$
DECLARE
    max_user_id UUID;
BEGIN
    -- Find Max's user ID
    SELECT id INTO max_user_id 
    FROM auth.users 
    WHERE email = 'max.hufschlag@googlemail.com';
    
    IF max_user_id IS NOT NULL THEN
        -- Assign super admin role
        INSERT INTO platform_admins (user_id, role, permissions, created_at, is_active)
        VALUES (
            max_user_id,
            'super_admin',
            ARRAY['platform_management', 'organization_control', 'content_moderation', 'billing_management', 'system_administration'],
            now(),
            true
        )
        ON CONFLICT (user_id, role) DO UPDATE SET
            is_active = true,
            permissions = EXCLUDED.permissions,
            last_active_at = now();
        
        -- Log the assignment
        INSERT INTO platform_audit_logs (
            admin_id, action, resource_type, resource_id,
            new_values, success, created_at
        ) VALUES (
            max_user_id, 'manual_assign_super_admin', 'user', max_user_id,
            jsonb_build_object('role', 'super_admin', 'email', 'max.hufschlag@googlemail.com', 'note', 'Platform owner assignment'),
            true, now()
        );
        
        RAISE NOTICE 'Super admin role assigned to max.hufschlag@googlemail.com';
    ELSE
        RAISE NOTICE 'User max.hufschlag@googlemail.com not found. Role will be assigned on first login.';
    END IF;
END $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION auto_assign_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_platform_admin(UUID) TO authenticated;

COMMENT ON FUNCTION is_platform_admin(UUID) IS 'Check if user is platform admin - Max is always super admin';