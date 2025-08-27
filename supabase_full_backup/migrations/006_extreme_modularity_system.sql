-- Migration 006: Extreme Modularity System
-- Implements drag-and-drop dashboards, 50+ fonts, advanced layouts

BEGIN;

-- ============================================================================
-- EXTREME TYPOGRAPHY SYSTEM (50+ GOOGLE FONTS)
-- ============================================================================

-- Extended typography with full Google Fonts catalog
ALTER TABLE organization_typography ADD COLUMN IF NOT EXISTS google_fonts_enabled BOOLEAN DEFAULT true;
ALTER TABLE organization_typography ADD COLUMN IF NOT EXISTS heading_font_weight INTEGER DEFAULT 600;
ALTER TABLE organization_typography ADD COLUMN IF NOT EXISTS body_font_weight INTEGER DEFAULT 400;
ALTER TABLE organization_typography ADD COLUMN IF NOT EXISTS accent_font TEXT;
ALTER TABLE organization_typography ADD COLUMN IF NOT EXISTS mono_font TEXT DEFAULT 'JetBrains Mono';
ALTER TABLE organization_typography ADD COLUMN IF NOT EXISTS scale_ratio DECIMAL(4,3) DEFAULT 1.250;
ALTER TABLE organization_typography ADD COLUMN IF NOT EXISTS line_heights JSONB DEFAULT '{"tight": 1.2, "normal": 1.5, "relaxed": 1.8}';
ALTER TABLE organization_typography ADD COLUMN IF NOT EXISTS letter_spacings JSONB DEFAULT '{"tight": -0.02, "normal": 0, "wide": 0.05}';

