import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Building2, 
  Activity,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsData {
  dailyActiveUsers: any[];
  organizationGrowth: any[];
  revenueMetrics: any[];
  engagementMetrics: any[];
  contentMetrics: any[];
  subscriptionDistribution: any[];
  geographicDistribution: any[];
}

interface MetricsSummary {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  userGrowthRate: number;
  totalOrganizations: number;
  activeOrganizations: number;
  newOrgsThisWeek: number;
  orgGrowthRate: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerOrg: number;
  revenueGrowthRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const PlatformAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // In a real implementation, this would call specific analytics RPC functions
      // For now, we'll simulate the data structure

      // Generate mock daily active users data
      const days = parseInt(timeRange.replace('d', ''));
      const dailyActiveUsers = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        return {
          date: date.toISOString().split('T')[0],
          users: Math.floor(Math.random() * 1000) + 500,
          newUsers: Math.floor(Math.random() * 100) + 20,
          organizations: Math.floor(Math.random() * 50) + 10
        };
      });

      // Generate mock revenue data
      const revenueMetrics = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        return {
          date: date.toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 5000) + 1000,
          mrr: Math.floor(Math.random() * 20000) + 10000,
          subscriptions: Math.floor(Math.random() * 10) + 2
        };
      });

      // Mock subscription distribution
      const subscriptionDistribution = [
        { name: 'Free', value: 45, count: 180 },
        { name: 'Starter', value: 35, count: 140 },
        { name: 'Professional', value: 15, count: 60 },
        { name: 'Enterprise', value: 5, count: 20 }
      ];

      // Mock engagement metrics
      const engagementMetrics = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        return {
          date: date.toISOString().split('T')[0],
          events: Math.floor(Math.random() * 50) + 10,
          posts: Math.floor(Math.random() * 200) + 50,
          messages: Math.floor(Math.random() * 500) + 100,
          challenges: Math.floor(Math.random() * 20) + 5
        };
      });

      const mockAnalytics: AnalyticsData = {
        dailyActiveUsers,
        organizationGrowth: dailyActiveUsers.map(d => ({
          date: d.date,
          total: Math.floor(Math.random() * 400) + 100,
          active: Math.floor(Math.random() * 300) + 80,
          new: Math.floor(Math.random() * 10) + 1
        })),
        revenueMetrics,
        engagementMetrics,
        contentMetrics: engagementMetrics,
        subscriptionDistribution,
        geographicDistribution: [
          { country: 'US', users: 245, organizations: 78 },
          { country: 'Canada', users: 89, organizations: 23 },
          { country: 'UK', users: 67, organizations: 19 },
          { country: 'Australia', users: 45, organizations: 12 },
          { country: 'Germany', users: 34, organizations: 8 }
        ]
      };

      const mockSummary: MetricsSummary = {
        totalUsers: 1247,
        activeUsers: 892,
        newUsersThisWeek: 156,
        userGrowthRate: 12.5,
        totalOrganizations: 140,
        activeOrganizations: 127,
        newOrgsThisWeek: 8,
        orgGrowthRate: 5.7,
        totalRevenue: 245000,
        monthlyRecurringRevenue: 18500,
        averageRevenuePerOrg: 1750,
        revenueGrowthRate: 8.3
      };

      setAnalytics(mockAnalytics);
      setSummary(mockSummary);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Analytics</h2>
          <p className="text-gray-600">Comprehensive insights across all organizations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="365d">Last year</option>
          </select>
          
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.totalUsers.toLocaleString()}
                    </p>
                    <div className="ml-2 flex items-center text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {formatPercent(summary.userGrowthRate)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {summary.activeUsers.toLocaleString()} active • {summary.newUsersThisWeek} new this week
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building2 className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Organizations</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.totalOrganizations}
                    </p>
                    <div className="ml-2 flex items-center text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {formatPercent(summary.orgGrowthRate)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {summary.activeOrganizations} active • {summary.newOrgsThisWeek} new this week
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.totalRevenue)}
                    </p>
                    <div className="ml-2 flex items-center text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {formatPercent(summary.revenueGrowthRate)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(summary.monthlyRecurringRevenue)} MRR • {formatCurrency(summary.averageRevenuePerOrg)} avg per org
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Engagement</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round((summary.activeUsers / summary.totalUsers) * 100)}%
                    </p>
                    <div className="ml-2 flex items-center text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">+2.3%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    User engagement rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics?.dailyActiveUsers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="#93C5FD" />
                    <Area type="monotone" dataKey="newUsers" stroke="#10B981" fill="#6EE7B7" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.subscriptionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics?.subscriptionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics?.dailyActiveUsers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#3B82F6" name="Total Users" />
                    <Line type="monotone" dataKey="newUsers" stroke="#10B981" name="New Users" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={analytics?.organizationGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="total" stackId="1" stroke="#8B5CF6" fill="#C4B5FD" name="Total Organizations" />
                    <Area type="monotone" dataKey="active" stackId="2" stroke="#F59E0B" fill="#FDE68A" name="Active Organizations" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={analytics?.revenueMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#6EE7B7" name="Daily Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Recurring Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics?.revenueMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="mrr" stroke="#8B5CF6" name="MRR" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics?.engagementMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="events" fill="#3B82F6" name="Events" />
                    <Bar dataKey="posts" fill="#10B981" name="Posts" />
                    <Bar dataKey="challenges" fill="#F59E0B" name="Challenges" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={analytics?.engagementMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="messages" stroke="#EC4899" fill="#F9A8D4" name="Messages" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.geographicDistribution.map((location, index) => (
                  <div key={location.country} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {location.country}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{location.country}</div>
                        <div className="text-sm text-gray-600">
                          {location.organizations} organizations
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold">{location.users} users</div>
                      <div className="text-sm text-gray-600">
                        {Math.round((location.users / summary!.totalUsers) * 100)}% of total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};