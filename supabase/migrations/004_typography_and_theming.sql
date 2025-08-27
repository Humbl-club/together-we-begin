-- Migration 004: Typography and Theming System
-- Alo Yoga-inspired default typography with customization options

BEGIN;

-- ============================================================================
-- TYPOGRAPHY SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_typography (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Font preset (curated options, not 50+ Google Fonts)
  font_preset TEXT DEFAULT 'alo-inspired' 
    CHECK (font_preset IN ('alo-inspired', 'modern', 'classic', 'playful', 'bold')),
  
  -- Optional custom fonts (for premium tiers)
  custom_heading_font TEXT,
  custom_heading_font_url TEXT,
  custom_body_font TEXT,
  custom_body_font_url TEXT,
  
  -- Size adjustments
  base_font_size INTEGER DEFAULT 16 CHECK (base_font_size BETWEEN 14 AND 18),
  heading_size_scale DECIMAL(2,2) DEFAULT 1.0 CHECK (heading_size_scale BETWEEN 0.8 AND 1.5),
  
  -- Font weights
  use_light_weight BOOLEAN DEFAULT false,
  use_bold_headings BOOLEAN DEFAULT true,
  
  -- Letter spacing
  heading_letter_spacing TEXT DEFAULT 'normal' 
    CHECK (heading_letter_spacing IN ('tight', 'normal', 'wide')),
  
  -- Line height
  line_height_style TEXT DEFAULT 'normal'
    CHECK (line_height_style IN ('tight', 'normal', 'relaxed')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id)
);

-- ============================================================================
-- COLOR THEMES
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Theme preset
  theme_preset TEXT DEFAULT 'alo-minimal'
    CHECK (theme_preset IN ('alo-minimal', 'vibrant', 'dark', 'pastel', 'custom')),
  
  -- Primary colors
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#666666',
  accent_color TEXT DEFAULT '#000000',
  
  -- Background colors
  background_color TEXT DEFAULT '#ffffff',
  surface_color TEXT DEFAULT '#fafafa',
  
  -- Text colors
  text_primary TEXT DEFAULT '#000000',
  text_secondary TEXT DEFAULT '#666666',
  text_muted TEXT DEFAULT '#999999',
  
  -- Semantic colors
  success_color TEXT DEFAULT '#059669',
  warning_color TEXT DEFAULT '#d97706',
  error_color TEXT DEFAULT '#dc2626',
  info_color TEXT DEFAULT '#0891b2',
  
  -- Border and divider
  border_color TEXT DEFAULT '#e5e5e5',
  divider_color TEXT DEFAULT '#f3f4f6',
  
  -- Button styles
  button_radius TEXT DEFAULT '4px',
  button_padding TEXT DEFAULT '12px 24px',
  
  -- Card styles
  card_radius TEXT DEFAULT '8px',
  card_shadow TEXT DEFAULT '0 1px 3px rgba(0,0,0,0.1)',
  
  -- Dark mode
  dark_mode_enabled BOOLEAN DEFAULT false,
  dark_mode_auto BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id)
);

-- ============================================================================
-- DASHBOARD LAYOUTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Layout preset (instead of full drag-drop)
  dashboard_layout TEXT DEFAULT 'classic'
    CHECK (dashboard_layout IN ('classic', 'social-focus', 'events-focus', 'minimal')),
  
  -- Widget visibility
  show_stats_widget BOOLEAN DEFAULT true,
  show_events_widget BOOLEAN DEFAULT true,
  show_social_widget BOOLEAN DEFAULT true,
  show_members_widget BOOLEAN DEFAULT true,
  show_challenges_widget BOOLEAN DEFAULT true,
  
  -- Layout preferences
  sidebar_position TEXT DEFAULT 'left' CHECK (sidebar_position IN ('left', 'right', 'none')),
  nav_position TEXT DEFAULT 'top' CHECK (nav_position IN ('top', 'bottom', 'sidebar')),
  
  -- Content density
  content_density TEXT DEFAULT 'normal'
    CHECK (content_density IN ('compact', 'normal', 'spacious')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id)
);

