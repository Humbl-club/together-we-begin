import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface ActivityFeedItem {
  id: string;
  user_id: string;
  activity_type: 'post_created' | 'challenge_joined' | 'event_registered' | 'goal_achieved' | 'story_posted';
  activity_data: {
    title?: string;
    description?: string;
    points_earned?: number;
    challenge_name?: string;
    event_name?: string;
    media_url?: string;
  };
  created_at: string;
  user_profile: {
    full_name: string;
    avatar_url?: string;
  };
}

interface RealtimeActivityUpdate {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: ActivityFeedItem;
  old?: ActivityFeedItem;
}

export const useRealtimeActivityFeed = (limit: number = 20) => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchActivities();
      setupRealtimeSubscription();
    }
  }, [user, limit]);

  const setupRealtimeSubscription = () => {
    // Subscribe to new posts
    const postsChannel = supabase
      .channel('activity-posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'social_posts'
      }, (payload) => {
        handlePostActivity(payload.new);
      })
      .subscribe();

    // Subscribe to challenge participations
    const challengesChannel = supabase
      .channel('activity-challenges')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'challenge_participations'
      }, (payload) => {
        handleChallengeActivity(payload.new);
      })
      .subscribe();

    // Subscribe to event registrations
    const eventsChannel = supabase
      .channel('activity-events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_registrations'
      }, (payload) => {
        handleEventActivity(payload.new);
      })
      .subscribe();

    // Subscribe to loyalty transactions (goal achievements)
    const loyaltyChannel = supabase
      .channel('activity-loyalty')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'loyalty_transactions',
        filter: 'type=eq.earned'
      }, (payload) => {
        handleGoalActivity(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(challengesChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(loyaltyChannel);
    };
  };

  const fetchActivities = async () => {
    try {
      // Fetch recent posts
      const { data: posts } = await supabase
        .from('social_posts')
        .select(`
          id,
          user_id,
          content,
          created_at,
          profiles!user_id (full_name, avatar_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent challenge participations
      const { data: challenges } = await supabase
        .from('challenge_participations')
        .select(`
          id,
          user_id,
          joined_at,
          challenge_id,
          challenges!challenge_id (title),
          profiles!user_id (full_name, avatar_url)
        `)
        .order('joined_at', { ascending: false })
        .limit(10);

      // Fetch recent event registrations
      const { data: events } = await supabase
        .from('event_registrations')
        .select(`
          id,
          user_id,
          registered_at,
          event_id,
          events!event_id (title),
          profiles!user_id (full_name, avatar_url)
        `)
        .order('registered_at', { ascending: false })
        .limit(10);

      // Fetch recent loyalty transactions
      const { data: loyaltyTransactions } = await supabase
        .from('loyalty_transactions')
        .select(`
          id,
          user_id,
          points,
          description,
          created_at,
          profiles!user_id (full_name, avatar_url)
        `)
        .eq('type', 'earned')
        .order('created_at', { ascending: false })
        .limit(10);

      // Combine and format all activities
      const combinedActivities: ActivityFeedItem[] = [];

      // Add posts
      posts?.forEach(post => {
        combinedActivities.push({
          id: `post_${post.id}`,
          user_id: post.user_id,
          activity_type: 'post_created',
          activity_data: {
            description: post.content?.substring(0, 100)
          },
          created_at: post.created_at,
          user_profile: {
            full_name: (post.profiles as any)?.full_name || 'Anonymous',
            avatar_url: (post.profiles as any)?.avatar_url
          }
        });
      });

      // Add challenges
      challenges?.forEach(challenge => {
        combinedActivities.push({
          id: `challenge_${challenge.id}`,
          user_id: challenge.user_id,
          activity_type: 'challenge_joined',
          activity_data: {
            challenge_name: (challenge.challenges as any)?.title
          },
          created_at: challenge.joined_at,
          user_profile: {
            full_name: (challenge.profiles as any)?.full_name || 'Anonymous',
            avatar_url: (challenge.profiles as any)?.avatar_url
          }
        });
      });

      // Add events
      events?.forEach(event => {
        combinedActivities.push({
          id: `event_${event.id}`,
          user_id: event.user_id,
          activity_type: 'event_registered',
          activity_data: {
            event_name: (event.events as any)?.title
          },
          created_at: event.registered_at,
          user_profile: {
            full_name: (event.profiles as any)?.full_name || 'Anonymous',
            avatar_url: (event.profiles as any)?.avatar_url
          }
        });
      });

      // Add loyalty achievements
      loyaltyTransactions?.forEach(transaction => {
        combinedActivities.push({
          id: `loyalty_${transaction.id}`,
          user_id: transaction.user_id,
          activity_type: 'goal_achieved',
          activity_data: {
            points_earned: transaction.points,
            description: transaction.description
          },
          created_at: transaction.created_at,
          user_profile: {
            full_name: (transaction.profiles as any)?.full_name || 'Anonymous',
            avatar_url: (transaction.profiles as any)?.avatar_url
          }
        });
      });

      // Sort by created_at and take latest
      const sortedActivities = combinedActivities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activity feed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostActivity = async (newPost: any) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', newPost.user_id)
        .single();

      const newActivity: ActivityFeedItem = {
        id: `post_${newPost.id}`,
        user_id: newPost.user_id,
        activity_type: 'post_created',
        activity_data: {
          description: newPost.content?.substring(0, 100)
        },
        created_at: newPost.created_at,
        user_profile: {
          full_name: profile?.full_name || 'Anonymous',
          avatar_url: profile?.avatar_url
        }
      };

      setActivities(prev => [newActivity, ...prev.slice(0, limit - 1)]);
    } catch (error) {
      console.error('Error handling post activity:', error);
    }
  };

  const handleChallengeActivity = async (newParticipation: any) => {
    try {
      const [profileResult, challengeResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', newParticipation.user_id)
          .single(),
        supabase
          .from('challenges')
          .select('title')
          .eq('id', newParticipation.challenge_id)
          .single()
      ]);

      const newActivity: ActivityFeedItem = {
        id: `challenge_${newParticipation.id}`,
        user_id: newParticipation.user_id,
        activity_type: 'challenge_joined',
        activity_data: {
          challenge_name: challengeResult.data?.title
        },
        created_at: newParticipation.joined_at,
        user_profile: {
          full_name: profileResult.data?.full_name || 'Anonymous',
          avatar_url: profileResult.data?.avatar_url
        }
      };

      setActivities(prev => [newActivity, ...prev.slice(0, limit - 1)]);
    } catch (error) {
      console.error('Error handling challenge activity:', error);
    }
  };

  const handleEventActivity = async (newRegistration: any) => {
    try {
      const [profileResult, eventResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', newRegistration.user_id)
          .single(),
        supabase
          .from('events')
          .select('title')
          .eq('id', newRegistration.event_id)
          .single()
      ]);

      const newActivity: ActivityFeedItem = {
        id: `event_${newRegistration.id}`,
        user_id: newRegistration.user_id,
        activity_type: 'event_registered',
        activity_data: {
          event_name: eventResult.data?.title
        },
        created_at: newRegistration.registered_at,
        user_profile: {
          full_name: profileResult.data?.full_name || 'Anonymous',
          avatar_url: profileResult.data?.avatar_url
        }
      };

      setActivities(prev => [newActivity, ...prev.slice(0, limit - 1)]);
    } catch (error) {
      console.error('Error handling event activity:', error);
    }
  };

  const handleGoalActivity = async (newTransaction: any) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', newTransaction.user_id)
        .single();

      const newActivity: ActivityFeedItem = {
        id: `loyalty_${newTransaction.id}`,
        user_id: newTransaction.user_id,
        activity_type: 'goal_achieved',
        activity_data: {
          points_earned: newTransaction.points,
          description: newTransaction.description
        },
        created_at: newTransaction.created_at,
        user_profile: {
          full_name: profile?.full_name || 'Anonymous',
          avatar_url: profile?.avatar_url
        }
      };

      setActivities(prev => [newActivity, ...prev.slice(0, limit - 1)]);
    } catch (error) {
      console.error('Error handling goal activity:', error);
    }
  };

  const refreshFeed = () => {
    setLoading(true);
    fetchActivities();
  };

  return {
    activities,
    loading,
    refreshFeed
  };
};