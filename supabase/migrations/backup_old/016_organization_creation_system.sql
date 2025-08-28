-- Migration: Organization Creation System
-- Creates comprehensive RPC functions and policies for organization creation
-- Includes slug validation, defaults setup, and security measures

-- ============================================================================
-- RPC FUNCTIONS FOR ORGANIZATION CREATION
-- ============================================================================

-- Function to validate and generate unique organization slug
CREATE OR REPLACE FUNCTION validate_organization_slug(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clean_slug TEXT;
  v_exists BOOLEAN;
  v_counter INTEGER := 0;
  v_final_slug TEXT;
BEGIN
  -- Clean the slug: lowercase, replace spaces/special chars with hyphens
  v_clean_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(p_slug, '[^a-zA-Z0-9\-\s]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
  
  -- Remove leading/trailing hyphens and multiple consecutive hyphens
  v_clean_slug := REGEXP_REPLACE(v_clean_slug, '^-+|-+$', '', 'g');
  v_clean_slug := REGEXP_REPLACE(v_clean_slug, '-+', '-', 'g');
  
  -- Ensure minimum length
  IF LENGTH(v_clean_slug) < 2 THEN
    v_clean_slug := 'org-' || v_clean_slug;
  END IF;
  
  -- Check for reserved slugs
  IF v_clean_slug IN ('admin', 'api', 'www', 'mail', 'ftp', 'dashboard', 'settings', 'app', 'platform', 'super', 'system') THEN
    v_clean_slug := v_clean_slug || '-org';
  END IF;
  
  v_final_slug := v_clean_slug;
  
  -- Check if slug exists and find available variation
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM organizations 
      WHERE slug = v_final_slug
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
    
    v_counter := v_counter + 1;
    v_final_slug := v_clean_slug || '-' || v_counter;
  END LOOP;
  
  RETURN jsonb_build_object(
    'original_slug', p_slug,
    'clean_slug', v_clean_slug,
    'final_slug', v_final_slug,
    'modified', v_final_slug != v_clean_slug,
    'valid', LENGTH(v_final_slug) >= 2 AND LENGTH(v_final_slug) <= 50
  );
END;
$$;

-- Function to create new organization with all defaults
CREATE OR REPLACE FUNCTION create_organization_with_defaults(
  p_name TEXT,
  p_slug TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_org_type TEXT DEFAULT 'community',
  p_subscription_tier TEXT DEFAULT 'free',
  p_primary_color TEXT DEFAULT '#8B5CF6',
  p_logo_url TEXT DEFAULT NULL,
  p_tagline TEXT DEFAULT NULL,
  p_selected_features TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_organization_id UUID;
  v_slug_info JSONB;
  v_final_slug TEXT;
  v_max_members INTEGER;
  v_org_record RECORD;
  v_default_features TEXT[];
  v_all_features TEXT[];
  v_feature TEXT;
  v_member_count INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required',
      'error_code', 'AUTH_REQUIRED'
    );
  END IF;
  
  -- Validate inputs
  IF p_name IS NULL OR LENGTH(TRIM(p_name)) < 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Organization name is required',
      'error_code', 'INVALID_NAME'
    );
  END IF;
  
  -- Rate limiting: max 5 organizations per user
  SELECT COUNT(*) INTO v_member_count
  FROM organization_members
  WHERE user_id = v_user_id AND role = 'owner' AND status = 'active';
  
  IF v_member_count >= 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Maximum number of organizations reached (5)',
      'error_code', 'ORG_LIMIT_REACHED'
    );
  END IF;
  
  -- Generate/validate slug
  IF p_slug IS NULL OR LENGTH(TRIM(p_slug)) = 0 THEN
    v_slug_info := validate_organization_slug(p_name);
  ELSE
    v_slug_info := validate_organization_slug(p_slug);
  END IF;
  
  v_final_slug := (v_slug_info->>'final_slug')::TEXT;
  
  IF NOT (v_slug_info->>'valid')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid slug generated',
      'error_code', 'INVALID_SLUG',
      'slug_info', v_slug_info
    );
  END IF;
  
  -- Set max members based on subscription tier
  v_max_members := CASE p_subscription_tier
    WHEN 'free' THEN 50
    WHEN 'basic' THEN 200
    WHEN 'pro' THEN 1000
    WHEN 'enterprise' THEN 10000
    ELSE 50
  END;
  
  -- Create organization
  INSERT INTO organizations (
    name,
    slug,
    owner_id,
    subscription_tier,
    subscription_status,
    max_members,
    settings,
    onboarding_completed
  ) VALUES (
    TRIM(p_name),
    v_final_slug,
    v_user_id,
    p_subscription_tier,
    'active',
    v_max_members,
    jsonb_build_object(
      'description', COALESCE(p_description, ''),
      'type', p_org_type,
      'tagline', COALESCE(p_tagline, ''),
      'created_via', 'onboarding_wizard'
    ),
    true
  )
  RETURNING id INTO v_organization_id;
  
  -- Add owner as member
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    status,
    joined_at
  ) VALUES (
    v_organization_id,
    v_user_id,
    'owner',
    'active',
    NOW()
  );
  
  -- Update user's current organization
  UPDATE profiles 
  SET current_organization_id = v_organization_id
  WHERE id = v_user_id;
  
  -- Create default theme
  INSERT INTO organization_themes (
    organization_id,
    theme_preset,
    primary_color,
    secondary_color,
    accent_color,
    background_color,
    surface_color,
    text_primary,
    text_secondary,
    text_muted,
    success_color,
    warning_color,
    error_color,
    info_color,
    border_color,
    divider_color,
    button_radius,
    card_radius,
    dark_mode_enabled
  ) VALUES (
    v_organization_id,
    'custom',
    COALESCE(p_primary_color, '#8B5CF6'),
    '#EC4899',
    '#10B981',
    '#FAFAFA',
    '#FFFFFF',
    '#111827',
    '#6B7280',
    '#9CA3AF',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#3B82F6',
    '#E5E7EB',
    '#F3F4F6',
    '0.5rem',
    '0.75rem',
    false
  );
  
  -- Create default branding if logo provided
  IF p_logo_url IS NOT NULL AND LENGTH(TRIM(p_logo_url)) > 0 THEN
    INSERT INTO organization_branding (
      organization_id,
      logo_light_url,
      logo_dark_url
    ) VALUES (
      v_organization_id,
      TRIM(p_logo_url),
      TRIM(p_logo_url)
    );
  END IF;
  
  -- Set up default features based on organization type
  v_default_features := CASE p_org_type
    WHEN 'fitness' THEN ARRAY['events', 'challenges', 'loyalty', 'social']
    WHEN 'community' THEN ARRAY['social', 'events', 'messages', 'members']
    WHEN 'professional' THEN ARRAY['events', 'members', 'announcements', 'analytics']
    WHEN 'educational' THEN ARRAY['events', 'challenges', 'leaderboard', 'members']
    ELSE ARRAY['social', 'events', 'members']
  END;
  
  -- Combine default features with selected features
  v_all_features := ARRAY(
    SELECT DISTINCT feature_name
    FROM (
      SELECT UNNEST(v_default_features) AS feature_name
      UNION
      SELECT UNNEST(p_selected_features) AS feature_name
    ) AS combined_features
    WHERE feature_name IS NOT NULL
  );
  
  -- Enable all features
  FOREACH v_feature IN ARRAY v_all_features
  LOOP
    INSERT INTO organization_features (
      organization_id,
      feature_key,
      enabled,
      enabled_by,
      enabled_at
    ) VALUES (
      v_organization_id,
      v_feature,
      true,
      v_user_id,
      NOW()
    ) ON CONFLICT (organization_id, feature_key) DO NOTHING;
  END LOOP;
  
  -- Create default signup page
  INSERT INTO club_signup_pages (
    organization_id,
    club_name,
    tagline,
    welcome_title,
    welcome_text,
    background_type,
    background_value,
    button_color,
    button_text_color,
    button_text,
    auto_approve,
    default_role,
    require_phone,
    require_birthdate,
    require_gender,
    custom_fields,
    send_welcome_email,
    redirect_after_signup
  ) VALUES (
    v_organization_id,
    TRIM(p_name),
    COALESCE(p_tagline, 'Welcome to our community!'),
    'Join ' || TRIM(p_name),
    'Connect with like-minded individuals and be part of something amazing.',
    'color',
    COALESCE(p_primary_color, '#8B5CF6'),
    COALESCE(p_primary_color, '#8B5CF6'),
    '#FFFFFF',
    'Join Now',
    true,
    'member',
    false,
    false,
    false,
    '[]'::jsonb,
    true,
    '/dashboard'
  );
  
  -- Create default dashboard layout and widgets
  PERFORM create_default_dashboard_layout(v_organization_id);
  
  -- Get the created organization data
  SELECT o.*, om.role, om.joined_at 
  INTO v_org_record
  FROM organizations o
  JOIN organization_members om ON om.organization_id = o.id
  WHERE o.id = v_organization_id AND om.user_id = v_user_id;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'organization', row_to_json(v_org_record),
    'slug_info', v_slug_info,
    'enabled_features', v_all_features,
    'message', 'Organization created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', 'CREATION_FAILED',
    'details', SQLSTATE
  );
