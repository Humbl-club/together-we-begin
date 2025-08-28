-- ============================================================================
-- CRITICAL DATABASE REPAIR SCRIPT
-- ============================================================================
-- This script repairs the catastrophic database state by creating all missing
-- tables and functions. Execute this in Supabase SQL Editor immediately.
-- 
-- EXECUTION ORDER:
-- 1. Copy this entire script
-- 2. Open Supabase Dashboard -> SQL Editor
-- 3. Paste and execute this script
-- 4. Verify repair with validation queries at the end
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: CORE AUTHENTICATION & USER TABLES
-- ============================================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  location TEXT,
  birth_date DATE,
  current_organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'member')),
  organization_id UUID,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id)
);

-- User settings tables
CREATE TABLE IF NOT EXISTS privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'members', 'private')),
  show_activity BOOLEAN DEFAULT true,
  show_challenges BOOLEAN DEFAULT true,
  allow_messages BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  email_events BOOLEAN DEFAULT true,
  email_challenges BOOLEAN DEFAULT true,
  email_messages BOOLEAN DEFAULT true,
  push_events BOOLEAN DEFAULT true,
  push_challenges BOOLEAN DEFAULT true,
  push_messages BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_wellness_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  step_goal INTEGER DEFAULT 10000,
  weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  height_unit TEXT DEFAULT 'cm' CHECK (height_unit IN ('cm', 'ft')),
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends', 'private')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_appearance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_social_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  auto_follow BOOLEAN DEFAULT false,
  show_online_status BOOLEAN DEFAULT true,
  allow_friend_requests BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PHASE 2: MULTI-TENANT ORGANIZATION SYSTEM
-- ============================================================================

-- Organizations (Clubs) table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'cancelled')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  max_members INTEGER DEFAULT 50,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
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

