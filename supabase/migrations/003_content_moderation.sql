-- Migration 003: Content Moderation System
-- Handles content deletion, user banning, and moderation audit trails

BEGIN;

-- ============================================================================
-- USER BANNING SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  banned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Ban details
  reason TEXT NOT NULL,
  ban_type TEXT DEFAULT 'permanent' CHECK (ban_type IN ('permanent', 'temporary')),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional info
  ip_addresses INET[] DEFAULT '{}', -- Known IPs to block
  device_ids TEXT[] DEFAULT '{}', -- Device fingerprints to block
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  lifted_at TIMESTAMP WITH TIME ZONE,
  lifted_by UUID REFERENCES auth.users(id),
  lift_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure temporary bans have expiry
  CHECK (
    (ban_type = 'permanent' AND expires_at IS NULL) OR
    (ban_type = 'temporary' AND expires_at IS NOT NULL)
  )
);

-- Create unique index to ensure user can only be actively banned once per org
CREATE UNIQUE INDEX idx_unique_active_ban 
  ON organization_bans(organization_id, banned_user_id) 
  WHERE is_active = true;

-- ============================================================================
-- CONTENT DELETION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Content identification
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'message', 'comment', 'image', 'event', 'challenge')),
  content_id UUID NOT NULL,
  content_table TEXT NOT NULL, -- Table name for reference
  
  -- Deletion details
  deleted_by UUID NOT NULL REFERENCES auth.users(id),
  deletion_reason TEXT,
  deletion_type TEXT DEFAULT 'soft' CHECK (deletion_type IN ('soft', 'hard')),
  
  -- Original content (for audit trail)
  original_content JSONB NOT NULL, -- Complete content backup
  original_author_id UUID,
  original_created_at TIMESTAMP WITH TIME ZONE,
  
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MODERATION ACTIONS LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN ('delete_content', 'ban_user', 'warn_user', 'mute_user', 'unban_user', 'restore_content')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Target
  target_user_id UUID REFERENCES auth.users(id),
  target_content_id UUID,
  target_content_type TEXT,
  
  -- Moderator
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  moderator_role TEXT,
  
  -- Details
  reason TEXT NOT NULL,
  notes TEXT,
  evidence JSONB, -- Screenshots, links, etc.
  
  -- Resolution
  requires_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USER WARNINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  warned_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Warning details
  warning_type TEXT DEFAULT 'general' CHECK (warning_type IN ('general', 'content', 'behavior', 'spam', 'harassment')),
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  message TEXT NOT NULL,
  
  -- Related content
  related_content_id UUID,
  related_content_type TEXT,
  
  -- Status
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CONTENT REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Content being reported
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'message', 'comment', 'profile', 'event')),
  content_id UUID NOT NULL,
  
  -- Reporter
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Report details
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'copyright', 'other')),
  description TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  
  -- Resolution
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution TEXT,
  action_taken TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reports
  UNIQUE(organization_id, content_type, content_id, reported_by)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_bans_org ON organization_bans(organization_id);
