-- Migration 002: Custom Signup Pages and Invitation System
-- Handles club-specific signup pages and invitation codes

BEGIN;

-- ============================================================================
-- CUSTOM SIGNUP PAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS club_signup_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Branding
  logo_url TEXT,
  club_name TEXT,
  tagline TEXT,
  
  -- Background customization
  background_type TEXT DEFAULT 'color' CHECK (background_type IN ('color', 'gradient', 'image')),
  background_value TEXT DEFAULT '#ffffff', -- hex color, gradient CSS, or image URL
  
  -- Welcome content
  welcome_title TEXT DEFAULT 'Join Our Community',
  welcome_text TEXT,
  
  -- Form configuration
  require_phone BOOLEAN DEFAULT false,
  require_birthdate BOOLEAN DEFAULT false,
  require_gender BOOLEAN DEFAULT false,
  custom_fields JSONB DEFAULT '[]', -- Array of {label, type, required, options}
  
  -- Legal text
  terms_text TEXT,
  privacy_text TEXT,
  marketing_consent_text TEXT,
  
  -- Button customization
  button_color TEXT DEFAULT '#000000',
  button_text_color TEXT DEFAULT '#ffffff',
  button_text TEXT DEFAULT 'Join Now',
  
  -- Signup behavior
  auto_approve BOOLEAN DEFAULT true,
  default_role TEXT DEFAULT 'member',
  send_welcome_email BOOLEAN DEFAULT true,
  redirect_after_signup TEXT DEFAULT '/dashboard',
  
  -- SEO & Meta
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id)
);

-- ============================================================================
-- INVITATION SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(12) UNIQUE NOT NULL,
  
  -- Code type and limits
  type TEXT DEFAULT 'permanent' CHECK (type IN ('permanent', 'limited', 'one-time', 'event')),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Restrictions
  email_domain TEXT, -- e.g., '@company.com'
  age_minimum INTEGER,
  
  -- Role assignment
  default_role TEXT DEFAULT 'member' CHECK (default_role IN ('member', 'moderator', 'admin')),
  auto_approve BOOLEAN DEFAULT true,
  custom_welcome_message TEXT,
  
  -- Tracking
  source TEXT, -- 'email', 'social', 'qr', 'direct'
  campaign TEXT,
  
  -- QR Code customization
  qr_code_url TEXT, -- Generated QR code image URL
  qr_style TEXT DEFAULT 'square' CHECK (qr_style IN ('square', 'rounded', 'dots')),
  qr_color TEXT DEFAULT '#000000',
  qr_background TEXT DEFAULT '#ffffff',
  qr_logo_enabled BOOLEAN DEFAULT false,
  
  -- Creator info
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Statistics
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  CHECK (
    (type = 'limited' AND max_uses IS NOT NULL) OR
    (type = 'one-time' AND max_uses = 1) OR
    (type IN ('permanent', 'event'))
  )
);

-- Track invitation redemptions
CREATE TABLE IF NOT EXISTS invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code_id UUID NOT NULL REFERENCES invite_codes(id) ON DELETE CASCADE,
  redeemed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Tracking data
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  
  -- Location (optional)
  country TEXT,
  city TEXT,
  
  UNIQUE(invite_code_id, redeemed_by)
);

-- Email invitations (direct invites)
CREATE TABLE IF NOT EXISTS email_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  
  -- Invitation details
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Role assignment
  default_role TEXT DEFAULT 'member',
  personal_message TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Token for acceptance
  token UUID DEFAULT gen_random_uuid(),
  
  UNIQUE(organization_id, email)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_signup_pages_org ON club_signup_pages(organization_id);
CREATE INDEX idx_invite_codes_org ON invite_codes(organization_id);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_type ON invite_codes(type);
CREATE INDEX idx_invite_redemptions_code ON invite_redemptions(invite_code_id);
CREATE INDEX idx_invite_redemptions_user ON invite_redemptions(redeemed_by);
CREATE INDEX idx_email_invitations_org ON email_invitations(organization_id);
CREATE INDEX idx_email_invitations_email ON email_invitations(email);
CREATE INDEX idx_email_invitations_token ON email_invitations(token);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE club_signup_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_invitations ENABLE ROW LEVEL SECURITY;

-- Signup pages policies
CREATE POLICY "Public can view signup pages"
  ON club_signup_pages FOR SELECT
  USING (true); -- Public access for signup

CREATE POLICY "Admins can manage signup pages"
  ON club_signup_pages FOR ALL
  USING (is_admin_of_organization(organization_id));