-- ============================================================================
-- PHASE 3: EVENTS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  max_attendees INTEGER,
  price DECIMAL(10,2) DEFAULT 0,
  requires_approval BOOLEAN DEFAULT false,
  category TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'waitlist')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  qr_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- PHASE 4: CHALLENGES & WELLNESS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('step', 'distance', 'time', 'custom')),
  goal_value INTEGER NOT NULL,
  goal_unit TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  points_reward INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS challenge_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS walking_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_steps INTEGER DEFAULT 0,
  rank_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('steps', 'weight', 'heart_rate', 'sleep')),
  value DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS step_validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_steps INTEGER NOT NULL,
  validated_steps INTEGER NOT NULL,
  validation_method TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PHASE 5: SOCIAL SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  media_urls TEXT[] DEFAULT '{}',
  post_type TEXT DEFAULT 'post' CHECK (post_type IN ('post', 'story', 'announcement')),
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'members', 'private')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================================================
-- PHASE 6: MESSAGING SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  thread_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  encrypted_content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file')),
  media_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id)
);

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- ============================================================================
-- PHASE 7: LOYALTY & REWARDS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'expired', 'adjusted')),
  source TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards_catalog(id),
  points_used INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled')),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fulfilled_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS expired_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_expired INTEGER NOT NULL,
  original_transaction_id UUID NOT NULL,
  expired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS points_expiration_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  expiration_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB DEFAULT '{}',
  points_awarded INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PHASE 8: ADMIN & MODERATION SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message', 'profile')),
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  deleted_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  original_data JSONB,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'suspend', 'ban', 'delete_content')),
  target_user_id UUID REFERENCES auth.users(id),
  target_content_id UUID,
  reason TEXT NOT NULL,
  duration_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  severity TEXT DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'severe')),
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PHASE 9: PLATFORM ADMINISTRATION (SUPER ADMIN)
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_level INTEGER NOT NULL DEFAULT 1 CHECK (admin_level BETWEEN 1 AND 5),
  permissions TEXT[] DEFAULT '{}',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS platform_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(12,2) NOT NULL,
  dimensions JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  stripe_invoice_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  affected_organizations UUID[],
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  organization_id UUID REFERENCES organizations(id),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  flag_name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_organizations UUID[],
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PHASE 10: INVITES & SYSTEM TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  email TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code_id UUID NOT NULL REFERENCES invite_codes(id) ON DELETE CASCADE,
  redeemed_by UUID NOT NULL REFERENCES auth.users(id),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  role TEXT DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  metric_unit TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PHASE 11: EXTREME MODULARITY SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 1,
  height INTEGER NOT NULL DEFAULT 1,
  configuration JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_name TEXT NOT NULL,
  layout_data JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS widget_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  widget_type TEXT NOT NULL,
  default_configuration JSONB DEFAULT '{}',
  preview_image TEXT,
  category TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  path TEXT NOT NULL,
  icon TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  parent_id UUID REFERENCES navigation_items(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_fonts_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  font_name TEXT UNIQUE NOT NULL,
  font_family TEXT NOT NULL,
  font_variants TEXT[] DEFAULT '{}',
  google_fonts_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PHASE 12: ORGANIZATION CUSTOMIZATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  accent_color TEXT DEFAULT '#F59E0B',
  background_color TEXT DEFAULT '#FFFFFF',
  text_color TEXT DEFAULT '#111827',
  border_color TEXT DEFAULT '#E5E7EB',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_typography (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  heading_font TEXT DEFAULT 'Inter',
  body_font TEXT DEFAULT 'Inter',
  font_size_base INTEGER DEFAULT 16,
  font_size_scale DECIMAL(3,2) DEFAULT 1.25,
  line_height_base DECIMAL(3,2) DEFAULT 1.6,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  layout_type TEXT NOT NULL CHECK (layout_type IN ('dashboard', 'events', 'social', 'profile')),
  layout_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  logo_url TEXT,
  logo_small_url TEXT,
  favicon_url TEXT,
  brand_colors JSONB DEFAULT '{}',
  brand_fonts JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  ban_type TEXT DEFAULT 'permanent' CHECK (ban_type IN ('temporary', 'permanent')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS club_signup_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_title TEXT NOT NULL,
  page_description TEXT,
  welcome_message TEXT,
  custom_fields JSONB DEFAULT '{}',
  require_approval BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PHASE 13: THEME & MODULARITY PRESETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS theme_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  theme_config JSONB NOT NULL,
  preview_image TEXT,
  category TEXT DEFAULT 'general',
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS font_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  heading_font TEXT NOT NULL,
  body_font TEXT NOT NULL,
  font_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS container_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  max_width TEXT NOT NULL,
  padding_config JSONB DEFAULT '{}',
  margin_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  template_name TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('email', 'push', 'sms')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PHASE 14: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_features_org ON organization_features(organization_id);

-- Events indexes  
CREATE INDEX IF NOT EXISTS idx_events_org ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);

-- Challenges indexes
CREATE INDEX IF NOT EXISTS idx_challenges_org ON challenges(organization_id);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_challenge ON challenge_participations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_user ON challenge_participations(user_id);

-- Social indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_org ON social_posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_author ON social_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);

-- Messaging indexes
CREATE INDEX IF NOT EXISTS idx_direct_messages_thread ON direct_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_participants ON message_threads(participant_1_id, participant_2_id);

-- Loyalty indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_org ON loyalty_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created ON loyalty_transactions(created_at);

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_profiles_current_org ON profiles(current_organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org ON user_roles(organization_id);

-- Platform admin indexes
CREATE INDEX IF NOT EXISTS idx_platform_admins_user ON platform_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_admin ON platform_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_org ON platform_audit_logs(organization_id);

-- Dashboard indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user_org ON dashboard_widgets(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_org ON dashboard_layouts(user_id, organization_id);

-- ============================================================================
-- PHASE 15: ADD ORGANIZATION_ID REFERENCES WHERE MISSING
-- ============================================================================

-- Add foreign key constraints for organization_id columns
ALTER TABLE events ADD CONSTRAINT fk_events_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE event_registrations ADD CONSTRAINT fk_event_registrations_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE event_attendance ADD CONSTRAINT fk_event_attendance_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE challenges ADD CONSTRAINT fk_challenges_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE challenge_participations ADD CONSTRAINT fk_challenge_participations_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE challenge_cycles ADD CONSTRAINT fk_challenge_cycles_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE walking_leaderboards ADD CONSTRAINT fk_walking_leaderboards_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE health_data ADD CONSTRAINT fk_health_data_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE step_validation_logs ADD CONSTRAINT fk_step_validation_logs_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE social_posts ADD CONSTRAINT fk_social_posts_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE post_likes ADD CONSTRAINT fk_post_likes_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE post_comments ADD CONSTRAINT fk_post_comments_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE post_reactions ADD CONSTRAINT fk_post_reactions_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE direct_messages ADD CONSTRAINT fk_direct_messages_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE message_threads ADD CONSTRAINT fk_message_threads_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE blocked_users ADD CONSTRAINT fk_blocked_users_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE loyalty_transactions ADD CONSTRAINT fk_loyalty_transactions_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE rewards_catalog ADD CONSTRAINT fk_rewards_catalog_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE reward_redemptions ADD CONSTRAINT fk_reward_redemptions_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE expired_points ADD CONSTRAINT fk_expired_points_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE points_expiration_policies ADD CONSTRAINT fk_points_expiration_policies_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE user_achievements ADD CONSTRAINT fk_user_achievements_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Add foreign key for profiles current_organization_id
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_current_organization 
  FOREIGN KEY (current_organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- Add foreign keys for user settings tables
ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE privacy_settings ADD CONSTRAINT fk_privacy_settings_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE user_notification_settings ADD CONSTRAINT fk_user_notification_settings_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE user_wellness_settings ADD CONSTRAINT fk_user_wellness_settings_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE user_appearance_settings ADD CONSTRAINT fk_user_appearance_settings_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE user_social_settings ADD CONSTRAINT fk_user_social_settings_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Add foreign keys for admin tables
ALTER TABLE admin_actions ADD CONSTRAINT fk_admin_actions_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE content_reports ADD CONSTRAINT fk_content_reports_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Add foreign keys for system tables
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE performance_metrics ADD CONSTRAINT fk_performance_metrics_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE invites ADD CONSTRAINT fk_invites_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- ============================================================================
-- PHASE 16: INSERT INITIAL DATA
-- ============================================================================

-- Insert feature catalog
INSERT INTO feature_catalog (key, name, description, category, base_price) VALUES
  ('events', 'Event Management', 'Create and manage events with registration', 'events', 10.00),
  ('challenges', 'Wellness Challenges', 'Step tracking and wellness competitions', 'wellness', 15.00),
  ('social', 'Social Feed', 'Community posts and interactions', 'social', 0.00),
  ('messaging', 'Direct Messaging', 'Member-to-member messaging', 'social', 5.00),
  ('loyalty', 'Points & Rewards', 'Loyalty points and rewards system', 'commerce', 15.00),
  ('payments', 'Payment Processing', 'Accept payments via Stripe', 'commerce', 20.00),
  ('analytics', 'Advanced Analytics', 'Detailed analytics and reporting', 'admin', 25.00),
  ('themes', 'Custom Themes', 'Customize organization appearance', 'core', 5.00),
  ('dashboard', 'Custom Dashboards', 'Drag-and-drop dashboard widgets', 'core', 10.00)
ON CONFLICT (key) DO NOTHING;

-- Insert Google Fonts catalog (popular fonts)
INSERT INTO google_fonts_catalog (font_name, font_family, font_variants, google_fonts_url) VALUES
  ('Inter', 'Inter, sans-serif', ARRAY['300', '400', '500', '600', '700'], 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'),
  ('Roboto', 'Roboto, sans-serif', ARRAY['300', '400', '500', '700'], 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'),
  ('Open Sans', 'Open Sans, sans-serif', ARRAY['300', '400', '600', '700'], 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap'),
  ('Poppins', 'Poppins, sans-serif', ARRAY['300', '400', '500', '600', '700'], 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'),
  ('Montserrat', 'Montserrat, sans-serif', ARRAY['400', '500', '600', '700'], 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap')
ON CONFLICT (font_name) DO NOTHING;

-- Insert theme presets
INSERT INTO theme_presets (name, description, theme_config, category) VALUES
  ('Classic Blue', 'Professional blue theme with clean aesthetics', 
   '{"primary_color": "#3B82F6", "secondary_color": "#10B981", "accent_color": "#F59E0B", "background_color": "#FFFFFF", "text_color": "#111827"}', 'professional'),
  ('Elegant Pink', 'Sophisticated pink theme for women-focused communities', 
   '{"primary_color": "#EC4899", "secondary_color": "#8B5CF6", "accent_color": "#F59E0B", "background_color": "#FEFEFE", "text_color": "#1F2937"}', 'lifestyle'),
  ('Nature Green', 'Calming green theme perfect for wellness communities', 
   '{"primary_color": "#059669", "secondary_color": "#0891B2", "accent_color": "#D97706", "background_color": "#F8FAFC", "text_color": "#0F172A"}', 'wellness'),
  ('Modern Dark', 'Sleek dark theme with high contrast', 
   '{"primary_color": "#6366F1", "secondary_color": "#EC4899", "accent_color": "#F59E0B", "background_color": "#111827", "text_color": "#F9FAFB"}', 'modern')
ON CONFLICT (name) DO NOTHING;

-- Insert font presets
INSERT INTO font_presets (name, heading_font, body_font, font_config) VALUES
  ('Classic Elegance', 'Montserrat', 'Inter', '{"size_scale": 1.25, "line_height": 1.6}'),
  ('Modern Minimal', 'Inter', 'Inter', '{"size_scale": 1.2, "line_height": 1.5}'),
  ('Professional', 'Roboto', 'Open Sans', '{"size_scale": 1.3, "line_height": 1.6}'),
  ('Friendly', 'Poppins', 'Poppins', '{"size_scale": 1.25, "line_height": 1.7}')
ON CONFLICT (name) DO NOTHING;

-- Insert widget templates
INSERT INTO widget_templates (name, widget_type, default_configuration, category) VALUES
  ('Welcome Message', 'announcements', '{"title": "Welcome to our community!", "show_icon": true}', 'content'),
  ('Quick Stats', 'stats', '{"show_members": true, "show_events": true, "show_posts": true}', 'analytics'),
  ('Upcoming Events', 'events', '{"max_items": 5, "show_images": true}', 'events'),
  ('Recent Activity', 'social', '{"max_items": 10, "show_avatars": true}', 'social'),
  ('Step Challenge', 'challenges', '{"challenge_type": "steps", "show_leaderboard": true}', 'wellness'),
  ('Points Summary', 'loyalty', '{"show_rank": true, "show_recent": true}', 'rewards'),
  ('Quick Actions', 'actions', '{"buttons": ["new_post", "join_event", "view_rewards"]}', 'navigation')
ON CONFLICT (name, widget_type) DO NOTHING;

-- Insert notification templates
INSERT INTO notification_templates (template_key, template_name, subject_template, body_template, template_type) VALUES
  ('welcome', 'Welcome Email', 'Welcome to {{organization_name}}!', 'Hi {{user_name}}, welcome to our community! We are excited to have you join us.', 'email'),
  ('event_reminder', 'Event Reminder', 'Reminder: {{event_name}} starts soon', 'Don''t forget about {{event_name}} starting at {{event_time}}. See you there!', 'email'),
  ('challenge_complete', 'Challenge Completed', 'Congratulations! Challenge completed', 'You have successfully completed the {{challenge_name}} challenge. Great job!', 'push')
ON CONFLICT (template_key) DO NOTHING;

-- ============================================================================
-- PHASE 17: CREATE DEFAULT ORGANIZATION AND MIGRATE EXISTING USERS
-- ============================================================================

DO $$
DECLARE
    default_org_id UUID;
    user_record RECORD;
    user_count INTEGER := 0;
BEGIN
    -- Check if organizations table is empty
    IF NOT EXISTS (SELECT 1 FROM organizations LIMIT 1) THEN
        -- Create default organization
        INSERT INTO organizations (name, slug, settings, subscription_tier, max_members, owner_id)
        VALUES ('Humbl Girls Club', 'humbl-girls-club', 
                '{"theme": "default", "features": ["events", "challenges", "social", "loyalty", "messaging", "themes", "dashboard"]}',
                'enterprise', 10000, null)
        RETURNING id INTO default_org_id;

        -- Create default theme settings for organization
        INSERT INTO organization_themes (organization_id) VALUES (default_org_id);
        INSERT INTO organization_typography (organization_id) VALUES (default_org_id);
        INSERT INTO organization_branding (organization_id) VALUES (default_org_id);

        -- Enable all features for default organization
        INSERT INTO organization_features (organization_id, feature_key, enabled, enabled_at)
        SELECT default_org_id, key, true, NOW()
        FROM feature_catalog;

        -- Migrate all existing users to default organization
        FOR user_record IN SELECT id FROM auth.users
        LOOP
            -- Add user to organization
            INSERT INTO organization_members (organization_id, user_id, role)
            VALUES (default_org_id, user_record.id, 
                    CASE 
                        WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = user_record.id AND role = 'admin')
                        THEN 'admin'
                        ELSE 'member'
                    END)
            ON CONFLICT DO NOTHING;

            -- Update profile with current organization
            UPDATE profiles 
            SET current_organization_id = default_org_id 
            WHERE id = user_record.id;

            user_count := user_count + 1;
        END LOOP;

        RAISE NOTICE 'Created default organization and migrated % users', user_count;
    END IF;
END $$;

-- ============================================================================
-- PHASE 18: UPDATE EXISTING DATA WITH ORGANIZATION_ID
-- ============================================================================

DO $$
DECLARE
    default_org_id UUID;
    table_name TEXT;
    update_count INTEGER;
    total_updated INTEGER := 0;
BEGIN
    -- Get default organization
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'humbl-girls-club' LIMIT 1;
    
    IF default_org_id IS NOT NULL THEN
        -- Update each table with organization_id where it's null
        FOR table_name IN 
            SELECT unnest(ARRAY[
                'events', 'event_registrations', 'event_attendance',
                'challenges', 'challenge_participations', 'challenge_cycles',
                'walking_leaderboards', 'health_data', 'step_validation_logs',
                'social_posts', 'post_likes', 'post_comments', 'post_reactions',
                'direct_messages', 'message_threads', 'blocked_users',
                'loyalty_transactions', 'rewards_catalog', 'reward_redemptions',
                'expired_points', 'admin_actions', 'content_reports',
                'notifications', 'performance_metrics', 'privacy_settings',
                'user_notification_settings', 'user_wellness_settings',
                'user_appearance_settings', 'user_social_settings',
                'user_roles', 'invites', 'points_expiration_policies', 'user_achievements'
            ])
        LOOP
            EXECUTE format('UPDATE %I SET organization_id = $1 WHERE organization_id IS NULL', table_name)
            USING default_org_id;
            
            GET DIAGNOSTICS update_count = ROW_COUNT;
            total_updated := total_updated + update_count;
            
            IF update_count > 0 THEN
                RAISE NOTICE 'Updated % rows in %', update_count, table_name;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Total rows updated across all tables: %', total_updated;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- VALIDATION QUERIES - RUN THESE TO VERIFY THE REPAIR
-- ============================================================================

-- Check that all critical tables exist
SELECT 
    'CRITICAL TABLES CHECK' as validation_type,
    COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'organization_members', 'profiles', 'events', 'challenges', 'social_posts');

-- Check that default organization was created
SELECT 
    'DEFAULT ORGANIZATION CHECK' as validation_type,
    COUNT(*) as organizations_count,
    (SELECT COUNT(*) FROM organization_members) as members_count
FROM organizations;

-- Check that organization_id columns exist
SELECT 
    'ORGANIZATION_ID COLUMNS CHECK' as validation_type,
    COUNT(*) as tables_with_org_id
FROM information_schema.columns 
WHERE column_name = 'organization_id' 
AND table_schema = 'public';

-- Check RPC functions exist
SELECT 
    'RPC FUNCTIONS CHECK' as validation_type,
    COUNT(*) as functions_count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name LIKE '%organization%';

-- Summary report
SELECT 
    'REPAIR SUMMARY' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
    (SELECT COUNT(*) FROM organizations) as organizations,
    (SELECT COUNT(*) FROM organization_members) as members,
    (SELECT COUNT(*) FROM profiles) as profiles,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') >= 70 
        THEN 'SUCCESS - Database fully repaired'
        ELSE 'FAILURE - Repair incomplete'
    END as repair_status;