-- ============================================================================
-- EMERGENCY REPAIR SCRIPT - MISSING CRITICAL TABLES ONLY
-- ============================================================================
-- This script creates ONLY the missing critical tables needed for the app to start
-- Execute this immediately in Supabase SQL Editor
-- ============================================================================

-- Create organizations table (missing)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_tier TEXT DEFAULT 'enterprise',
  subscription_status TEXT DEFAULT 'active',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  max_members INTEGER DEFAULT 10000,
  settings JSONB DEFAULT '{"theme": "default", "features": ["events", "challenges", "social", "loyalty", "messaging"]}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization members table (missing)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  UNIQUE(organization_id, user_id)
);

-- Create organization features table
CREATE TABLE IF NOT EXISTS organization_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}',
  UNIQUE(organization_id, feature_key)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_features_org ON organization_features(organization_id);

-- Add organization_id columns to existing tables (safe - won't fail if already exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES organizations(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create default organization and migrate existing data
DO $$
DECLARE
    default_org_id UUID;
    user_record RECORD;
BEGIN
    -- Create default organization if it doesn't exist
    INSERT INTO organizations (name, slug, max_members, settings)
    VALUES (
        'Humbl Girls Club', 
        'humbl-girls-club', 
        10000,
        '{"theme": "default", "features": ["events", "challenges", "social", "loyalty", "messaging"]}'::jsonb
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO default_org_id;

    -- Get the organization ID if it already exists
    IF default_org_id IS NULL THEN
        SELECT id INTO default_org_id FROM organizations WHERE slug = 'humbl-girls-club';
    END IF;

    -- Migrate all existing users to the default organization
    FOR user_record IN SELECT id FROM auth.users
    LOOP
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (
            default_org_id, 
            user_record.id, 
            CASE 
                WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = user_record.id AND role = 'admin')
                THEN 'admin'
                ELSE 'member'
            END
        )
        ON CONFLICT (organization_id, user_id) DO NOTHING;
    END LOOP;

    -- Enable default features
    INSERT INTO organization_features (organization_id, feature_key, enabled)
    VALUES 
        (default_org_id, 'events', true),
        (default_org_id, 'challenges', true),
        (default_org_id, 'social', true),
        (default_org_id, 'messaging', true),
        (default_org_id, 'loyalty', true)
    ON CONFLICT (organization_id, feature_key) DO NOTHING;

    -- Update existing data with organization_id
    UPDATE profiles SET current_organization_id = default_org_id WHERE current_organization_id IS NULL;
    UPDATE events SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE challenges SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE social_posts SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE user_roles SET organization_id = default_org_id WHERE organization_id IS NULL;

    RAISE NOTICE 'Emergency repair completed. Default organization: %', default_org_id;
END $$;

-- Create essential RPC functions
CREATE OR REPLACE FUNCTION get_user_current_organization()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_member_of_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE organization_id = org_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_current_organization() TO authenticated;
GRANT EXECUTE ON FUNCTION is_member_of_organization(UUID) TO authenticated;

-- Final validation
SELECT 
    'EMERGENCY REPAIR COMPLETE' as status,
    (SELECT COUNT(*) FROM organizations) as organizations,
    (SELECT COUNT(*) FROM organization_members) as members,
    (SELECT name FROM organizations WHERE slug = 'humbl-girls-club') as default_org_name;