CREATE INDEX idx_bans_user ON organization_bans(banned_user_id);
CREATE INDEX idx_bans_active ON organization_bans(is_active);
CREATE INDEX idx_bans_expires ON organization_bans(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_deletions_org ON content_deletions(organization_id);
CREATE INDEX idx_deletions_type ON content_deletions(content_type);
CREATE INDEX idx_deletions_content ON content_deletions(content_id);
CREATE INDEX idx_deletions_author ON content_deletions(original_author_id);

CREATE INDEX idx_mod_actions_org ON moderation_actions(organization_id);
CREATE INDEX idx_mod_actions_type ON moderation_actions(action_type);
CREATE INDEX idx_mod_actions_user ON moderation_actions(target_user_id);
CREATE INDEX idx_mod_actions_moderator ON moderation_actions(performed_by);

CREATE INDEX idx_warnings_org ON user_warnings(organization_id);
CREATE INDEX idx_warnings_user ON user_warnings(user_id);
CREATE INDEX idx_warnings_severity ON user_warnings(severity);

CREATE INDEX idx_reports_org ON content_reports(organization_id);
CREATE INDEX idx_reports_content ON content_reports(content_type, content_id);
CREATE INDEX idx_reports_status ON content_reports(status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE organization_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Organization bans policies
CREATE POLICY "Admins can manage bans"
  ON organization_bans FOR ALL
  USING (is_admin_of_organization(organization_id));

CREATE POLICY "Users can check if they are banned"
  ON organization_bans FOR SELECT
  USING (banned_user_id = auth.uid());

-- Content deletions policies
CREATE POLICY "Admins can view and create deletions"
  ON content_deletions FOR ALL
  USING (is_admin_of_organization(organization_id));

CREATE POLICY "Users can see their deleted content"
  ON content_deletions FOR SELECT
  USING (original_author_id = auth.uid());

-- Moderation actions policies
CREATE POLICY "Admins can manage moderation actions"
  ON moderation_actions FOR ALL
  USING (is_admin_of_organization(organization_id));

CREATE POLICY "Users can view actions against them"
  ON moderation_actions FOR SELECT
  USING (target_user_id = auth.uid());

-- User warnings policies
CREATE POLICY "Admins can manage warnings"
  ON user_warnings FOR ALL
  USING (is_admin_of_organization(organization_id));

CREATE POLICY "Users can view their warnings"
  ON user_warnings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can acknowledge their warnings"
  ON user_warnings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Content reports policies
CREATE POLICY "Members can create reports"
  ON content_reports FOR INSERT
  WITH CHECK (is_member_of_organization(organization_id));

CREATE POLICY "Members can view their own reports"
  ON content_reports FOR SELECT
  USING (reported_by = auth.uid());

CREATE POLICY "Admins can manage all reports"
  ON content_reports FOR ALL
  USING (is_admin_of_organization(organization_id));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Ban a user from organization
CREATE OR REPLACE FUNCTION ban_user_from_organization(
  p_org_id UUID,
  p_user_id UUID,
  p_reason TEXT,
  p_duration_days INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_ban_type TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if moderator is admin
  IF NOT is_admin_of_organization(p_org_id) THEN
    RAISE EXCEPTION 'Only admins can ban users';
  END IF;
  
  -- Determine ban type and expiry
  IF p_duration_days IS NULL THEN
    v_ban_type := 'permanent';
    v_expires_at := NULL;
  ELSE
    v_ban_type := 'temporary';
    v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
  END IF;
  
  -- Deactivate any existing ban
  UPDATE organization_bans
  SET is_active = false
  WHERE organization_id = p_org_id
  AND banned_user_id = p_user_id
  AND is_active = true;
  
  -- Create new ban
  INSERT INTO organization_bans (
    organization_id,
    banned_user_id,
    banned_by,
    reason,
    ban_type,
    expires_at
  ) VALUES (
    p_org_id,
    p_user_id,
    auth.uid(),
    p_reason,
    v_ban_type,
    v_expires_at
  );
  
  -- Remove user from organization
  DELETE FROM organization_members
  WHERE organization_id = p_org_id
  AND user_id = p_user_id;
  
  -- Log moderation action
  INSERT INTO moderation_actions (
    organization_id,
    action_type,
    target_user_id,
    performed_by,
    reason,
    severity
  ) VALUES (
    p_org_id,
    'ban_user',
    p_user_id,
    auth.uid(),
    p_reason,
    'high'
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete content with audit trail
CREATE OR REPLACE FUNCTION delete_content_with_audit(
  p_org_id UUID,
  p_content_type TEXT,
  p_content_id UUID,
  p_content_table TEXT,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_original_content JSONB;
  v_author_id UUID;
  v_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is admin
  IF NOT is_admin_of_organization(p_org_id) THEN
    RAISE EXCEPTION 'Only admins can delete content';
  END IF;
  
  -- Get original content (dynamic query)
  EXECUTE format(
    'SELECT to_jsonb(t.*), t.user_id, t.created_at FROM %I t WHERE t.id = $1',
    p_content_table
  ) INTO v_original_content, v_author_id, v_created_at
  USING p_content_id;
  
  IF v_original_content IS NULL THEN
    RETURN false;
  END IF;
  
  -- Store deletion record
  INSERT INTO content_deletions (
    organization_id,
    content_type,
    content_id,
    content_table,
    deleted_by,
    deletion_reason,
    original_content,
    original_author_id,
    original_created_at
  ) VALUES (
    p_org_id,
    p_content_type,
    p_content_id,
    p_content_table,
    auth.uid(),
    p_reason,
    v_original_content,
    v_author_id,
    v_created_at
  );
  
  -- Delete the actual content
  EXECUTE format('DELETE FROM %I WHERE id = $1', p_content_table)
  USING p_content_id;
  
  -- Log moderation action
  INSERT INTO moderation_actions (
    organization_id,
    action_type,
    target_content_id,
    target_content_type,
    performed_by,
    reason
  ) VALUES (
    p_org_id,
    'delete_content',
    p_content_id,
    p_content_type,
    auth.uid(),
    p_reason
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is currently banned
CREATE OR REPLACE FUNCTION is_user_banned(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM organization_bans 
    WHERE organization_id = p_org_id
    AND banned_user_id = p_user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-expire temporary bans
CREATE OR REPLACE FUNCTION expire_temporary_bans()
RETURNS void AS $$
BEGIN
  UPDATE organization_bans
  SET 
    is_active = false,
    lifted_at = NOW(),
    lift_reason = 'Ban period expired'
  WHERE ban_type = 'temporary'
  AND expires_at < NOW()
  AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Get user's warning count
CREATE OR REPLACE FUNCTION get_user_warning_count(p_org_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_warnings
    WHERE organization_id = p_org_id
    AND user_id = p_user_id
    AND created_at > NOW() - INTERVAL '90 days' -- Only count recent warnings
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Prevent banned users from rejoining
CREATE OR REPLACE FUNCTION prevent_banned_user_join()
RETURNS TRIGGER AS $$
BEGIN
  IF is_user_banned(NEW.organization_id, NEW.user_id) THEN
    RAISE EXCEPTION 'User is banned from this organization';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_ban_before_member_insert
  BEFORE INSERT ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_banned_user_join();

-- Auto-ban after too many warnings
CREATE OR REPLACE FUNCTION auto_ban_after_warnings()
RETURNS TRIGGER AS $$
DECLARE
  v_warning_count INTEGER;
BEGIN
  v_warning_count := get_user_warning_count(NEW.organization_id, NEW.user_id);
  
  -- Auto-ban after 3 warnings
  IF v_warning_count >= 3 THEN
    PERFORM ban_user_from_organization(
      NEW.organization_id,
      NEW.user_id,
      'Automatic ban: Exceeded warning limit (3 warnings)',
      7 -- 7 day temporary ban
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_warnings_after_insert
  AFTER INSERT ON user_warnings
  FOR EACH ROW
  EXECUTE FUNCTION auto_ban_after_warnings();

COMMIT;