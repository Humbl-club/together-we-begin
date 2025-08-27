import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastChecked: string;
  services: ServiceHealth[];
  metrics: SystemMetrics;
}

interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  lastIncident?: string;
}

interface SystemMetrics {
  apiRequests: number;
  errorRate: number;
  avgResponseTime: number;
  activeUsers: number;
  databaseConnections: number;
  memoryUsage: number;
  cpuUsage: number;
  storageUsage: number;
}

export const SystemHealthMonitor: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemHealth();
    const interval = setInterval(loadSystemHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = async () => {
    try {
      setLoading(true);

      // Mock system health data - in production this would come from monitoring APIs
      const mockHealth: SystemHealth = {
        status: 'healthy',
        uptime: 99.98,
        lastChecked: new Date().toISOString(),
        services: [
          {
            name: 'Web Application',
            status: 'operational',
            responseTime: 245,
            uptime: 99.99,
            lastIncident: undefined
          },
          {
            name: 'Database',
            status: 'operational',
            responseTime: 12,
            uptime: 99.95,
            lastIncident: undefined
          },
          {
            name: 'File Storage',
            status: 'operational',
            responseTime: 89,
            uptime: 99.97,
            lastIncident: undefined
          },
          {
            name: 'Email Service',
            status: 'operational',
            responseTime: 156,
            uptime: 99.8,
            lastIncident: undefined
          },
          {
            name: 'Payment Processing',
            status: 'degraded',
            responseTime: 890,
            uptime: 98.5,
            lastIncident: '2024-01-14T15:30:00Z'
          },
          {
            name: 'Push Notifications',
            status: 'operational',
            responseTime: 78,
            uptime: 99.9,
            lastIncident: undefined
          }
        ],
        metrics: {
          apiRequests: 125840,
          errorRate: 0.02,
          avgResponseTime: 234,
          activeUsers: 1247,
          databaseConnections: 45,
          memoryUsage: 68,
          cpuUsage: 23,
          storageUsage: 42
        }
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setHealth(mockHealth);
    } catch (error) {
      console.error('Error loading system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'down':
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'degraded':
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'down':
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatResponseTime = (ms: number) => {
    return `${ms}ms`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load system health</p>
            <Button variant="outline" onClick={loadSystemHealth} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Health
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(health.status)}>
              {getStatusIcon(health.status)}
              <span className="ml-1 capitalize">{health.status}</span>
            </Badge>
            
            <Button variant="ghost" size="sm" onClick={loadSystemHealth}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          Last updated: {formatDate(health.lastChecked)}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatUptime(health.uptime)}
            </div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatResponseTime(health.metrics.avgResponseTime)}
            </div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {health.metrics.errorRate}%
            </div>
            <div className="text-sm text-gray-600">Error Rate</div>
          </div>
        </div>

        {/* Services Status */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Server className="w-4 h-4" />
            Services
          </h4>
          
          <div className="space-y-2">
            {health.services.map(service => (
              <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-600">
                      {formatResponseTime(service.responseTime)} • {formatUptime(service.uptime)} uptime
                    </div>
                  </div>
                </div>
                
                <Badge className={getStatusColor(service.status)}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* System Metrics */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            System Metrics
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">CPU Usage</span>
                  <span className="font-medium">{health.metrics.cpuUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      health.metrics.cpuUsage > 80 ? 'bg-red-500' :
                      health.metrics.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${health.metrics.cpuUsage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Memory Usage</span>
                  <span className="font-medium">{health.metrics.memoryUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      health.metrics.memoryUsage > 80 ? 'bg-red-500' :
                      health.metrics.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${health.metrics.memoryUsage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Storage Usage</span>
                  <span className="font-medium">{health.metrics.storageUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      health.metrics.storageUsage > 80 ? 'bg-red-500' :
                      health.metrics.storageUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${health.metrics.storageUsage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Database Connections</span>
                  <span className="font-medium">{health.metrics.databaseConnections}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${health.metrics.databaseConnections}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" />
            <div>
              <div className="font-bold">{health.metrics.apiRequests.toLocaleString()}</div>
              <div className="text-sm text-gray-600">API Requests Today</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <div className="font-bold">{health.metrics.activeUsers.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Active Users Now</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};