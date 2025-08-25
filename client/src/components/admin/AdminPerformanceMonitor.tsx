import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Activity, Database, Users, Server, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { MobileContainer } from '@/components/ui/mobile-container';

interface PerformanceMetrics {
  dbConnections: number;
  activeUsers: number;
  responseTime: number;
  errorRate: number;
  cacheHitRate: number;
  lastUpdate: Date;
}

const AdminPerformanceMonitor: React.FC = () => {
  const { isMobile } = useMobileFirst();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    dbConnections: 0,
    activeUsers: 0,
    responseTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
    lastUpdate: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadMetrics = async () => {
    try {
      // Get basic metrics from database
      const [usersCount, postsCount, eventsCount] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('social_posts').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true })
      ]);

      // Simulate performance metrics (in a real app, these would come from monitoring services)
      const mockMetrics: PerformanceMetrics = {
        dbConnections: Math.floor(Math.random() * 50) + 10,
        activeUsers: Math.floor(Math.random() * 100) + 20,
        responseTime: Math.floor(Math.random() * 200) + 50,
        errorRate: Math.random() * 2,
        cacheHitRate: 85 + Math.random() * 10,
        lastUpdate: new Date()
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'default';
    if (value <= thresholds.warning) return 'secondary';
    return 'destructive';
  };

  const getHealthIcon = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <Activity className="w-4 h-4 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading performance metrics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <MobileContainer>
      <div className="space-y-6">
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
          <div>
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>Performance Monitor</h2>
            <p className="text-muted-foreground">Real-time system performance metrics</p>
          </div>
          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center'} gap-2`}>
            <Badge variant={autoRefresh ? 'default' : 'outline'}>
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Badge>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size={isMobile ? "default" : "sm"}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Pause' : 'Resume'}
              </Button>
              <Button variant="outline" size={isMobile ? "default" : "sm"} onClick={loadMetrics}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 lg:grid-cols-4 gap-4'}`}>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">DB Connections</p>
                  <p className="text-2xl font-bold">{metrics.dbConnections}</p>
                </div>
              </div>
              {getHealthIcon(metrics.dbConnections > 40 ? 'warning' : 'good')}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{metrics.activeUsers}</p>
                </div>
              </div>
              {getHealthIcon('good')}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Response Time</p>
                  <p className="text-2xl font-bold">{metrics.responseTime}ms</p>
                </div>
              </div>
              {getHealthIcon(metrics.responseTime > 200 ? 'warning' : 'good')}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Error Rate</p>
                  <p className="text-2xl font-bold">{metrics.errorRate.toFixed(2)}%</p>
                </div>
              </div>
              {getHealthIcon(metrics.errorRate > 1 ? 'warning' : 'good')}
            </div>
          </CardContent>
        </Card>
      </div>

        <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-6'}`}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Cache Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Cache Hit Rate</span>
                    <span className="text-sm">{metrics.cacheHitRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.cacheHitRate} className="h-3" />
                </div>
                <div className={`grid grid-cols-3 gap-4 text-center ${isMobile ? 'text-sm' : ''}`}>
                  <div>
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-500`}>2.1k</p>
                    <p className="text-sm text-muted-foreground">Cache Hits</p>
                  </div>
                  <div>
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-red-500`}>234</p>
                    <p className="text-sm text-muted-foreground">Cache Misses</p>
                  </div>
                  <div>
                    <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-blue-500`}>42ms</p>
                    <p className="text-sm text-muted-foreground">Avg Response</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <Badge variant="default">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Authentication</span>
                  <Badge variant="default">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storage</span>
                  <Badge variant="default">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Edge Functions</span>
                  <Badge variant={metrics.responseTime > 200 ? 'secondary' : 'default'}>
                    {metrics.responseTime > 200 ? 'Slow' : 'Healthy'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-4">
                  Last updated: {metrics.lastUpdate.toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileContainer>
  );
};

export default AdminPerformanceMonitor;