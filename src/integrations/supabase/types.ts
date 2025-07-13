export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      challenge_participations: {
        Row: {
          challenge_id: string | null
          completed: boolean | null
          completion_date: string | null
          id: string
          joined_at: string | null
          progress_data: Json | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          completed?: boolean | null
          completion_date?: string | null
          id?: string
          joined_at?: string | null
          progress_data?: Json | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          completed?: boolean | null
          completion_date?: string | null
          id?: string
          joined_at?: string | null
          progress_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participations_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_challenge_participations_challenge_id"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          badge_image_url: string | null
          badge_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          instructions: string | null
          points_reward: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["challenge_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          badge_image_url?: string | null
          badge_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          instructions?: string | null
          points_reward?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["challenge_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          badge_image_url?: string | null
          badge_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          instructions?: string | null
          points_reward?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["challenge_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_content_id: string
          reported_content_type: string
          reported_user_id: string | null
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_content_id: string
          reported_content_type: string
          reported_user_id?: string | null
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_content_id?: string
          reported_content_type?: string
          reported_user_id?: string | null
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          media_url: string | null
          message_type: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_url?: string | null
          message_type?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_url?: string | null
          message_type?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          event_id: string | null
          id: string
          loyalty_points_used: number | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          registered_at: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          loyalty_points_used?: number | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          registered_at?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          loyalty_points_used?: number | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          registered_at?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_registrations_event_id"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_capacity: number | null
          description: string | null
          end_time: string | null
          id: string
          image_url: string | null
          location: string | null
          loyalty_points_price: number | null
          max_capacity: number | null
          price_cents: number | null
          start_time: string
          status: Database["public"]["Enums"]["event_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_capacity?: number | null
          description?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          loyalty_points_price?: number | null
          max_capacity?: number | null
          price_cents?: number | null
          start_time: string
          status?: Database["public"]["Enums"]["event_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_capacity?: number | null
          description?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          loyalty_points_price?: number | null
          max_capacity?: number | null
          price_cents?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          calendar_sync: boolean | null
          created_at: string
          fitness_tracker_token: string | null
          fitness_tracker_type: string | null
          id: string
          social_media_crosspost: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_sync?: boolean | null
          created_at?: string
          fitness_tracker_token?: string | null
          fitness_tracker_type?: string | null
          id?: string
          social_media_crosspost?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_sync?: boolean | null
          created_at?: string
          fitness_tracker_token?: string | null
          fitness_tracker_type?: string | null
          id?: string
          social_media_crosspost?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          status: Database["public"]["Enums"]["invite_status"] | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["invite_status"] | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["invite_status"] | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_invites_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invites_used_by"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      message_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_id: string | null
          participant_1: string
          participant_2: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_id?: string | null
          participant_1: string
          participant_2: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_id?: string | null
          participant_1?: string
          participant_2?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string
          data: Json | null
          id: string
          read_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string
          id: string
          load_time_ms: number
          page_url: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          load_time_ms: number
          page_url: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          load_time_ms?: number
          page_url?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_post_comments_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_post_likes_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_settings: {
        Row: {
          allow_friend_requests: boolean
          allow_location_sharing: boolean
          allow_messages: string
          created_at: string
          id: string
          profile_visibility: string
          show_activity_status: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_friend_requests?: boolean
          allow_location_sharing?: boolean
          allow_messages?: string
          created_at?: string
          id?: string
          profile_visibility?: string
          show_activity_status?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_friend_requests?: boolean
          allow_location_sharing?: boolean
          allow_messages?: string
          created_at?: string
          id?: string
          profile_visibility?: string
          show_activity_status?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available_loyalty_points: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          instagram_handle: string | null
          location: string | null
          total_loyalty_points: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          available_loyalty_points?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          instagram_handle?: string | null
          location?: string | null
          total_loyalty_points?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          available_loyalty_points?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          instagram_handle?: string | null
          location?: string | null
          total_loyalty_points?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          image_urls: string[] | null
          is_story: boolean | null
          likes_count: number | null
          status: Database["public"]["Enums"]["post_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_urls?: string[] | null
          is_story?: boolean | null
          likes_count?: number | null
          status?: Database["public"]["Enums"]["post_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_urls?: string[] | null
          is_story?: boolean | null
          likes_count?: number | null
          status?: Database["public"]["Enums"]["post_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      story_reactions: {
        Row: {
          created_at: string
          id: string
          reaction: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction?: string
          story_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          challenges_completed: number | null
          comments_made: number | null
          created_at: string
          date: string
          events_attended: number | null
          id: string
          messages_sent: number | null
          posts_created: number | null
          posts_liked: number | null
          session_duration_minutes: number | null
          stories_viewed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          challenges_completed?: number | null
          comments_made?: number | null
          created_at?: string
          date?: string
          events_attended?: number | null
          id?: string
          messages_sent?: number | null
          posts_created?: number | null
          posts_liked?: number | null
          session_duration_minutes?: number | null
          stories_viewed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          challenges_completed?: number | null
          comments_made?: number | null
          created_at?: string
          date?: string
          events_attended?: number | null
          id?: string
          messages_sent?: number | null
          posts_created?: number | null
          posts_liked?: number | null
          session_duration_minutes?: number | null
          stories_viewed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_roles_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_data_v2: {
        Args: { user_id_param: string }
        Returns: {
          user_profile: Json
          stats: Json
          recent_events: Json
          active_challenges: Json
          recent_posts: Json
        }[]
      }
      get_events_optimized: {
        Args: {
          user_id_param?: string
          status_filter?: string
          limit_param?: number
          offset_param?: number
        }
        Returns: {
          id: string
          title: string
          description: string
          start_time: string
          end_time: string
          location: string
          image_url: string
          price_cents: number
          loyalty_points_price: number
          max_capacity: number
          current_capacity: number
          status: Database["public"]["Enums"]["event_status"]
          created_by: string
          created_at: string
          is_registered: boolean
          registration_status: Database["public"]["Enums"]["payment_status"]
        }[]
      }
      get_user_dashboard_optimized: {
        Args: { user_id_param: string }
        Returns: {
          user_data: Json
          stats_data: Json
          recent_activity: Json
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
      challenge_status: "active" | "completed" | "draft"
      event_status: "upcoming" | "ongoing" | "completed" | "cancelled"
      invite_status: "pending" | "used" | "expired"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      post_status: "active" | "flagged" | "removed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member"],
      challenge_status: ["active", "completed", "draft"],
      event_status: ["upcoming", "ongoing", "completed", "cancelled"],
      invite_status: ["pending", "used", "expired"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      post_status: ["active", "flagged", "removed"],
    },
  },
} as const