-- Google Fonts catalog (50+ fonts)
CREATE TABLE IF NOT EXISTS google_fonts_catalog (
  id SERIAL PRIMARY KEY,
  family TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('serif', 'sans-serif', 'display', 'handwriting', 'monospace')),
  weights INTEGER[] NOT NULL DEFAULT '{400}',
  styles TEXT[] NOT NULL DEFAULT '{normal}',
  popularity_rank INTEGER,
  description TEXT,
  recommended_pairings TEXT[],
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Google Fonts catalog
INSERT INTO google_fonts_catalog (family, category, weights, styles, popularity_rank, description, recommended_pairings, url) VALUES
  ('Roboto', 'sans-serif', '{100,300,400,500,700,900}', '{normal,italic}', 1, 'Modern, friendly, and professional', '{Roboto Slab,Lora}', 'https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap'),
  ('Open Sans', 'sans-serif', '{300,400,500,600,700,800}', '{normal,italic}', 2, 'Optimized for legibility across print, web, and mobile', '{Merriweather,Lora}', 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap'),
  ('Lato', 'sans-serif', '{100,300,400,700,900}', '{normal,italic}', 3, 'Humanist sans serif with serious but friendly appearance', '{Merriweather,Crimson Text}', 'https://fonts.googleapis.com/css2?family=Lato:wght@100;300;400;700;900&display=swap'),
  ('Montserrat', 'sans-serif', '{100,200,300,400,500,600,700,800,900}', '{normal,italic}', 4, 'Urban typography inspired by signage', '{Lora,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap'),
  ('Source Sans Pro', 'sans-serif', '{200,300,400,600,700,900}', '{normal,italic}', 5, 'Readable and friendly sans serif designed for user interfaces', '{Source Serif Pro,Crimson Text}', 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@200;300;400;600;700;900&display=swap'),
  ('Oswald', 'sans-serif', '{200,300,400,500,600,700}', '{normal}', 6, 'Reworked classic style historically used for headlines', '{Open Sans,Lato}', 'https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&display=swap'),
  ('Raleway', 'sans-serif', '{100,200,300,400,500,600,700,800,900}', '{normal,italic}', 7, 'Elegant sans serif with thin weight', '{Lora,Crimson Text}', 'https://fonts.googleapis.com/css2?family=Raleway:wght@100;200;300;400;500;600;700;800;900&display=swap'),
  ('PT Sans', 'sans-serif', '{400,700}', '{normal,italic}', 8, 'Universal font family designed for Russian language', '{PT Serif,Lora}', 'https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap'),
  ('Poppins', 'sans-serif', '{100,200,300,400,500,600,700,800,900}', '{normal,italic}', 9, 'Geometric sans serif with rounded characters', '{Crimson Text,Lora}', 'https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap'),
  ('Nunito', 'sans-serif', '{200,300,400,500,600,700,800,900}', '{normal,italic}', 10, 'Rounded sans serif designed for web display', '{Crimson Text,Lora}', 'https://fonts.googleapis.com/css2?family=Nunito:wght@200;300;400;500;600;700;800;900&display=swap'),
  ('Inter', 'sans-serif', '{100,200,300,400,500,600,700,800,900}', '{normal}', 11, 'Designed for computer screens and optimized for readability', '{Crimson Text,Source Serif Pro}', 'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap'),
  ('Merriweather', 'serif', '{300,400,700,900}', '{normal,italic}', 12, 'Designed to be pleasant to read on screens', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap'),
  ('Playfair Display', 'serif', '{400,500,600,700,800,900}', '{normal,italic}', 13, 'High contrast and distinctive style', '{Source Sans Pro,Open Sans}', 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap'),
  ('Lora', 'serif', '{400,500,600,700}', '{normal,italic}', 14, 'Well-balanced contemporary serif with roots in calligraphy', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap'),
  ('Roboto Slab', 'serif', '{100,200,300,400,500,600,700,800,900}', '{normal}', 15, 'Friendly and approachable slab serif', '{Roboto,Open Sans}', 'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@100;200;300;400;500;600;700;800;900&display=swap'),
  ('Source Serif Pro', 'serif', '{200,300,400,600,700,900}', '{normal,italic}', 16, 'Complementary serif to Source Sans Pro', '{Source Sans Pro,Inter}', 'https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@200;300;400;600;700;900&display=swap'),
  ('PT Serif', 'serif', '{400,700}', '{normal,italic}', 17, 'Universal font family designed for Russian language', '{PT Sans,Open Sans}', 'https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&display=swap'),
  ('Crimson Text', 'serif', '{400,600,700}', '{normal,italic}', 18, 'Inspired by Crimson typeface designed by old-style serif', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap'),
  ('Libre Baskerville', 'serif', '{400,700}', '{normal,italic}', 19, 'Web font optimized for body text', '{Source Sans Pro,Open Sans}', 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap'),
  ('EB Garamond', 'serif', '{400,500,600,700,800}', '{normal,italic}', 20, 'Revival of Claude Garamond classical French style', '{Source Sans Pro,Inter}', 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700;800&display=swap'),
  ('Quicksand', 'sans-serif', '{300,400,500,600,700}', '{normal}', 21, 'Friendly and modern sans serif', '{Crimson Text,Lora}', 'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap'),
  ('Ubuntu', 'sans-serif', '{300,400,500,700}', '{normal,italic}', 22, 'Humanist sans serif with personality', '{Ubuntu Mono,Crimson Text}', 'https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap'),
  ('Rubik', 'sans-serif', '{300,400,500,600,700,800,900}', '{normal,italic}', 23, 'Rounded corners and friendly character', '{Crimson Text,Source Serif Pro}', 'https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800;900&display=swap'),
  ('Work Sans', 'sans-serif', '{100,200,300,400,500,600,700,800,900}', '{normal,italic}', 24, 'Optimized for on-screen text usage', '{Crimson Text,Lora}', 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@100;200;300;400;500;600;700;800;900&display=swap'),
  ('Fira Sans', 'sans-serif', '{100,200,300,400,500,600,700,800,900}', '{normal,italic}', 25, 'Humanist sans serif designed for Firefox OS', '{Fira Code,Crimson Text}', 'https://fonts.googleapis.com/css2?family=Fira+Sans:wght@100;200;300;400;500;600;700;800;900&display=swap'),
  ('Noto Sans', 'sans-serif', '{100,200,300,400,500,600,700,800,900}', '{normal,italic}', 26, 'Designed to achieve visual harmonious across languages', '{Noto Serif,Crimson Text}', 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@100;200;300;400;500;600;700;800;900&display=swap'),
  ('Mukti', 'sans-serif', '{200,300,400,500,600,700,800}', '{normal}', 27, 'Minimalist and contemporary', '{Crimson Text,Lora}', 'https://fonts.googleapis.com/css2?family=Mukti:wght@200;300;400;500;600;700;800&display=swap'),
  ('Barlow', 'sans-serif', '{100,200,300,400,500,600,700,800,900}', '{normal,italic}', 28, 'Grotesk inspired by California license plates', '{Crimson Text,Source Serif Pro}', 'https://fonts.googleapis.com/css2?family=Barlow:wght@100;200;300;400;500;600;700;800;900&display=swap'),
  ('DM Sans', 'sans-serif', '{400,500,700}', '{normal,italic}', 29, 'Geometric sans serif with optical corrections', '{DM Serif Text,Lora}', 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap'),
  ('Heebo', 'sans-serif', '{100,200,300,400,500,600,700,800,900}', '{normal}', 30, 'Hebrew and Latin sans serif family', '{Crimson Text,Lora}', 'https://fonts.googleapis.com/css2?family=Heebo:wght@100;200;300;400;500;600;700;800;900&display=swap'),
  ('JetBrains Mono', 'monospace', '{100,200,300,400,500,600,700,800}', '{normal,italic}', 31, 'Monospace font for developers', '{Inter,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap'),
  ('Fira Code', 'monospace', '{300,400,500,600,700}', '{normal}', 32, 'Monospace font with programming ligatures', '{Fira Sans,Inter}', 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap'),
  ('Source Code Pro', 'monospace', '{200,300,400,500,600,700,800,900}', '{normal,italic}', 33, 'Monospace font family for coding environments', '{Source Sans Pro,Inter}', 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@200;300;400;500;600;700;800;900&display=swap'),
  ('Space Mono', 'monospace', '{400,700}', '{normal,italic}', 34, 'Monospace font originally designed for Google Design', '{Inter,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap'),
  ('Ubuntu Mono', 'monospace', '{400,700}', '{normal,italic}', 35, 'Ubuntu monospace font family', '{Ubuntu,Inter}', 'https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;700&display=swap'),
  ('Dancing Script', 'handwriting', '{400,500,600,700}', '{normal}', 36, 'Casual script connecting letters', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap'),
  ('Pacifico', 'handwriting', '{400}', '{normal}', 37, 'Brush script inspired by 1950s American surf culture', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap'),
  ('Caveat', 'handwriting', '{400,500,600,700}', '{normal}', 38, 'Casual handwriting font', '{Open Sans,Inter}', 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap'),
  ('Kalam', 'handwriting', '{300,400,700}', '{normal}', 39, 'Handwriting style with Devanagari and Latin scripts', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap'),
  ('Satisfy', 'handwriting', '{400}', '{normal}', 40, 'Handwriting script connecting letters', '{Open Sans,Lato}', 'https://fonts.googleapis.com/css2?family=Satisfy&display=swap'),
  ('Bangers', 'display', '{400}', '{normal}', 41, 'Comic style font with punch', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Bangers&display=swap'),
  ('Lobster', 'display', '{400}', '{normal}', 42, 'Script with many curves and loops', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Lobster&display=swap'),
  ('Righteous', 'display', '{400}', '{normal}', 43, 'Casual and friendly display typeface', '{Open Sans,Lato}', 'https://fonts.googleapis.com/css2?family=Righteous&display=swap'),
  ('Fredoka One', 'display', '{400}', '{normal}', 44, 'Rounded and bold display font', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap'),
  ('Anton', 'display', '{400}', '{normal}', 45, 'Single weight display family', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Anton&display=swap'),
  ('Abril Fatface', 'display', '{400}', '{normal}', 46, 'Contemporary revisions of classic serif headlines', '{Source Sans Pro,Open Sans}', 'https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap'),
  ('Bebas Neue', 'display', '{400}', '{normal}', 47, 'All caps display font', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'),
  ('Comfortaa', 'display', '{300,400,500,600,700}', '{normal}', 48, 'Rounded geometric sans serif', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&display=swap'),
  ('Archivo Black', 'display', '{400}', '{normal}', 49, 'Strong display font', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap'),
  ('Fjalla One', 'display', '{400}', '{normal}', 50, 'Medium contrast display sans serif', '{Open Sans,Source Sans Pro}', 'https://fonts.googleapis.com/css2?family=Fjalla+One&display=swap')
ON CONFLICT (family) DO NOTHING;

-- ============================================================================
-- DRAG-AND-DROP DASHBOARD SYSTEM  
-- ============================================================================

-- Dashboard widgets system
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL CHECK (widget_type IN (
    'stats_overview', 'recent_events', 'social_feed', 'member_activity', 
    'challenges_progress', 'loyalty_points', 'quick_actions', 'calendar',
    'messages_preview', 'weather', 'announcements', 'leaderboard'
  )),
  title TEXT NOT NULL,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 1 CHECK (width BETWEEN 1 AND 4),
  height INTEGER NOT NULL DEFAULT 1 CHECK (height BETWEEN 1 AND 3),
  size_preset TEXT NOT NULL DEFAULT 'medium' CHECK (size_preset IN ('small', 'medium', 'large', 'full')),
  is_visible BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}',
  style_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Dashboard layouts for different screen sizes
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  layout_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  is_default BOOLEAN DEFAULT false,
  grid_columns INTEGER DEFAULT 4,
  grid_rows INTEGER DEFAULT 6,
  gap_size INTEGER DEFAULT 16,
  layout_data JSONB NOT NULL, -- Stores widget positions and sizes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, layout_name, device_type)
);

-- Widget templates for easy addition
CREATE TABLE IF NOT EXISTS widget_templates (
  id SERIAL PRIMARY KEY,
  widget_type TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('analytics', 'social', 'events', 'wellness', 'commerce', 'communication')),
  default_size TEXT NOT NULL DEFAULT 'medium',
  min_width INTEGER DEFAULT 1,
  max_width INTEGER DEFAULT 4,
  min_height INTEGER DEFAULT 1,
  max_height INTEGER DEFAULT 3,
  configuration_schema JSONB,
  preview_image TEXT,
  is_pro_feature BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert widget templates
INSERT INTO widget_templates (widget_type, display_name, description, icon, category, default_size, configuration_schema, is_pro_feature) VALUES
  ('stats_overview', 'Statistics Overview', 'Key metrics and numbers at a glance', '📊', 'analytics', 'large', '{"metrics": ["members", "events", "posts", "challenges"]}', false),
  ('recent_events', 'Recent Events', 'Upcoming and recent organization events', '📅', 'events', 'medium', '{"limit": 5, "show_images": true}', false),
  ('social_feed', 'Social Feed', 'Latest posts and social activity', '💬', 'social', 'medium', '{"limit": 3, "show_images": true, "show_likes": true}', false),
  ('member_activity', 'Member Activity', 'Recent member joins and activity', '👥', 'social', 'small', '{"limit": 5, "show_avatars": true}', false),
  ('challenges_progress', 'Challenge Progress', 'Current wellness challenges status', '🏆', 'wellness', 'medium', '{"show_leaderboard": true, "limit": 3}', false),
  ('loyalty_points', 'Loyalty Points', 'Points balance and recent transactions', '🎁', 'commerce', 'small', '{"show_balance": true, "show_recent": true}', false),
  ('quick_actions', 'Quick Actions', 'Common actions and shortcuts', '⚡', 'communication', 'medium', '{"actions": ["new_post", "create_event", "invite_member"]}', false),
  ('calendar', 'Calendar View', 'Monthly calendar with events', '📆', 'events', 'large', '{"view": "month", "show_events": true}', true),
  ('messages_preview', 'Messages Preview', 'Recent direct messages', '💌', 'communication', 'medium', '{"limit": 3, "show_unread": true}', true),
  ('weather', 'Weather Widget', 'Local weather information', '🌤️', 'analytics', 'small', '{"location": "auto", "show_forecast": false}', true),
  ('announcements', 'Announcements', 'Important organization announcements', '📢', 'communication', 'medium', '{"limit": 2, "show_dates": true}', false),
  ('leaderboard', 'Leaderboard', 'Top members by various metrics', '🏅', 'wellness', 'medium', '{"metric": "points", "limit": 5, "show_avatars": true}', false)
ON CONFLICT (widget_type) DO NOTHING;

-- ============================================================================
-- NAVIGATION CUSTOMIZATION SYSTEM
-- ============================================================================

-- Custom navigation items
CREATE TABLE IF NOT EXISTS navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('page', 'external_link', 'action', 'separator')),
  label TEXT NOT NULL,
  icon TEXT,
  url TEXT,
  action TEXT,
  position INTEGER NOT NULL,
  parent_id UUID REFERENCES navigation_items(id),
  is_visible BOOLEAN DEFAULT true,
  requires_auth BOOLEAN DEFAULT true,
  required_role TEXT CHECK (required_role IN ('member', 'moderator', 'admin', 'owner')),
  device_visibility TEXT DEFAULT 'all' CHECK (device_visibility IN ('all', 'mobile', 'tablet', 'desktop')),
  style_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default navigation items for new organizations
INSERT INTO navigation_items (organization_id, item_type, label, icon, url, position, requires_auth) 
SELECT 
  o.id,
  unnest(ARRAY['page', 'page', 'page', 'page', 'page', 'page']),
  unnest(ARRAY['Dashboard', 'Social', 'Events', 'Challenges', 'Messages', 'Profile']),
  unnest(ARRAY['🏠', '👥', '📅', '🏆', '💬', '👤']),
  unnest(ARRAY['/dashboard', '/social', '/events', '/challenges', '/messages', '/profile']),
  unnest(ARRAY[1, 2, 3, 4, 5, 6]),
  true
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM navigation_items WHERE organization_id = o.id
);

-- ============================================================================
-- CONTAINER SIZE CUSTOMIZATION
-- ============================================================================

-- Container presets for widgets and layouts
CREATE TABLE IF NOT EXISTS container_presets (
  id SERIAL PRIMARY KEY,
  preset_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  dimensions JSONB NOT NULL, -- {width, height, mobile_width, mobile_height}
  css_classes TEXT[],
  breakpoint_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert container presets
INSERT INTO container_presets (preset_name, display_name, description, dimensions, css_classes) VALUES
  ('small', 'Small', 'Compact widget size', '{"width": 1, "height": 1, "mobile_width": 1, "mobile_height": 1}', '{col-span-1, row-span-1}'),
  ('medium', 'Medium', 'Standard widget size', '{"width": 2, "height": 1, "mobile_width": 2, "mobile_height": 1}', '{col-span-2, row-span-1}'),
  ('large', 'Large', 'Extended widget size', '{"width": 2, "height": 2, "mobile_width": 2, "mobile_height": 2}', '{col-span-2, row-span-2}'),
  ('full', 'Full Width', 'Full row width', '{"width": 4, "height": 1, "mobile_width": 2, "mobile_height": 1}', '{col-span-4, row-span-1}'),
  ('tall', 'Tall', 'Extra height for content', '{"width": 1, "height": 2, "mobile_width": 1, "mobile_height": 2}', '{col-span-1, row-span-2}'),
  ('wide', 'Wide', 'Extra width for content', '{"width": 3, "height": 1, "mobile_width": 2, "mobile_height": 1}', '{col-span-3, row-span-1}')
ON CONFLICT (preset_name) DO NOTHING;

-- ============================================================================
-- HAPTIC FEEDBACK CONFIGURATION
-- ============================================================================

-- Haptic feedback settings per organization
CREATE TABLE IF NOT EXISTS organization_haptics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  intensity TEXT DEFAULT 'medium' CHECK (intensity IN ('light', 'medium', 'heavy')),
  feedback_events JSONB DEFAULT '{
    "widget_drag": "light",
    "widget_drop": "medium", 
    "long_press": "light",
    "success_action": "light",
    "error_action": "heavy",
    "button_press": "light",
    "navigation": "light"
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_dashboard_widgets_org ON dashboard_widgets(organization_id);
CREATE INDEX idx_dashboard_widgets_position ON dashboard_widgets(position_x, position_y);
CREATE INDEX idx_dashboard_layouts_org_device ON dashboard_layouts(organization_id, device_type);
CREATE INDEX idx_navigation_items_org ON navigation_items(organization_id);
CREATE INDEX idx_navigation_items_position ON navigation_items(position);
CREATE INDEX idx_google_fonts_category ON google_fonts_catalog(category);
CREATE INDEX idx_google_fonts_popularity ON google_fonts_catalog(popularity_rank);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_haptics ENABLE ROW LEVEL SECURITY;

-- Dashboard widgets policies
CREATE POLICY "Members can view org widgets"
  ON dashboard_widgets FOR SELECT
  USING (is_member_of_organization(organization_id));

CREATE POLICY "Admins can manage widgets"
  ON dashboard_widgets FOR ALL
  USING (is_admin_of_organization(organization_id));

-- Dashboard layouts policies
CREATE POLICY "Members can view org layouts"
  ON dashboard_layouts FOR SELECT
  USING (is_member_of_organization(organization_id));

CREATE POLICY "Admins can manage layouts"
  ON dashboard_layouts FOR ALL
  USING (is_admin_of_organization(organization_id));

-- Navigation items policies
CREATE POLICY "Members can view org navigation"
  ON navigation_items FOR SELECT
  USING (is_member_of_organization(organization_id));

CREATE POLICY "Admins can manage navigation"
  ON navigation_items FOR ALL
  USING (is_admin_of_organization(organization_id));

-- Haptics policies
CREATE POLICY "Members can view org haptics"
  ON organization_haptics FOR SELECT
  USING (is_member_of_organization(organization_id));

CREATE POLICY "Admins can manage haptics"
  ON organization_haptics FOR ALL
  USING (is_admin_of_organization(organization_id));

-- ============================================================================
-- FUNCTIONS FOR EXTREME MODULARITY
-- ============================================================================

-- Create default dashboard for new organization
CREATE OR REPLACE FUNCTION create_default_dashboard_layout(p_org_id UUID, p_device_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_layout_id UUID;
BEGIN
  -- Create default layout
  INSERT INTO dashboard_layouts (
    organization_id, 
    layout_name, 
    device_type, 
    is_default, 
    layout_data
  ) VALUES (
    p_org_id,
    'Default Layout',
    p_device_type,
    true,
    CASE p_device_type
      WHEN 'mobile' THEN '[
        {"id": "stats", "x": 0, "y": 0, "w": 2, "h": 1},
        {"id": "events", "x": 0, "y": 1, "w": 2, "h": 1},
        {"id": "social", "x": 0, "y": 2, "w": 2, "h": 2}
      ]'::jsonb
      WHEN 'tablet' THEN '[
        {"id": "stats", "x": 0, "y": 0, "w": 4, "h": 1},
        {"id": "events", "x": 0, "y": 1, "w": 2, "h": 1},
        {"id": "social", "x": 2, "y": 1, "w": 2, "h": 2},
        {"id": "challenges", "x": 0, "y": 2, "w": 2, "h": 1}
      ]'::jsonb
      ELSE '[
        {"id": "stats", "x": 0, "y": 0, "w": 4, "h": 1},
        {"id": "events", "x": 0, "y": 1, "w": 2, "h": 1},
        {"id": "social", "x": 2, "y": 1, "w": 2, "h": 1},
        {"id": "challenges", "x": 0, "y": 2, "w": 2, "h": 1},
        {"id": "members", "x": 2, "y": 2, "w": 2, "h": 1}
      ]'::jsonb
    END
  ) RETURNING id INTO v_layout_id;

  -- Create default widgets
  INSERT INTO dashboard_widgets (organization_id, widget_type, title, position_x, position_y, width, height)
  SELECT 
    p_org_id,
    unnest(ARRAY['stats_overview', 'recent_events', 'social_feed', 'challenges_progress', 'member_activity']),
    unnest(ARRAY['Statistics', 'Upcoming Events', 'Social Feed', 'Challenges', 'Member Activity']),
    unnest(ARRAY[0, 0, 2, 0, 2]),
    unnest(ARRAY[0, 1, 1, 2, 2]),
    unnest(ARRAY[4, 2, 2, 2, 2]),
    unnest(ARRAY[1, 1, 1, 1, 1])
  WHERE p_device_type = 'desktop';

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Load Google Font dynamically
CREATE OR REPLACE FUNCTION load_google_font(p_org_id UUID, p_font_family TEXT)
RETURNS TEXT AS $$
DECLARE
  v_font_url TEXT;
BEGIN
  -- Get font URL from catalog
  SELECT url INTO v_font_url
  FROM google_fonts_catalog
  WHERE family = p_font_family;
  
  IF v_font_url IS NULL THEN
    RETURN null;
  END IF;
  
  -- Update organization typography
  UPDATE organization_typography
  SET 
    custom_heading_font = p_font_family,
    custom_heading_font_url = v_font_url,
    updated_at = NOW()
  WHERE organization_id = p_org_id;
  
  RETURN v_font_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS FOR EXTREME MODULARITY
-- ============================================================================

-- Create default dashboard and haptics when organization is created
CREATE OR REPLACE FUNCTION create_extreme_modularity_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default dashboard layouts for all devices
  PERFORM create_default_dashboard_layout(NEW.id, 'mobile');
  PERFORM create_default_dashboard_layout(NEW.id, 'tablet');
  PERFORM create_default_dashboard_layout(NEW.id, 'desktop');
  
  -- Create default haptics settings
  INSERT INTO organization_haptics (organization_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_extreme_defaults_on_org_create
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_extreme_modularity_defaults();

-- Update widget positions trigger
CREATE OR REPLACE FUNCTION update_widget_positions()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dashboard_widgets_timestamp
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_widget_positions();

COMMIT;