-- Invite codes policies
CREATE POLICY "Members can view their org's invite codes"
  ON invite_codes FOR SELECT
  USING (is_member_of_organization(organization_id));

CREATE POLICY "Admins can manage invite codes"
  ON invite_codes FOR ALL
  USING (is_admin_of_organization(organization_id));

-- Invite redemptions policies
CREATE POLICY "Admins can view redemptions"
  ON invite_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invite_codes ic
      WHERE ic.id = invite_redemptions.invite_code_id
      AND is_admin_of_organization(ic.organization_id)
    )
  );

CREATE POLICY "Users can view their own redemptions"
  ON invite_redemptions FOR SELECT
  USING (redeemed_by = auth.uid());

-- Email invitations policies
CREATE POLICY "Admins can manage email invitations"
  ON email_invitations FOR ALL
  USING (is_admin_of_organization(organization_id));

CREATE POLICY "Invitees can view their invitations by token"
  ON email_invitations FOR SELECT
  USING (true); -- Will be filtered by token in query

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    new_code := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT),
        1, 8
      )
    );
    
    -- Check if code already exists
    SELECT EXISTS (
      SELECT 1 FROM invite_codes WHERE code = new_code
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Redeem invite code
CREATE OR REPLACE FUNCTION redeem_invite_code(
  p_code TEXT,
  p_user_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  organization_id UUID,
  role TEXT
) AS $$
DECLARE
  v_invite RECORD;
  v_org_id UUID;
  v_role TEXT;
BEGIN
  -- Get invite details
  SELECT * INTO v_invite
  FROM invite_codes
  WHERE code = p_code
  FOR UPDATE; -- Lock the row
  
  -- Check if code exists
  IF v_invite IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid invite code', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if code is expired
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'Invite code has expired', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check usage limits
  IF v_invite.type = 'one-time' AND v_invite.current_uses >= 1 THEN
    RETURN QUERY SELECT false, 'This invite code has already been used', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  IF v_invite.type = 'limited' AND v_invite.current_uses >= v_invite.max_uses THEN
    RETURN QUERY SELECT false, 'This invite code has reached its usage limit', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if user already redeemed this code
  IF EXISTS (
    SELECT 1 FROM invite_redemptions 
    WHERE invite_code_id = v_invite.id 
    AND redeemed_by = p_user_id
  ) THEN
    RETURN QUERY SELECT false, 'You have already used this invite code', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = v_invite.organization_id 
    AND user_id = p_user_id
  ) THEN
    RETURN QUERY SELECT false, 'You are already a member of this organization', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Add user to organization
  INSERT INTO organization_members (
    organization_id, 
    user_id, 
    role, 
    invited_by,
    invited_at,
    joined_at
  ) VALUES (
    v_invite.organization_id,
    p_user_id,
    v_invite.default_role,
    v_invite.created_by,
    NOW(),
    NOW()
  );
  
  -- Record redemption
  INSERT INTO invite_redemptions (
    invite_code_id,
    redeemed_by,
    ip_address,
    user_agent
  ) VALUES (
    v_invite.id,
    p_user_id,
    p_ip_address,
    p_user_agent
  );
  
  -- Update usage count
  UPDATE invite_codes 
  SET 
    current_uses = current_uses + 1,
    last_used_at = NOW()
  WHERE id = v_invite.id;
  
  -- Return success
  RETURN QUERY SELECT 
    true, 
    'Successfully joined organization', 
    v_invite.organization_id, 
    v_invite.default_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get organization by slug (for signup pages)
CREATE OR REPLACE FUNCTION get_organization_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  signup_config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    row_to_json(csp.*)::JSONB as signup_config
  FROM organizations o
  LEFT JOIN club_signup_pages csp ON csp.organization_id = o.id
  WHERE o.slug = p_slug
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at for signup pages
CREATE TRIGGER update_signup_pages_updated_at
  BEFORE UPDATE ON club_signup_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate invite code
CREATE OR REPLACE FUNCTION auto_generate_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_invite_code_on_insert
  BEFORE INSERT ON invite_codes
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invite_code();

-- Create default signup page when organization is created
CREATE OR REPLACE FUNCTION create_default_signup_page()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO club_signup_pages (
    organization_id,
    club_name,
    welcome_title,
    welcome_text
  ) VALUES (
    NEW.id,
    NEW.name,
    'Join ' || NEW.name,
    'Welcome to our community!'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_signup_page_on_org_create
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_signup_page();

COMMIT;