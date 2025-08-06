// Comprehensive type definitions to replace any[] usage
import { Database } from '@/integrations/supabase/types';

// Database table types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['social_posts']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type Challenge = Database['public']['Tables']['challenges']['Row'];
export type Message = Database['public']['Tables']['direct_messages']['Row'];
export type Comment = Database['public']['Tables']['post_comments']['Row'];
export type PostLike = Database['public']['Tables']['post_likes']['Row'];
export type EventRegistration = Database['public']['Tables']['event_registrations']['Row'];
export type ChallengeParticipation = Database['public']['Tables']['challenge_participations']['Row'];
export type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];
export type HealthData = Database['public']['Tables']['health_data']['Row'];
export type WalkingLeaderboard = Database['public']['Tables']['walking_leaderboards']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type PostInsert = Database['public']['Tables']['social_posts']['Insert'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type ChallengeInsert = Database['public']['Tables']['challenges']['Insert'];
export type MessageInsert = Database['public']['Tables']['direct_messages']['Insert'];
export type CommentInsert = Database['public']['Tables']['post_comments']['Insert'];

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type PostUpdate = Database['public']['Tables']['social_posts']['Update'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];
export type ChallengeUpdate = Database['public']['Tables']['challenges']['Update'];

// Enhanced types with joins
export interface PostWithProfile {
  id: string;
  user_id: string | null;
  content: string | null;
  image_urls: string[] | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  is_story: boolean | null;
  expires_at: string | null;
  status: Database['public']['Enums']['post_status'] | null;
  profile_data: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  user_liked?: boolean;
}

export interface CommentWithProfile {
  id: string;
  post_id: string | null;
  user_id: string | null;
  content: string;
  created_at: string | null;
  updated_at: string | null;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface EventWithRegistration extends Event {
  is_registered: boolean;
  registration_status: Database['public']['Enums']['payment_status'] | null;
}

export interface ChallengeWithParticipation extends Challenge {
  is_participating: boolean;
  user_progress?: {
    total_steps: number;
    daily_steps: Record<string, number>;
    completed: boolean;
  };
}

export interface LeaderboardEntry {
  user_id: string;
  total_steps: number;
  daily_steps: Record<string, number>;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  };
  rank?: number;
}

export interface DashboardStats {
  loyaltyPoints: number;
  upcomingEvents: number;
  activeChallenges: number;
  totalPosts: number;
  recentPoints: number;
}

export interface UserStats {
  posts_created: number;
  posts_liked: number;
  comments_made: number;
  events_attended: number;
  challenges_completed: number;
  total_steps: number;
  current_streak: number;
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  content: string | null;
  data: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
}

export interface MessageThread {
  thread_id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string | null;
  last_message_id: string | null;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  unread_count: number;
}

export interface MessageWithSender extends Message {
  sender_profile: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isDirty: boolean;
}

// File upload types
export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: Date;
  user_id?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Real-time types
export interface RealtimeChannel {
  subscribe: () => void;
  unsubscribe: () => void;
  send: (event: string, payload: any) => void;
}

export interface UserPresence {
  user_id: string;
  online: boolean;
  last_seen: string;
}

// Search types
export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  filters: Record<string, any>;
}

// Settings types
export interface UserSettings {
  appearance: {
    theme: 'light' | 'dark' | 'system';
    glassmorphism_enabled: boolean;
    animations_enabled: boolean;
    font_size: 'small' | 'medium' | 'large';
  };
  notifications: {
    push_enabled: boolean;
    email_enabled: boolean;
    event_reminders: boolean;
    challenge_updates: boolean;
    social_interactions: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'friends' | 'private';
    show_activity_status: boolean;
    allow_friend_requests: boolean;
    allow_messages: 'everyone' | 'friends' | 'none';
  };
  wellness: {
    daily_goal_steps: number;
    activity_reminders: boolean;
    water_reminders: boolean;
    sleep_tracking: boolean;
  };
}

// Error types
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
}