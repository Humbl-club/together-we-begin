import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react';

export function PerformanceMonitor() {
  // Fetch performance metrics from the last 7 days
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7);
      
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return {
        avgLoadTime: 0,
        totalPageViews: 0,
        slowPageRate: 0,
        slowestPage: null,
      };
    }

    const totalLoadTime = metrics.reduce((sum, m) => sum + (m.load_time_ms || 0), 0);
    const slowPageCount = metrics.filter(m => (m.load_time_ms || 0) > 3000).length;
    const slowest = metrics.reduce((max, m) => 
      (m.load_time_ms || 0) > (max.load_time_ms || 0) ? m : max
    );

    return {
      avgLoadTime: Math.round(totalLoadTime / metrics.length),
      totalPageViews: metrics.length,
      slowPageRate: ((slowPageCount / metrics.length) * 100).toFixed(1),
      slowestPage: slowest,
    };
  }, [metrics]);

  // Group metrics by page for the chart
  const chartData = useMemo(() => {
    if (!metrics) return [];

    const grouped = metrics.reduce((acc, metric) => {
      const date = format(new Date(metric.created_at), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date };
      }
      
      const page = new URL(metric.page_url).pathname;
      if (!acc[date][page]) {
        acc[date][page] = [];
      }
      
      acc[date][page].push(metric.load_time_ms || 0);
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages for each page per day
    return Object.values(grouped).map((day: any) => {
      const result: any = { date: day.date };
      
      Object.keys(day).forEach(key => {
        if (key !== 'date' && Array.isArray(day[key])) {
          const avg = day[key].reduce((a: number, b: number) => a + b, 0) / day[key].length;
          result[key] = Math.round(avg);
        }
      });
      
      return result;
    }).reverse();
  }, [metrics]);

  // Get unique page paths for the chart
  const pageTypes = useMemo(() => {
    if (!metrics) return [];
    const pages = new Set(metrics.map(m => {
      try {
        return new URL(m.page_url).pathname;
      } catch {
        return m.page_url;
      }
    }));
    return Array.from(pages).slice(0, 5); // Limit to top 5 pages
  }, [metrics]);

  // Group metrics by page for the bar chart
  const pageStats = useMemo(() => {
    if (!metrics) return [];

    const grouped = metrics.reduce((acc, metric) => {
      let page;
      try {
        page = new URL(metric.page_url).pathname;
      } catch {
        page = metric.page_url;
      }
      
      if (!acc[page]) {
        acc[page] = { page: page, count: 0, totalLoadTime: 0, slowViews: 0 };
      }
      
      acc[page].count++;
      acc[page].totalLoadTime += metric.load_time_ms || 0;
      if ((metric.load_time_ms || 0) > 3000) acc[page].slowViews++;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped)
      .map((stat: any) => ({
        ...stat,
        avgLoadTime: Math.round(stat.totalLoadTime / stat.count),
        slowRate: ((stat.slowViews / stat.count) * 100).toFixed(1),
      }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10); // Top 10 pages
  }, [metrics]);

  // Browser stats
  const browserStats = useMemo(() => {
    if (!metrics) return [];

    const grouped = metrics.reduce((acc, metric) => {
      const userAgent = metric.user_agent || 'Unknown';
      let browser = 'Unknown';
      
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      
      if (!acc[browser]) {
        acc[browser] = { browser, count: 0, totalLoadTime: 0 };
      }
      
      acc[browser].count++;
      acc[browser].totalLoadTime += metric.load_time_ms || 0;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map((stat: any) => ({
      ...stat,
      avgLoadTime: Math.round(stat.totalLoadTime / stat.count),
    }));
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Performance Monitoring</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-6">
              <div className="h-20 bg-muted animate-pulse rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const colors = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Monitoring</h2>
        <Badge variant="outline" className="gap-1">
          <Activity className="w-3 h-3" />
          Live
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Load Time</p>
              <p className="text-2xl font-bold">{stats.avgLoadTime}ms</p>
            </div>
            <Clock className="w-8 h-8 text-primary/20" />
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Page Views</p>
              <p className="text-2xl font-bold">{stats.totalPageViews.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary/20" />
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Slow Page Rate</p>
              <p className="text-2xl font-bold">{stats.slowPageRate}%</p>
            </div>
            <AlertCircle className="w-8 h-8 text-destructive/20" />
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Slowest Page</p>
              <p className="text-lg font-bold truncate">
                {stats.slowestPage ? new URL(stats.slowestPage.page_url).pathname : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.slowestPage?.load_time_ms || 0}ms
              </p>
            </div>
            <Clock className="w-8 h-8 text-warning/20" />
          </div>
        </Card>
      </div>

      {/* Load Time Trend */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Load Time Trend (7 days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Load Time (ms)', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
              }} 
            />
            <Legend />
            {pageTypes.map((page, index) => (
              <Line
                key={page}
                type="monotone"
                dataKey={page}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Page Performance Breakdown */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Page Performance Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pageStats}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="page" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
              }} 
            />
            <Legend />
            <Bar dataKey="avgLoadTime" fill="#8b5cf6" name="Avg Load Time (ms)" />
            <Bar dataKey="count" fill="#10b981" name="Page Views" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Browser Performance */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Browser Performance</h3>
          <div className="space-y-3">
            {browserStats.map((browser, index) => (
              <div key={browser.browser} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{browser.browser}</p>
                  <p className="text-sm text-muted-foreground">{browser.count} views</p>
                </div>
                <Badge variant="outline">
                  {browser.avgLoadTime}ms
                </Badge>
              </div>
            ))}
            {browserStats.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No browser data available
              </p>
            )}
          </div>
        </Card>

        {/* Recent Slow Pages */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Slow Pages (&gt;3000ms)</h3>
          <div className="space-y-2">
            {metrics
              ?.filter(m => (m.load_time_ms || 0) > 3000)
              .slice(0, 10)
              .map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium truncate">
                      {(() => {
                        try {
                          return new URL(metric.page_url).pathname;
                        } catch {
                          return metric.page_url;
                        }
                      })()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(metric.created_at), 'MMM dd, HH:mm:ss')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">
                      {metric.load_time_ms}ms
                    </Badge>
                  </div>
                </div>
              ))}
            {(!metrics || metrics.filter(m => (m.load_time_ms || 0) > 3000).length === 0) && (
              <p className="text-muted-foreground text-center py-4">
                No slow pages detected
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default PerformanceMonitor;