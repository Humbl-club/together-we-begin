// Organization-related TypeScript types for multi-tenant system
// These supplement the main Supabase types until they're regenerated

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id?: string;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'inactive' | 'suspended' | 'cancelled';
  subscription_expires_at?: string;
  max_members: number;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  invited_by?: string;
  invited_at?: string;
  joined_at: string;
  status: 'active' | 'inactive' | 'suspended';
  organizations?: Organization;
}

export interface OrganizationFeature {
  id: string;
  organization_id: string;
  feature_key: string;
  enabled: boolean;
  configuration?: Record<string, any>;
  price_override?: number;
  enabled_at?: string;
  enabled_by?: string;
  updated_at: string;
}

export interface FeatureCatalogItem {
  key: string;
  name: string;
  description?: string;
  category: 'core' | 'social' | 'events' | 'wellness' | 'commerce' | 'admin';
  base_price: number;
  dependencies: string[];
  conflicts: string[];
  configuration_schema?: Record<string, any>;
  available: boolean;
  min_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  created_at: string;
}

export interface InviteCode {
  id: string;
  organization_id: string;
  code: string;
  type: 'permanent' | 'limited' | 'one-time' | 'event';
  max_uses?: number;
  current_uses: number;
  expires_at?: string;
  email_domain?: string;
  age_minimum?: number;
  default_role: 'member' | 'moderator' | 'admin';
  auto_approve: boolean;
  custom_welcome_message?: string;
  source?: string;
  campaign?: string;
  qr_code_url?: string;
  qr_style: 'square' | 'rounded' | 'dots';
  qr_color: string;
  qr_background: string;
  qr_logo_enabled: boolean;
  created_by?: string;
  created_at: string;
  last_used_at?: string;
}

export interface InviteRedemption {
  id: string;
  invite_code_id: string;
  redeemed_by: string;
  redeemed_at: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  device_type?: string;
  country?: string;
  city?: string;
}