END;
$$;

-- Function to check organization creation permissions
CREATE OR REPLACE FUNCTION can_user_create_organization(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_org_count INTEGER;
  v_recent_count INTEGER;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'Authentication required'
    );
  END IF;
  
  -- Check total organization limit (5 per user)
  SELECT COUNT(*) INTO v_org_count
  FROM organization_members
  WHERE user_id = v_user_id AND role = 'owner' AND status = 'active';
  
  IF v_org_count >= 5 THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'Maximum number of organizations reached (5)',
      'current_count', v_org_count,
      'max_allowed', 5
    );
  END IF;
  
  -- Check rate limiting (max 3 per day)
  SELECT COUNT(*) INTO v_recent_count
  FROM organizations o
  JOIN organization_members om ON om.organization_id = o.id
  WHERE om.user_id = v_user_id 
    AND om.role = 'owner' 
    AND o.created_at > NOW() - INTERVAL '24 hours';
  
  IF v_recent_count >= 3 THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'Rate limit exceeded: maximum 3 organizations per day',
      'created_today', v_recent_count,
      'max_per_day', 3
    );
  END IF;
  
  RETURN jsonb_build_object(
    'can_create', true,
    'current_count', v_org_count,
    'max_allowed', 5,
    'created_today', v_recent_count,
    'max_per_day', 3
  );