-- ============================================================================
-- BRANDING ASSETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Logos and images
  logo_light_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  og_image_url TEXT,
  
  -- App icon (for PWA)
  app_icon_url TEXT,
  app_icon_192_url TEXT,
  app_icon_512_url TEXT,
  
  -- Backgrounds
  login_background_url TEXT,
  dashboard_background_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id)
);

-- ============================================================================
-- PRESET DEFINITIONS
-- ============================================================================

-- Font presets data
CREATE TABLE IF NOT EXISTS font_presets (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  heading_font TEXT NOT NULL,
  body_font TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false
);

INSERT INTO font_presets (key, name, description, heading_font, body_font, is_default) VALUES
  ('alo-inspired', 'Alo Inspired', 'Clean and minimal like Alo Yoga', 
   '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Arial, sans-serif',
   '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
   true),
  ('modern', 'Modern', 'Contemporary and sleek',
   '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
   '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
   false),
  ('classic', 'Classic', 'Timeless and elegant',
   '"Playfair Display", Georgia, serif',
   '"Source Sans Pro", -apple-system, sans-serif',
   false),
  ('playful', 'Playful', 'Fun and approachable',
   '"Quicksand", -apple-system, sans-serif',
   '"Open Sans", -apple-system, sans-serif',
   false),
  ('bold', 'Bold', 'Strong and impactful',
   '"Montserrat", -apple-system, sans-serif',
   '"Roboto", -apple-system, sans-serif',
   false)
ON CONFLICT (key) DO NOTHING;

-- Theme presets data
CREATE TABLE IF NOT EXISTS theme_presets (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false
);

INSERT INTO theme_presets (key, name, description, config, is_default) VALUES
  ('alo-minimal', 'Alo Minimal', 'Clean black and white theme', 
   '{
     "primary_color": "#000000",
     "secondary_color": "#666666",
     "accent_color": "#000000",
     "background_color": "#ffffff",
     "surface_color": "#fafafa",
     "text_primary": "#000000",
     "text_secondary": "#666666",
     "border_color": "#e5e5e5"
   }', true),
  ('vibrant', 'Vibrant', 'Colorful and energetic',
   '{
     "primary_color": "#6366f1",
     "secondary_color": "#ec4899",
     "accent_color": "#10b981",
     "background_color": "#ffffff",
     "surface_color": "#f9fafb"
   }', false),
  ('dark', 'Dark Mode', 'Dark theme for low light',
   '{
     "primary_color": "#818cf8",
     "secondary_color": "#f472b6",
     "background_color": "#111827",
     "surface_color": "#1f2937",
     "text_primary": "#f9fafb",
     "text_secondary": "#d1d5db"
   }', false),
  ('pastel', 'Pastel', 'Soft and gentle colors',
   '{
     "primary_color": "#c084fc",
     "secondary_color": "#fbbf24",
     "accent_color": "#86efac",
     "background_color": "#fefef8",
     "surface_color": "#fff7ed"
   }', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_typography_org ON organization_typography(organization_id);
