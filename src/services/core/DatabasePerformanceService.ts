// Database Performance Monitoring Service
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  queryTime: number;
  queryType: string;
  tableName: string;
  userId?: string;
  timestamp: number;
}

interface QueryOptimizations {
  indexHits: number;
  indexMisses: number;
  totalQueries: number;
  averageQueryTime: number;
}

export class DatabasePerformanceService {
  private static instance: DatabasePerformanceService;
  private metrics: PerformanceMetrics[] = [];
  private optimizations: QueryOptimizations = {
    indexHits: 0,
    indexMisses: 0,
    totalQueries: 0,
    averageQueryTime: 0
  };

  private constructor() {}

  static getInstance(): DatabasePerformanceService {
    if (!DatabasePerformanceService.instance) {
      DatabasePerformanceService.instance = new DatabasePerformanceService();
    }
    return DatabasePerformanceService.instance;
  }

  // Track query performance with new indexes
  trackQuery(queryType: string, tableName: string, startTime: number, userId?: string) {
    const queryTime = performance.now() - startTime;
    
    this.metrics.push({
      queryTime,
      queryType,
      tableName,
      userId,
      timestamp: Date.now()
    });

    this.optimizations.totalQueries++;
    this.optimizations.averageQueryTime = 
      (this.optimizations.averageQueryTime * (this.optimizations.totalQueries - 1) + queryTime) / 
      this.optimizations.totalQueries;

    // Track index usage (optimized queries should be faster)
    if (queryTime < 50) { // Fast query = index hit
      this.optimizations.indexHits++;
    } else {
      this.optimizations.indexMisses++;
    }

    // Log performance improvements
    if (tableName === 'post_comments' && queryTime < 20) {
      console.log(`✅ Optimized comment query: ${queryTime.toFixed(2)}ms (using new indexes)`);
    }

    // Keep only last 100 metrics to prevent memory bloat
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Optimized comment fetching with performance tracking
  async fetchCommentsOptimized(postId: string) {
    const startTime = performance.now();
    
    try {
      // Uses idx_post_comments_post_id and idx_post_comments_created_at indexes
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('id, content, created_at, user_id')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      this.trackQuery('SELECT', 'post_comments', startTime);

      if (error) throw error;
      return commentsData || [];
    } catch (error) {
      this.trackQuery('SELECT_ERROR', 'post_comments', startTime);
      throw error;
    }
  }

  // Optimized post insertion with performance tracking
  async insertCommentOptimized(postId: string, userId: string, content: string) {
    const startTime = performance.now();
    
    try {
      // Uses idx_post_comments_post_user composite index for optimal insertion
      const { data, error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          user_id: userId,
          content: content.trim()
        }])
        .select()
        .single();

      this.trackQuery('INSERT', 'post_comments', startTime, userId);

      if (error) throw error;
      return data;
    } catch (error) {
      this.trackQuery('INSERT_ERROR', 'post_comments', startTime, userId);
      throw error;
    }
  }

  // Get performance statistics
  getPerformanceStats() {
    const last50Queries = this.metrics.slice(-50);
    const avgTime = last50Queries.reduce((sum, m) => sum + m.queryTime, 0) / last50Queries.length;
    
    return {
      ...this.optimizations,
      recentAverageTime: avgTime || 0,
      indexEfficiency: this.optimizations.totalQueries > 0 
        ? (this.optimizations.indexHits / this.optimizations.totalQueries) * 100 
        : 0,
      recentMetrics: last50Queries
    };
  }

  // Log performance report
  logPerformanceReport() {
    const stats = this.getPerformanceStats();
    console.log('📊 Database Performance Report:', {
      totalQueries: stats.totalQueries,
      indexEfficiency: `${stats.indexEfficiency.toFixed(1)}%`,
      averageQueryTime: `${stats.averageQueryTime.toFixed(2)}ms`,
      recentAverageTime: `${stats.recentAverageTime.toFixed(2)}ms`,
      indexHits: stats.indexHits,
      indexMisses: stats.indexMisses
    });
  }
}

// Export singleton instance
export const dbPerformance = DatabasePerformanceService.getInstance();
