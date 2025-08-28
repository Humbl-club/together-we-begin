-- ============================================================================
-- EMERGENCY MULTI-TENANT FOUNDATION SETUP
-- ============================================================================
-- This script sets up the essential multi-tenant architecture
-- Execute this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- STEP 1: Create core organization tables
-- ============================================================================

-- Organizations (Clubs) table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Subscription & Limits
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'cancelled')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  max_members INTEGER DEFAULT 50,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members linking table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  
  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Ensure unique membership
  UNIQUE(organization_id, user_id)
);

-- Organization features
CREATE TABLE IF NOT EXISTS organization_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  configuration JSONB DEFAULT '{}',
  price_override DECIMAL(10,2),
  enabled_at TIMESTAMP WITH TIME ZONE,
  enabled_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, feature_key)
);

-- Feature catalog
CREATE TABLE IF NOT EXISTS feature_catalog (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('core', 'social', 'events', 'wellness', 'commerce', 'admin')),
  base_price DECIMAL(10,2) DEFAULT 0,
  dependencies TEXT[] DEFAULT '{}',
  conflicts TEXT[] DEFAULT '{}',
  configuration_schema JSONB,
  available BOOLEAN DEFAULT true,
  min_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Create indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_features_org ON organization_features(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_features_enabled ON organization_features(enabled);

-- STEP 3: Insert feature catalog
-- ============================================================================
INSERT INTO feature_catalog (key, name, description, category, base_price) VALUES
  ('events', 'Event Management', 'Create and manage events with registration', 'events', 10.00),
  ('challenges', 'Wellness Challenges', 'Step tracking and wellness competitions', 'wellness', 15.00),
  ('social', 'Social Feed', 'Community posts and interactions', 'social', 0.00),
  ('messaging', 'Direct Messaging', 'Member-to-member messaging', 'social', 5.00),
  ('loyalty', 'Points & Rewards', 'Loyalty points and rewards system', 'commerce', 15.00),
  ('payments', 'Payment Processing', 'Accept payments via Stripe', 'commerce', 20.00),
  ('analytics', 'Advanced Analytics', 'Detailed analytics and reporting', 'admin', 25.00)
ON CONFLICT (key) DO NOTHING;

-- STEP 4: Create essential RPC functions
-- ============================================================================

-- Function to check if user is in organization
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

-- Function to check if user is admin of organization
CREATE OR REPLACE FUNCTION is_admin_of_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE organization_id = org_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role in organization
CREATE OR REPLACE FUNCTION get_user_role_in_organization(org_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM organization_members 
    WHERE organization_id = org_id 
    AND user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current organization
CREATE OR REPLACE FUNCTION get_user_current_organization()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
    AND status = 'active'
    ORDER BY joined_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Enable Row Level Security
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_features ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create basic RLS policies
-- ============================================================================

-- Organizations policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
CREATE POLICY "Users can view organizations they belong to"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organization owners can update their organization" ON organizations;
CREATE POLICY "Organization owners can update their organization"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can create an organization" ON organizations;
CREATE POLICY "Anyone can create an organization"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Organization members policies
DROP POLICY IF EXISTS "Members can view their organization's members" ON organization_members;
CREATE POLICY "Members can view their organization's members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage organization members" ON organization_members;
CREATE POLICY "Admins can manage organization members"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Organization features policies
DROP POLICY IF EXISTS "Members can view their organization's features" ON organization_features;
CREATE POLICY "Members can view their organization's features"
  ON organization_features FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Only owners can manage features" ON organization_features;
CREATE POLICY "Only owners can manage features"
  ON organization_features FOR ALL
  USING (
    organization_id IN (
      SELECT o.id 
      FROM organizations o
      WHERE o.owner_id = auth.uid()
    )
  );

-- STEP 7: Create triggers
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Automatically add owner as member when organization is created
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_members (organization_id, user_id, role, status)
  VALUES (NEW.id, NEW.owner_id, 'owner', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS add_owner_as_member_on_org_create ON organizations;
CREATE TRIGGER add_owner_as_member_on_org_create
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();

-- STEP 8: Create default organization (will be created when first user signs up)
-- This will be handled by the application logic

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- After running this script:
-- 1. Verify tables exist in Supabase Dashboard > Table Editor
-- 2. Test RPC functions in SQL Editor
-- 3. Update TypeScript types
-- 4. Test frontend organization context
-- ============================================================================