-- Make Max Hufschlag a Super Admin
-- Email: max.hufschlag@googlemail.com
-- User ID: 71f538b8-c7ce-4f52-b9da-87ea7f6458b4

BEGIN;

-- Insert or update the platform_admins record
INSERT INTO platform_admins (
    user_id,
    role,
    is_active,
    permissions,
    created_at,
    created_by,
    notes
) VALUES (
    '71f538b8-c7ce-4f52-b9da-87ea7f6458b4'::uuid,
    'super_admin',
    true,
    jsonb_build_object(
        'all_access', true,
        'can_manage_organizations', true,
        'can_manage_users', true,
        'can_manage_billing', true,
        'can_manage_platform', true,
        'can_view_analytics', true,
        'can_manage_features', true,
        'can_access_all_orgs', true
    ),
    NOW(),
    '71f538b8-c7ce-4f52-b9da-87ea7f6458b4'::uuid, -- Self-assigned
    'Max Hufschlag - Platform Super Admin'
)
ON CONFLICT (user_id) 
DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    permissions = jsonb_build_object(
        'all_access', true,
        'can_manage_organizations', true,
        'can_manage_users', true,
        'can_manage_billing', true,
        'can_manage_platform', true,
        'can_view_analytics', true,
        'can_manage_features', true,
        'can_access_all_orgs', true
    ),
    updated_at = NOW(),
    notes = 'Max Hufschlag - Platform Super Admin (Updated)';

-- Also ensure the user has a profile record
INSERT INTO profiles (
    id,
    updated_at,
    full_name,
    avatar_url,
    bio
) VALUES (
    '71f538b8-c7ce-4f52-b9da-87ea7f6458b4'::uuid,
    NOW(),
    'Max Hufschlag',
    null,
    'Platform Super Administrator'
)
ON CONFLICT (id) 
DO UPDATE SET
    updated_at = NOW();

-- Log this action in platform_audit_logs
INSERT INTO platform_audit_logs (
    id,
    admin_id,
    action_type,
    target_type,
    target_id,
    action_details,
    ip_address,
    user_agent,
    created_at
) VALUES (
    gen_random_uuid(),
    '71f538b8-c7ce-4f52-b9da-87ea7f6458b4'::uuid,
    'grant_super_admin',
    'user',
    '71f538b8-c7ce-4f52-b9da-87ea7f6458b4'::uuid,
    jsonb_build_object(
        'email', 'max.hufschlag@googlemail.com',
        'role', 'super_admin',
        'reason', 'Initial platform setup',
        'granted_by', 'System Administrator'
    ),
    '127.0.0.1',
    'CLI/Script',
    NOW()
);

COMMIT;

-- Verify the assignment
SELECT 
    pa.*,
    p.full_name,
    p.updated_at as profile_updated
FROM platform_admins pa
JOIN profiles p ON p.id = pa.user_id
WHERE pa.user_id = '71f538b8-c7ce-4f52-b9da-87ea7f6458b4'::uuid;