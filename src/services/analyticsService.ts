import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEvent = 
  | 'post_created'
  | 'post_liked'
  | 'comment_made'
  | 'story_viewed'
  | 'message_sent'
  | 'event_attended'
  | 'challenge_completed'
  | 'session_start';

class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionStart: number = Date.now();
  private userId: string | null = null;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.sessionStart = Date.now();
  }

  async trackEvent(event: AnalyticsEvent, data?: any) {
    if (!this.userId) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      // Update or create today's analytics record
      const { data: existing } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', this.userId)
        .eq('date', today)
        .single();

      const updates: any = {};
      
      switch (event) {
        case 'post_created':
          updates.posts_created = (existing?.posts_created || 0) + 1;
          break;
        case 'post_liked':
          updates.posts_liked = (existing?.posts_liked || 0) + 1;
          break;
        case 'comment_made':
          updates.comments_made = (existing?.comments_made || 0) + 1;
          break;
        case 'story_viewed':
          updates.stories_viewed = (existing?.stories_viewed || 0) + 1;
          break;
        case 'message_sent':
          updates.messages_sent = (existing?.messages_sent || 0) + 1;
          break;
        case 'event_attended':
          updates.events_attended = (existing?.events_attended || 0) + 1;
          break;
        case 'challenge_completed':
          updates.challenges_completed = (existing?.challenges_completed || 0) + 1;
          break;
        case 'session_start':
          const sessionDuration = Math.floor((Date.now() - this.sessionStart) / (1000 * 60));
          updates.session_duration_minutes = (existing?.session_duration_minutes || 0) + sessionDuration;
          this.sessionStart = Date.now();
          break;
      }

      if (existing) {
        await supabase
          .from('user_analytics')
          .update(updates)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_analytics')
          .insert({
            user_id: this.userId,
            date: today,
            ...updates
          });
      }

      // Track performance metrics
      if (event === 'session_start') {
        await this.trackPageLoad();
      }
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }

  async trackPageLoad() {
    if (!this.userId) return;

    const loadTime = performance.now();
    
    await supabase
      .from('performance_metrics')
      .insert({
        user_id: this.userId,
        page_url: window.location.pathname,
        load_time_ms: Math.round(loadTime),
        user_agent: navigator.userAgent
      });
  }

  async getAnalytics(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Failed to fetch analytics:', error);
      return [];
    }

    return data || [];
  }

  async getAggregatedAnalytics(userId: string) {
    const analytics = await this.getAnalytics(userId);
    
    return analytics.reduce((acc, day) => ({
      totalPosts: acc.totalPosts + (day.posts_created || 0),
      totalLikes: acc.totalLikes + (day.posts_liked || 0),
      totalComments: acc.totalComments + (day.comments_made || 0),
      totalStoryViews: acc.totalStoryViews + (day.stories_viewed || 0),
      totalMessages: acc.totalMessages + (day.messages_sent || 0),
      totalEvents: acc.totalEvents + (day.events_attended || 0),
      totalChallenges: acc.totalChallenges + (day.challenges_completed || 0),
      totalSessionTime: acc.totalSessionTime + (day.session_duration_minutes || 0)
    }), {
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      totalStoryViews: 0,
      totalMessages: 0,
      totalEvents: 0,
      totalChallenges: 0,
      totalSessionTime: 0
    });
  }
}

export default AnalyticsService;