export interface ClubSignupPage {
  id: string;
  organization_id: string;
  logo_url?: string;
  club_name?: string;
  tagline?: string;
  background_type: 'color' | 'gradient' | 'image';
  background_value: string;
  welcome_title: string;
  welcome_text?: string;
  require_phone: boolean;
  require_birthdate: boolean;
  require_gender: boolean;
  custom_fields: Array<{
    label: string;
    type: string;
    required: boolean;
    options?: string[];
  }>;
  terms_text?: string;
  privacy_text?: string;
  marketing_consent_text?: string;
  button_color: string;
  button_text_color: string;
  button_text: string;
  auto_approve: boolean;
  default_role: string;
  send_welcome_email: boolean;
  redirect_after_signup: string;
  meta_title?: string;
  meta_description?: string;
  og_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationBan {
  id: string;
  organization_id: string;
  banned_user_id: string;
  banned_by: string;
  reason: string;
  ban_type: 'permanent' | 'temporary';
  expires_at?: string;
  ip_addresses: string[];
  device_ids: string[];
  is_active: boolean;
  lifted_at?: string;
  lifted_by?: string;
  lift_reason?: string;
  created_at: string;
}

export interface ContentDeletion {
  id: string;
  organization_id: string;
  content_type: 'post' | 'message' | 'comment' | 'image' | 'event' | 'challenge';
  content_id: string;
  content_table: string;
  deleted_by: string;
  deletion_reason?: string;
  deletion_type: 'soft' | 'hard';
  original_content: Record<string, any>;
  original_author_id?: string;
  original_created_at?: string;
  deleted_at: string;
}

export interface ModerationAction {
  id: string;
  organization_id: string;
  action_type: 'delete_content' | 'ban_user' | 'warn_user' | 'mute_user' | 'unban_user' | 'restore_content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  target_user_id?: string;
  target_content_id?: string;
  target_content_type?: string;
  performed_by: string;
  moderator_role?: string;
  reason: string;
  notes?: string;
  evidence?: Record<string, any>;
  requires_review: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

export interface UserWarning {
  id: string;
  organization_id: string;
  user_id: string;
  warned_by: string;
  warning_type: 'general' | 'content' | 'behavior' | 'spam' | 'harassment';
  severity: 'low' | 'medium' | 'high';
  message: string;
  related_content_id?: string;
  related_content_type?: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  created_at: string;
}

export interface ContentReport {
  id: string;
  organization_id: string;
  content_type: 'post' | 'message' | 'comment' | 'profile' | 'event';
  content_id: string;
  reported_by: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'copyright' | 'other';
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolved_by?: string;
  resolved_at?: string;
  resolution?: string;
  action_taken?: string;
  created_at: string;
}

export interface OrganizationTypography {
  id: string;
  organization_id: string;
  font_preset: 'alo-inspired' | 'modern' | 'classic' | 'playful' | 'bold';
  custom_heading_font?: string;
  custom_heading_font_url?: string;
  custom_body_font?: string;
  custom_body_font_url?: string;
  base_font_size: number;
  heading_size_scale: number;
  use_light_weight: boolean;
  use_bold_headings: boolean;
  heading_letter_spacing: 'tight' | 'normal' | 'wide';
  line_height_style: 'tight' | 'normal' | 'relaxed';
  created_at: string;
  updated_at: string;
}

export interface OrganizationTheme {
  id: string;
  organization_id: string;
  theme_preset: 'alo-minimal' | 'vibrant' | 'dark' | 'pastel' | 'custom';
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  text_primary: string;
  text_secondary: string;
  text_muted: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  info_color: string;
  border_color: string;
  divider_color: string;
  button_radius: string;
  button_padding: string;
  card_radius: string;
  card_shadow: string;
  dark_mode_enabled: boolean;
  dark_mode_auto: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationLayout {
  id: string;
  organization_id: string;
  dashboard_layout: 'classic' | 'social-focus' | 'events-focus' | 'minimal';
  show_stats_widget: boolean;
  show_events_widget: boolean;
  show_social_widget: boolean;
  show_members_widget: boolean;
  show_challenges_widget: boolean;
  sidebar_position: 'left' | 'right' | 'none';
  nav_position: 'top' | 'bottom' | 'sidebar';
  content_density: 'compact' | 'normal' | 'spacious';
  created_at: string;
  updated_at: string;
}

export interface OrganizationBranding {
  id: string;
  organization_id: string;
  logo_light_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  og_image_url?: string;
  app_icon_url?: string;
  app_icon_192_url?: string;
  app_icon_512_url?: string;
  login_background_url?: string;
  dashboard_background_url?: string;
  created_at: string;
  updated_at: string;
}

// Extended profile type with organization context
export interface ProfileWithOrganization {
  id: string;
  display_name?: string;
  avatar_url?: string;
  email?: string;
  current_organization_id?: string;
  // ... other profile fields
}

// Dashboard widget types
export interface DashboardWidget {
  id: string;
  organization_id: string;
  widget_type: string;
  title: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  size_preset: 'small' | 'medium' | 'large' | 'full';
  is_visible: boolean;
  configuration: Record<string, any>;
  style_overrides: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NavigationItem {
  id: string;
  organization_id: string;
  item_type: 'page' | 'external_link' | 'action' | 'separator';
  label: string;
  icon?: string;
  url?: string;
  action?: string;
  position: number;
  parent_id?: string;
  is_visible: boolean;
  requires_auth: boolean;
  required_role?: string;
  device_visibility: 'all' | 'mobile' | 'tablet' | 'desktop';
  style_overrides: Record<string, any>;
}

export interface PlatformAdmin {
  id: string;
  user_id: string;
  role: 'super_admin' | 'platform_moderator' | 'billing_admin' | 'support_admin';
  permissions: string[];
  is_active: boolean;
  last_active_at: string;
  created_at: string;
}

// Helper types for organization context
export interface OrganizationContextType {
  // Core organization data
  currentOrganization: Organization | null;
  userMemberships: OrganizationMember[];
  switchOrganization: (orgId: string) => Promise<void>;
  userRole: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  isOwner: boolean;
  isMember: boolean;
  isPlatformAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  error: string | null;
  
  // Multi-tenant features
  organizationFeatures: OrganizationFeature[];
  featureCatalog: FeatureCatalogItem[];
  organizationTheme: OrganizationTheme | null;
  organizationTypography: OrganizationTypography | null;
  organizationBranding: OrganizationBranding | null;
  organizationLayout: OrganizationLayout | null;
  inviteCodes: InviteCode[];
  signupPage: ClubSignupPage | null;
  dashboardWidgets: DashboardWidget[];
  navigationItems: NavigationItem[];
  platformAdmin: PlatformAdmin | null;
  organizationStats: any;
  
  // Feature management
  isFeatureEnabled: (featureKey: string) => boolean;
  toggleFeature: (featureKey: string, enabled: boolean) => Promise<void>;
  
  // Theme management
  updateTheme: (updates: Partial<OrganizationTheme>) => Promise<void>;
  updateTypography: (updates: Partial<OrganizationTypography>) => Promise<void>;
  updateBranding: (updates: Partial<OrganizationBranding>) => Promise<void>;
  
  // Widget management
  addWidget: (widget: Partial<DashboardWidget>) => Promise<void>;
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => Promise<void>;
  removeWidget: (widgetId: string) => Promise<void>;
  
  // Invite management
  createInviteCode: (inviteData: Partial<InviteCode>) => Promise<InviteCode>;
  
  // Refresh functions
  refreshOrganization: () => Promise<void>;
  refreshFeatures: () => Promise<void>;
  refreshTheme: () => Promise<void>;
  refreshWidgets: () => Promise<void>;
}