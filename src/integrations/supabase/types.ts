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
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
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
      challenge_cycles: {
        Row: {
          created_at: string
          cycle_end: string
          cycle_start: string
          id: string
          parent_challenge_id: string
          participants_count: number | null
          runner_up_user_id: string | null
          status: string | null
          updated_at: string
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string
          cycle_end: string
          cycle_start: string
          id?: string
          parent_challenge_id: string
          participants_count?: number | null
          runner_up_user_id?: string | null
          status?: string | null
          updated_at?: string
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string
          cycle_end?: string
          cycle_start?: string
          id?: string
          parent_challenge_id?: string
          participants_count?: number | null
          runner_up_user_id?: string | null
          status?: string | null
          updated_at?: string
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_cycles_parent_challenge_id_fkey"
            columns: ["parent_challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
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
          auto_award_enabled: boolean | null
          badge_image_url: string | null
          badge_name: string | null
          challenge_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          instructions: string | null
          participation_reward_points: number | null
          points_reward: number | null
          runner_up_reward_points: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["challenge_status"] | null
          step_goal: number | null
          title: string
          updated_at: string | null
          winner_reward_points: number | null
        }
        Insert: {
          auto_award_enabled?: boolean | null
          badge_image_url?: string | null
          badge_name?: string | null
          challenge_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          instructions?: string | null
          participation_reward_points?: number | null
          points_reward?: number | null
          runner_up_reward_points?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["challenge_status"] | null
          step_goal?: number | null
          title: string
          updated_at?: string | null
          winner_reward_points?: number | null
        }
        Update: {
          auto_award_enabled?: boolean | null
          badge_image_url?: string | null
          badge_name?: string | null
          challenge_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          instructions?: string | null
          participation_reward_points?: number | null
          points_reward?: number | null
          runner_up_reward_points?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["challenge_status"] | null
          step_goal?: number | null
          title?: string
          updated_at?: string | null
          winner_reward_points?: number | null
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
        Relationships: [
          {
            foreignKeyName: "content_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      event_attendance: {
        Row: {
          attended_at: string
          created_at: string
          event_id: string
          id: string
          points_awarded: number | null
          user_id: string
          verified_by: string | null
        }
        Insert: {
          attended_at?: string
          created_at?: string
          event_id: string
          id?: string
          points_awarded?: number | null
          user_id: string
          verified_by?: string | null
        }
        Update: {
          attended_at?: string
          created_at?: string
          event_id?: string
          id?: string
          points_awarded?: number | null
          user_id?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
          attendance_points: number | null
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
          qr_code_generated_at: string | null
          qr_code_generated_by: string | null
          qr_code_token: string | null
          start_time: string
          status: Database["public"]["Enums"]["event_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attendance_points?: number | null
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
          qr_code_generated_at?: string | null
          qr_code_generated_by?: string | null
          qr_code_token?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["event_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attendance_points?: number | null
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
          qr_code_generated_at?: string | null
          qr_code_generated_by?: string | null
          qr_code_token?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      expired_points: {
        Row: {
          expired_at: string
          expiry_reason: string
          id: string
          original_transaction_id: string | null
          points_expired: number
          user_id: string
        }
        Insert: {
          expired_at?: string
          expiry_reason?: string
          id?: string
          original_transaction_id?: string | null
          points_expired: number
          user_id: string
        }
        Update: {
          expired_at?: string
          expiry_reason?: string
          id?: string
          original_transaction_id?: string | null
          points_expired?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expired_points_original_transaction_id_fkey"
            columns: ["original_transaction_id"]
            isOneToOne: false
            referencedRelation: "loyalty_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expired_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          current_uses: number | null
          expires_at: string | null
          id: string
          invite_type: string | null
          max_uses: number | null
          metadata: Json | null
          notes: string | null
          status: Database["public"]["Enums"]["invite_status"] | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          invite_type?: string | null
          max_uses?: number | null
          metadata?: Json | null
          notes?: string | null
          status?: Database["public"]["Enums"]["invite_status"] | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          invite_type?: string | null
          max_uses?: number | null
          metadata?: Json | null
          notes?: string | null
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
          expires_at: string | null
          id: string
          metadata: Json | null
          points: number
          reference_id: string | null
          reference_type: string | null
          source_category: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          points: number
          reference_id?: string | null
          reference_type?: string | null
          source_category?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          source_category?: string | null
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
      notification_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          title?: string
          type?: string
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
      points_expiration_policies: {
        Row: {
          applies_to_point_type: string | null
          created_at: string
          expiration_months: number
          id: string
          is_active: boolean
          policy_name: string
        }
        Insert: {
          applies_to_point_type?: string | null
          created_at?: string
          expiration_months: number
          id?: string
          is_active?: boolean
          policy_name: string
        }
        Update: {
          applies_to_point_type?: string | null
          created_at?: string
          expiration_months?: number
          id?: string
          is_active?: boolean
          policy_name?: string
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
          is_active: boolean
          location: string | null
          public_key: string | null
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
          is_active?: boolean
          location?: string | null
          public_key?: string | null
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
          is_active?: boolean
          location?: string | null
          public_key?: string | null
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
      reward_redemptions: {
        Row: {
          created_at: string
          fulfilled_at: string | null
          id: string
          notes: string | null
          points_spent: number
          redeemed_at: string
          redemption_code: string | null
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          points_spent: number
          redeemed_at?: string
          redemption_code?: string | null
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          points_spent?: number
          redeemed_at?: string
          redemption_code?: string | null
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_catalog: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expiry_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          points_cost: number
          redemption_limit_per_user: number | null
          stock_quantity: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          points_cost: number
          redemption_limit_per_user?: number | null
          stock_quantity?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          points_cost?: number
          redemption_limit_per_user?: number | null
          stock_quantity?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_catalog_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "social_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      step_validation_logs: {
        Row: {
          anomaly_flags: Json | null
          challenge_id: string
          created_at: string
          device_info: Json | null
          id: string
          reported_steps: number
          timestamp: string
          user_id: string
          validation_score: number | null
        }
        Insert: {
          anomaly_flags?: Json | null
          challenge_id: string
          created_at?: string
          device_info?: Json | null
          id?: string
          reported_steps: number
          timestamp?: string
          user_id: string
          validation_score?: number | null
        }
        Update: {
          anomaly_flags?: Json | null
          challenge_id?: string
          created_at?: string
          device_info?: Json | null
          id?: string
          reported_steps?: number
          timestamp?: string
          user_id?: string
          validation_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "step_validation_logs_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
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
      system_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
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
      user_appearance_settings: {
        Row: {
          animations_enabled: boolean
          created_at: string
          font_size: string
          glassmorphism_enabled: boolean
          high_contrast: boolean
          id: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          animations_enabled?: boolean
          created_at?: string
          font_size?: string
          glassmorphism_enabled?: boolean
          high_contrast?: boolean
          id?: string
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          animations_enabled?: boolean
          created_at?: string
          font_size?: string
          glassmorphism_enabled?: boolean
          high_contrast?: boolean
          id?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_appearance_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_settings: {
        Row: {
          challenge_updates: boolean
          created_at: string
          email_enabled: boolean
          event_reminders: boolean
          id: string
          marketing_emails: boolean
          push_enabled: boolean
          sms_enabled: boolean
          social_interactions: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_updates?: boolean
          created_at?: string
          email_enabled?: boolean
          event_reminders?: boolean
          id?: string
          marketing_emails?: boolean
          push_enabled?: boolean
          sms_enabled?: boolean
          social_interactions?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_updates?: boolean
          created_at?: string
          email_enabled?: boolean
          event_reminders?: boolean
          id?: string
          marketing_emails?: boolean
          push_enabled?: boolean
          sms_enabled?: boolean
          social_interactions?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_social_settings: {
        Row: {
          activity_visibility: string
          auto_follow_friends: boolean
          content_suggestions: boolean
          created_at: string
          group_invitations: boolean
          id: string
          message_requests: boolean
          story_sharing: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_visibility?: string
          auto_follow_friends?: boolean
          content_suggestions?: boolean
          created_at?: string
          group_invitations?: boolean
          id?: string
          message_requests?: boolean
          story_sharing?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_visibility?: string
          auto_follow_friends?: boolean
          content_suggestions?: boolean
          created_at?: string
          group_invitations?: boolean
          id?: string
          message_requests?: boolean
          story_sharing?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_social_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wellness_settings: {
        Row: {
          activity_reminders: boolean
          created_at: string
          daily_goal_steps: number
          health_data_sharing: boolean
          id: string
          mindfulness_reminders: boolean
          sleep_tracking: boolean
          updated_at: string
          user_id: string
          water_reminders: boolean
        }
        Insert: {
          activity_reminders?: boolean
          created_at?: string
          daily_goal_steps?: number
          health_data_sharing?: boolean
          id?: string
          mindfulness_reminders?: boolean
          sleep_tracking?: boolean
          updated_at?: string
          user_id: string
          water_reminders?: boolean
        }
        Update: {
          activity_reminders?: boolean
          created_at?: string
          daily_goal_steps?: number
          health_data_sharing?: boolean
          id?: string
          mindfulness_reminders?: boolean
          sleep_tracking?: boolean
          updated_at?: string
          user_id?: string
          water_reminders?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_wellness_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      walking_leaderboards: {
        Row: {
          challenge_id: string
          created_at: string
          daily_steps: Json | null
          flagged_for_review: boolean | null
          id: string
          is_validated: boolean | null
          last_updated: string
          total_steps: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          daily_steps?: Json | null
          flagged_for_review?: boolean | null
          id?: string
          is_validated?: boolean | null
          last_updated?: string
          total_steps?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          daily_steps?: Json | null
          flagged_for_review?: boolean | null
          id?: string
          is_validated?: boolean | null
          last_updated?: string
          total_steps?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "walking_leaderboards_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_user_points: {
        Args: {
          target_user_id: string
          points_adjustment: number
          reason: string
          admin_user_id: string
        }
        Returns: Json
      }
      assign_user_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _assigned_by: string
        }
        Returns: Json
      }
      create_invite_code: {
        Args: {
          _created_by: string
          _invite_type?: string
          _max_uses?: number
          _expires_at?: string
          _notes?: string
        }
        Returns: Json
      }
      expire_old_points: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_event_qr_code: {
        Args: { event_id_param: string }
        Returns: Json
      }
      get_content_for_moderation: {
        Args: {
          content_type_filter?: string
          status_filter?: string
          search_query?: string
          limit_param?: number
          offset_param?: number
        }
        Returns: {
          content_id: string
          content_type: string
          content: string
          author_id: string
          author_name: string
          created_at: string
          status: string
          reports_count: number
          latest_report_reason: string
        }[]
      }
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
      get_social_posts_optimized: {
        Args: {
          limit_param?: number
          offset_param?: number
          user_id_filter?: string
        }
        Returns: {
          id: string
          user_id: string
          content: string
          image_urls: string[]
          likes_count: number
          comments_count: number
          created_at: string
          is_story: boolean
          expires_at: string
          status: Database["public"]["Enums"]["post_status"]
          profile_data: Json
        }[]
      }
      get_unread_counts_for_user: {
        Args: { user_id_param: string }
        Returns: {
          thread_id: string
          unread_count: number
        }[]
      }
      get_user_available_points: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_user_dashboard_optimized: {
        Args: { user_id_param: string }
        Returns: {
          user_data: Json
          stats_data: Json
          recent_activity: Json
        }[]
      }
      get_users_with_roles: {
        Args: { _requesting_user_id: string }
        Returns: {
          user_id: string
          full_name: string
          username: string
          avatar_url: string
          created_at: string
          roles: Database["public"]["Enums"]["app_role"][]
          is_active: boolean
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
      log_admin_action: {
        Args: {
          action_text: string
          target_type_text: string
          target_id_param?: string
          details_param?: Json
        }
        Returns: undefined
      }
      mark_event_attendance: {
        Args: { event_qr_token: string; scanning_user_id: string }
        Returns: Json
      }
      mark_thread_messages_read: {
        Args: { thread_id_param: string; user_id_param: string }
        Returns: undefined
      }
      moderate_content: {
        Args: {
          content_type_param: string
          content_ids: string[]
          new_status: string
          moderator_id: string
          reason?: string
        }
        Returns: Json
      }
      redeem_reward: {
        Args: { reward_id_param: string; user_id_param: string }
        Returns: Json
      }
      remove_user_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _removed_by: string
        }
        Returns: Json
      }
      resolve_content_reports: {
        Args: {
          report_ids: string[]
          resolution: string
          content_action?: string
          moderator_notes?: string
        }
        Returns: Json
      }
      use_invite_code: {
        Args: { _code: string; _user_id: string }
        Returns: Json
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
