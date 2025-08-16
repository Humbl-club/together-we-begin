import { Database } from '@/integrations/supabase/types';

// Export convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['social_posts']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type Challenge = Database['public']['Tables']['challenges']['Row'];
export type Message = Database['public']['Tables']['direct_messages']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type EventRegistration = Database['public']['Tables']['event_registrations']['Row'];
export type ChallengeParticipation = Database['public']['Tables']['challenge_participations']['Row'];
export type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];
export type PostComment = Database['public']['Tables']['post_comments']['Row'];
export type PostLike = Database['public']['Tables']['post_likes']['Row'];

// Insert types for creating new records
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type PostInsert = Database['public']['Tables']['social_posts']['Insert'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type ChallengeInsert = Database['public']['Tables']['challenges']['Insert'];
export type MessageInsert = Database['public']['Tables']['direct_messages']['Insert'];

// Update types for modifying records
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type PostUpdate = Database['public']['Tables']['social_posts']['Update'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];
export type ChallengeUpdate = Database['public']['Tables']['challenges']['Update'];

// Extended types with relations
export interface PostWithProfile extends Post {
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  user_liked?: boolean;
}

export interface EventWithRegistration extends Event {
  is_registered?: boolean;
  registration_status?: string;
}

export interface ChallengeWithParticipation extends Challenge {
  user_participation?: ChallengeParticipation;
  is_participating?: boolean;
}

export interface MessageThread {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string | null;
  last_message_id: string | null;
  other_user?: Profile;
  unread_count?: number;
  other_user_name?: string;
  other_user_avatar?: string;
}

export interface CommentWithProfile extends PostComment {
  profiles: Profile;
}

export interface UserStats {
  upcoming_events: number;
  active_challenges: number;
  total_posts: number;
  recent_points: number;
}

export interface DashboardData {
  user_profile: Profile;
  stats: UserStats;
  recent_events: Event[];
  active_challenges: Challenge[];
  recent_posts: Post[];
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}