END;
$$;

-- Function to get available organization features
CREATE OR REPLACE FUNCTION get_available_organization_features(
  p_subscription_tier TEXT DEFAULT 'free'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_features JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'key', fc.key,
      'name', fc.name,
      'description', fc.description,
      'category', fc.category,
      'base_price', fc.base_price,
      'available', fc.available,
      'min_tier', fc.min_tier,
      'dependencies', fc.dependencies,
      'conflicts', fc.conflicts,
      'allowed_for_tier', CASE 
        WHEN fc.min_tier = 'free' THEN true
        WHEN fc.min_tier = 'basic' AND p_subscription_tier IN ('basic', 'pro', 'enterprise') THEN true
        WHEN fc.min_tier = 'pro' AND p_subscription_tier IN ('pro', 'enterprise') THEN true
        WHEN fc.min_tier = 'enterprise' AND p_subscription_tier = 'enterprise' THEN true
        ELSE false
      END
    )
  ) INTO v_features
  FROM feature_catalog fc
  WHERE fc.available = true;
  
  RETURN COALESCE(v_features, '[]'::jsonb);
END;
$$;

-- ============================================================================
-- SECURITY POLICIES
-- ============================================================================

-- Allow authenticated users to validate slugs
GRANT EXECUTE ON FUNCTION validate_organization_slug TO authenticated;

-- Allow authenticated users to create organizations
GRANT EXECUTE ON FUNCTION create_organization_with_defaults TO authenticated;

-- Allow authenticated users to check creation permissions
GRANT EXECUTE ON FUNCTION can_user_create_organization TO authenticated;

-- Allow authenticated users to get available features
GRANT EXECUTE ON FUNCTION get_available_organization_features TO authenticated;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for slug uniqueness checks
CREATE INDEX IF NOT EXISTS idx_organizations_slug_active 
ON organizations(slug) 
WHERE subscription_status = 'active';

-- Index for organization creation rate limiting
CREATE INDEX IF NOT EXISTS idx_organizations_created_owner 
ON organizations(owner_id, created_at DESC);

-- Index for member counting
CREATE INDEX IF NOT EXISTS idx_organization_members_owner_active 
ON organization_members(user_id, role, status) 
WHERE role = 'owner' AND status = 'active';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION validate_organization_slug IS 'Validates and generates unique organization slug with collision handling';
COMMENT ON FUNCTION create_organization_with_defaults IS 'Creates new organization with all default settings, features, and security checks';
COMMENT ON FUNCTION can_user_create_organization IS 'Checks if user can create new organization (rate limiting and quotas)';
COMMENT ON FUNCTION get_available_organization_features IS 'Returns available features based on subscription tier';