CREATE INDEX idx_themes_org ON organization_themes(organization_id);
CREATE INDEX idx_layouts_org ON organization_layouts(organization_id);
CREATE INDEX idx_branding_org ON organization_branding(organization_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE organization_typography ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE font_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_presets ENABLE ROW LEVEL SECURITY;

-- Typography policies
CREATE POLICY "Members can view org typography"
  ON organization_typography FOR SELECT
  USING (is_member_of_organization(organization_id));

CREATE POLICY "Admins can manage typography"
  ON organization_typography FOR ALL
  USING (is_admin_of_organization(organization_id));

-- Theme policies
CREATE POLICY "Members can view org theme"
  ON organization_themes FOR SELECT
  USING (is_member_of_organization(organization_id));

CREATE POLICY "Admins can manage themes"
  ON organization_themes FOR ALL
  USING (is_admin_of_organization(organization_id));

-- Layout policies
CREATE POLICY "Members can view org layout"
  ON organization_layouts FOR SELECT
  USING (is_member_of_organization(organization_id));

CREATE POLICY "Admins can manage layouts"
  ON organization_layouts FOR ALL
  USING (is_admin_of_organization(organization_id));

-- Branding policies
CREATE POLICY "Public can view org branding"
  ON organization_branding FOR SELECT
  USING (true); -- Public for signup pages

CREATE POLICY "Admins can manage branding"
  ON organization_branding FOR ALL
  USING (is_admin_of_organization(organization_id));

-- Preset policies (public read)
CREATE POLICY "Anyone can view font presets"
  ON font_presets FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view theme presets"
  ON theme_presets FOR SELECT
  USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get organization theme configuration
CREATE OR REPLACE FUNCTION get_organization_theme(p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_typography JSONB;
  v_theme JSONB;
  v_layout JSONB;
  v_branding JSONB;
BEGIN
  -- Get typography settings
  SELECT row_to_json(t.*) INTO v_typography
  FROM organization_typography t
  WHERE t.organization_id = p_org_id;
  
  -- Get theme settings
  SELECT row_to_json(th.*) INTO v_theme
  FROM organization_themes th
  WHERE th.organization_id = p_org_id;
  
  -- Get layout settings
  SELECT row_to_json(l.*) INTO v_layout
  FROM organization_layouts l
  WHERE l.organization_id = p_org_id;
  
  -- Get branding assets
  SELECT row_to_json(b.*) INTO v_branding
  FROM organization_branding b
  WHERE b.organization_id = p_org_id;
  
  RETURN jsonb_build_object(
    'typography', COALESCE(v_typography, '{}'::JSONB),
    'theme', COALESCE(v_theme, '{}'::JSONB),
    'layout', COALESCE(v_layout, '{}'::JSONB),
    'branding', COALESCE(v_branding, '{}'::JSONB)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply theme preset
CREATE OR REPLACE FUNCTION apply_theme_preset(p_org_id UUID, p_preset_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_preset RECORD;
BEGIN
  -- Check if user is admin
  IF NOT is_admin_of_organization(p_org_id) THEN
    RAISE EXCEPTION 'Only admins can change themes';
  END IF;
  
  -- Get preset
  SELECT * INTO v_preset
  FROM theme_presets
  WHERE key = p_preset_key;
  
  IF v_preset IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update or insert theme
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
    border_color
  )
  SELECT 
    p_org_id,
    p_preset_key,
    (v_preset.config->>'primary_color')::TEXT,
    (v_preset.config->>'secondary_color')::TEXT,
    (v_preset.config->>'accent_color')::TEXT,
    (v_preset.config->>'background_color')::TEXT,
    (v_preset.config->>'surface_color')::TEXT,
    (v_preset.config->>'text_primary')::TEXT,
    (v_preset.config->>'text_secondary')::TEXT,
    (v_preset.config->>'border_color')::TEXT
  ON CONFLICT (organization_id) DO UPDATE
  SET 
    theme_preset = EXCLUDED.theme_preset,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color = EXCLUDED.accent_color,
    background_color = EXCLUDED.background_color,
    surface_color = EXCLUDED.surface_color,
    text_primary = EXCLUDED.text_primary,
    text_secondary = EXCLUDED.text_secondary,
    border_color = EXCLUDED.border_color,
    updated_at = NOW();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE TRIGGER update_typography_updated_at
  BEFORE UPDATE ON organization_typography
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_themes_updated_at
  BEFORE UPDATE ON organization_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_layouts_updated_at
  BEFORE UPDATE ON organization_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branding_updated_at
  BEFORE UPDATE ON organization_branding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create default theme settings when organization is created
CREATE OR REPLACE FUNCTION create_default_theme_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Typography
  INSERT INTO organization_typography (organization_id)
  VALUES (NEW.id);
  
  -- Theme
  INSERT INTO organization_themes (organization_id)
  VALUES (NEW.id);
  
  -- Layout
  INSERT INTO organization_layouts (organization_id)
  VALUES (NEW.id);
  
  -- Branding
  INSERT INTO organization_branding (organization_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_theme_on_org_create
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_theme_settings();

COMMIT;