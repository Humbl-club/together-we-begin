import { DashboardRepository } from '@/services/repositories/DashboardRepository';
import { useSmartCaching } from '@/hooks/useSmartCaching';
import { useConcurrentFeatures } from '@/hooks/useConcurrentFeatures';
import { useCallback, useMemo } from 'react';

// Domain service for Dashboard business logic
export class DashboardService {
  private static instance: DashboardService;
  private repository: DashboardRepository;

  private constructor() {
    this.repository = DashboardRepository.getInstance();
  }

  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  // Business logic: Get comprehensive dashboard data
  async getDashboardData(userId: string) {
    try {
      const data = await this.repository.getDashboardData(userId);
      return this.enrichDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error('Failed to fetch dashboard data');
    }
  }

  // Business logic: Get activity insights
  async getActivityInsights(userId: string) {
    const summary = await this.repository.getUserActivitySummary(userId);
    return this.calculateInsights(summary);
  }

  // Private business logic methods
  private enrichDashboardData(data: any) {
    return {
      ...data,
      user_profile: {
        ...data.user_profile,
        pointsToNextTier: this.calculatePointsToNextTier(data.user_profile.total_loyalty_points || 0),
        currentTier: this.calculateTier(data.user_profile.total_loyalty_points || 0)
      },
      stats: {
        ...data.stats,
        engagementScore: this.calculateEngagementScore(data.stats),
        growthRate: this.calculateGrowthRate(data.stats)
      },
      recent_events: data.recent_events.map((event: any) => ({
        ...event,
        isThisWeek: this.isThisWeek(event.start_time),
        timeUntilStart: this.getTimeUntilStart(event.start_time)
      }))
    };
  }

  private calculateInsights(summary: any) {
    if (!summary) return null;

    const activityScore = this.calculateActivityScore(summary);
    const recommendations = this.generateRecommendations(summary);

    return {
      activityScore,
      recommendations,
      highlights: this.getHighlights(summary),
      trends: this.calculateTrends(summary)
    };
  }

  private calculatePointsToNextTier(points: number): number {
    const tiers = [0, 100, 500, 1000, 2500, 5000];
    const currentTierIndex = tiers.findIndex(tier => points < tier);
    
    if (currentTierIndex === -1) return 0; // Max tier reached
    return tiers[currentTierIndex] - points;
  }

  private calculateTier(points: number): string {
    if (points >= 5000) return 'Diamond';
    if (points >= 2500) return 'Platinum';
    if (points >= 1000) return 'Gold';
    if (points >= 500) return 'Silver';
    if (points >= 100) return 'Bronze';
    return 'Beginner';
  }

  private calculateEngagementScore(stats: any): number {
    const weights = {
      events: 0.3,
      challenges: 0.25,
      posts: 0.25,
      points: 0.2
    };

    const normalizedEvents = Math.min(stats.upcoming_events / 5, 1);
    const normalizedChallenges = Math.min(stats.active_challenges / 3, 1);
    const normalizedPosts = Math.min(stats.total_posts / 10, 1);
    const normalizedPoints = Math.min(stats.recent_points / 1000, 1);

    return Math.round(
      (normalizedEvents * weights.events +
       normalizedChallenges * weights.challenges +
       normalizedPosts * weights.posts +
       normalizedPoints * weights.points) * 100
    );
  }

  private calculateGrowthRate(stats: any): number {
    // Simplified growth calculation based on recent activity
    const recentActivity = stats.recent_points + (stats.total_posts * 10);
    return Math.min(Math.round(recentActivity / 10), 100);
  }

  private calculateActivityScore(summary: any): number {
    const total = summary.total_events_registered + 
                 summary.total_challenges_joined + 
                 summary.total_posts_created;
    return Math.min(Math.round(total / 10 * 100), 100);
  }

  private generateRecommendations(summary: any): string[] {
    const recommendations = [];

    if (summary.total_events_registered < 3) {
      recommendations.push('Join more events to connect with the community');
    }
    if (summary.total_challenges_joined < 2) {
      recommendations.push('Participate in challenges to earn more points');
    }
    if (summary.total_posts_created < 5) {
      recommendations.push('Share your experiences with posts');
    }

    return recommendations;
  }

  private getHighlights(summary: any): string[] {
    const highlights = [];

    if (summary.total_points_earned > 1000) {
      highlights.push(`Earned ${summary.total_points_earned} loyalty points`);
    }
    if (summary.total_events_registered > 5) {
      highlights.push(`Registered for ${summary.total_events_registered} events`);
    }

    return highlights;
  }

  private calculateTrends(summary: any): { label: string; value: number }[] {
    return [
      { label: 'Events', value: summary.total_events_registered },
      { label: 'Challenges', value: summary.total_challenges_joined },
      { label: 'Posts', value: summary.total_posts_created }
    ];
  }

  private isThisWeek(dateString: string): boolean {
    const eventDate = new Date(dateString);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return eventDate >= weekStart && eventDate <= weekEnd;
  }

  private getTimeUntilStart(dateString: string): string {
    const eventDate = new Date(dateString);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} days`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hours`;
  }
}

// React hook for Dashboard service with advanced optimization
export const useDashboardService = () => {
  const dashboardService = useMemo(() => DashboardService.getInstance(), []);
  const cache = useSmartCaching({ ttl: 2 * 60 * 1000, maxSize: 10 });
  const { deferValue } = useConcurrentFeatures();

  const getDashboardData = useCallback(async (userId: string) => {
    const cacheKey = `dashboard_${userId}`;
    
    // Try cache first
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Fetch from service
    const data = await dashboardService.getDashboardData(userId);
    cache.set(cacheKey, data);
    
    return data;
  }, [dashboardService, cache]);

  const getActivityInsights = useCallback(async (userId: string) => {
    const cacheKey = `insights_${userId}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const insights = await dashboardService.getActivityInsights(userId);
    cache.set(cacheKey, insights);
    
    return deferValue(insights);
  }, [dashboardService, cache, deferValue]);

  return {
    getDashboardData,
    getActivityInsights
  };
};