import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { dbPerformance } from '@/services/core/DatabasePerformanceService';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  Clock, 
  Database, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Zap,
  Shield
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  user_id: string | null;
  page_url: string;
  load_time_ms: number;
  user_agent: string | null;
  created_at: string;
}

interface QueryMetrics {
  totalQueries: number;
  averageQueryTime: number;
  indexEfficiency: number;
  recentAverageTime: number;
  indexHits: number;
  indexMisses: number;
}

interface PageMetrics {
  page: string;
  averageLoadTime: number;
  visits: number;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [queryMetrics, setQueryMetrics] = useState<QueryMetrics | null>(null);
  const [pageMetrics, setPageMetrics] = useState<PageMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (user && isAdmin) {
      fetchPerformanceData();
      // Refresh every 30 seconds
      const interval = setInterval(fetchPerformanceData, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isAdmin, timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Calculate time filter based on selected range
      const now = new Date();
      const timeFilter = new Date();
      switch (timeRange) {
        case '1h':
          timeFilter.setHours(now.getHours() - 1);
          break;
        case '24h':
          timeFilter.setDate(now.getDate() - 1);
          break;
        case '7d':
          timeFilter.setDate(now.getDate() - 7);
          break;
        case '30d':
          timeFilter.setDate(now.getDate() - 30);
          break;
      }

      // Fetch performance metrics from database
      const { data: perfData, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('created_at', timeFilter.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      setMetrics(perfData || []);

      // Get database query metrics from service
      const dbStats = dbPerformance.getPerformanceStats();
      setQueryMetrics(dbStats);

      // Process page metrics
      const pageStats = processPageMetrics(perfData || []);
      setPageMetrics(pageStats);

    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPageMetrics = (data: PerformanceMetric[]): PageMetrics[] => {
    const pageMap = new Map<string, { totalTime: number; count: number }>();
    
    data.forEach(metric => {
      const page = metric.page_url || 'Unknown';
      const existing = pageMap.get(page) || { totalTime: 0, count: 0 };
      pageMap.set(page, {
        totalTime: existing.totalTime + metric.load_time_ms,
        count: existing.count + 1
      });
    });

    return Array.from(pageMap.entries())
      .map(([page, stats]) => ({
        page: page.replace(/^https?:\/\/[^\/]+/, ''), // Remove domain
        averageLoadTime: Math.round(stats.totalTime / stats.count),
        visits: stats.count
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);
  };

  const formatChartData = () => {
    const now = new Date();
    const intervals: { time: string; loadTime: number; count: number }[] = [];
    
    // Create time intervals based on selected range
    const intervalCount = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const intervalMs = timeRange === '1h' ? 5 * 60 * 1000 : 
                     timeRange === '24h' ? 60 * 60 * 1000 :
                     timeRange === '7d' ? 24 * 60 * 60 * 1000 :
                     24 * 60 * 60 * 1000;

    for (let i = intervalCount - 1; i >= 0; i--) {
      const intervalTime = new Date(now.getTime() - (i * intervalMs));
      const timeLabel = timeRange === '1h' || timeRange === '24h' 
        ? intervalTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : intervalTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      intervals.push({ time: timeLabel, loadTime: 0, count: 0 });
    }

    // Aggregate metrics into intervals
    metrics.forEach(metric => {
      const metricTime = new Date(metric.created_at);
      const intervalIndex = Math.floor((now.getTime() - metricTime.getTime()) / intervalMs);
      const actualIndex = intervalCount - 1 - intervalIndex;
      
      if (actualIndex >= 0 && actualIndex < intervals.length) {
        intervals[actualIndex].loadTime += metric.load_time_ms;
        intervals[actualIndex].count += 1;
      }
    });

    return intervals.map(interval => ({
      ...interval,
      averageLoadTime: interval.count > 0 ? Math.round(interval.loadTime / interval.count) : 0
    }));
  };

  const getPerformanceStatus = (avgTime: number) => {
    if (avgTime < 1000) return { status: 'Excellent', color: 'text-green-500', icon: CheckCircle };
    if (avgTime < 2000) return { status: 'Good', color: 'text-blue-500', icon: CheckCircle };
    if (avgTime < 3000) return { status: 'Fair', color: 'text-yellow-500', icon: AlertTriangle };
    return { status: 'Poor', color: 'text-red-500', icon: AlertTriangle };
  };

  const chartData = formatChartData();
  const avgLoadTime = metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.load_time_ms, 0) / metrics.length) : 0;
  const performanceStatus = getPerformanceStatus(avgLoadTime);

  if (!isAdmin) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You need admin privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Performance Monitor</h1>
          <p className="text-muted-foreground">Real-time application performance insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Live Monitoring
          </Badge>
          <div className="flex gap-1">
            {(['1h', '24h', '7d', '30d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${performanceStatus.color}`} />
              <div>
                <p className="text-sm text-muted-foreground">Avg Load Time</p>
                <p className="text-2xl font-bold">{avgLoadTime}ms</p>
                <p className={`text-xs ${performanceStatus.color}`}>{performanceStatus.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{metrics.length}</p>
                <p className="text-xs text-muted-foreground">Last {timeRange}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">DB Queries</p>
                <p className="text-2xl font-bold">{queryMetrics?.totalQueries || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {queryMetrics?.averageQueryTime ? `${queryMetrics.averageQueryTime.toFixed(1)}ms avg` : 'No data'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Index Efficiency</p>
                <p className="text-2xl font-bold">
                  {queryMetrics?.indexEfficiency ? `${queryMetrics.indexEfficiency.toFixed(1)}%` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">Query optimization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Load Time Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Load Time (ms)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="averageLoadTime" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Page Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pageMetrics.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="page" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Load Time (ms)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="averageLoadTime" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queryMetrics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Recent Avg Query Time</p>
                    <p className="text-xl font-semibold">{queryMetrics.recentAverageTime.toFixed(2)}ms</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Index Hit Rate</p>
                    <p className="text-xl font-semibold text-green-500">
                      {((queryMetrics.indexHits / (queryMetrics.indexHits + queryMetrics.indexMisses)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Index Hits: {queryMetrics.indexHits}</span>
                    <span>Index Misses: {queryMetrics.indexMisses}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${(queryMetrics.indexHits / (queryMetrics.indexHits + queryMetrics.indexMisses)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No database metrics available</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pageMetrics.slice(0, 5).map((page, index) => (
                <div key={page.page} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {page.page || '/'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {page.visits} visits
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {page.averageLoadTime}ms
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Performance Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {metrics.slice(0, 20).map((metric) => (
              <div key={metric.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{metric.page_url}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(metric.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge 
                  variant={metric.load_time_ms < 1000 ? 'default' : metric.load_time_ms < 3000 ? 'secondary' : 'destructive'}
                  className="ml-2"
                >
                  {metric.load_time_ms}ms
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;