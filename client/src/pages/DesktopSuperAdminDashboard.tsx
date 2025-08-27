import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Shield,
  Building2,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  Clock,
  MessageSquare,
  Calendar,
  Trophy,
  Zap,
  Target,
  Award,
  Heart,
  Star,
  ArrowUp,
  ArrowDown,
  CircleDot,
  Sparkles
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { OrganizationsList } from '@/components/admin/super/OrganizationsList';

const DesktopSuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const { stats, loading, error, refetch, metrics } = usePlatformStats(30);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 500);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getHealthColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      case 'professional': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'starter': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  // Generate chart data
  const revenueData = Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    revenue: Math.floor(Math.random() * 5000) + 2000,
    users: Math.floor(Math.random() * 50) + 20,
  }));

  const userGrowthData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    users: Math.floor(Math.random() * 100) + 50,
    active: Math.floor(Math.random() * 80) + 30,
  }));

  const healthDistribution = stats?.health_distribution
    ? Object.entries(stats.health_distribution).map(([level, count]) => ({
        name: level.charAt(0).toUpperCase() + level.slice(1),
        value: count,
        color: level === 'critical' ? '#ef4444' :
               level === 'high' ? '#f97316' :
               level === 'medium' ? '#eab308' : '#22c55e'
      }))
    : [];

  const performanceMetrics = [
    { metric: 'User Growth', value: 85, target: 90 },
    { metric: 'Engagement', value: 72, target: 80 },
    { metric: 'Retention', value: 68, target: 75 },
    { metric: 'Revenue', value: 92, target: 85 },
    { metric: 'Satisfaction', value: 78, target: 85 },
  ];

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="animate-spin w-16 h-16 border-4 border-white/30 border-t-white rounded-full mx-auto" />
          <p className="text-white/80 text-lg">Loading platform intelligence...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900">
        {/* Animated background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-indigo-600/20" />
          <motion.div
            className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-full blur-3xl"
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
                <div className="relative p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  Platform Command Center
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </h1>
                <p className="text-white/70">
                  {user?.email} • {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <Input
                  placeholder="Search platform data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-96 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20"
                />
              </div>
              
              <Button
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
                Sync
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Premium Animated Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-white/10 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/80">Organizations</CardTitle>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <motion.div 
                  className="text-3xl font-bold text-white"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {stats?.total_organizations || 0}
                </motion.div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-white/60">
                    {stats?.active_organizations || 0} active
                  </span>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {metrics.organizationGrowth}%
                  </Badge>
                </div>
                <Progress value={parseFloat(metrics.organizationGrowth)} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-white/10 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/80">Users</CardTitle>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <motion.div 
                  className="text-3xl font-bold text-white"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  {stats?.total_users || 0}
                </motion.div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-white/60">
                    {stats?.active_users || 0} active
                  </span>
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                    <Activity className="w-3 h-3 mr-1" />
                    {metrics.userEngagement}%
                  </Badge>
                </div>
                <Progress value={parseFloat(metrics.userEngagement)} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-white/10 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/80">Revenue</CardTitle>
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <motion.div 
                  className="text-3xl font-bold text-white"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  {formatCurrency(stats?.total_revenue_cents || 0)}
                </motion.div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-white/60">
                    Last 30 days
                  </span>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12%
                  </Badge>
                </div>
                <Progress value={75} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-red-500/10 border-white/10 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/80">Activity</CardTitle>
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-orange-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <motion.div 
                  className="text-3xl font-bold text-white"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                >
                  {metrics.contentActivity}
                </motion.div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2 text-xs text-white/60">
                    <span>{stats?.total_posts || 0} posts</span>
                    <span>{stats?.total_events || 0} events</span>
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">
                    <Activity className="w-3 h-3 mr-1 animate-pulse" />
                    Live
                  </Badge>
                </div>
                <Progress value={85} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Health Alerts */}
        {stats?.health_distribution && Object.keys(stats.health_distribution).length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50/50 dark:bg-orange-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Organization Health Distribution
              </CardTitle>
              <CardDescription>
                Monitor organization health across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.health_distribution).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        level === 'critical' ? 'bg-red-500' :
                        level === 'high' ? 'bg-orange-500' :
                        level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      )} />
                      <span className="font-medium capitalize">{level} Risk</span>
                    </div>
                    <Badge className={getHealthColor(level)}>
                      {count} orgs
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Premium Tabs with Visualizations */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/5 border-white/10 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/10">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white/10">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="organizations" className="data-[state=active]:bg-white/10">
              <Building2 className="w-4 h-4 mr-2" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white/10">
              <Zap className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-white/10">
              <Settings className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="lg:col-span-2"
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        Revenue Trend
                        <Badge className="bg-green-500/20 text-green-300">
                          <ArrowUp className="w-3 h-3 mr-1" />
                          +18.2%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                          <XAxis dataKey="day" stroke="#ffffff40" />
                          <YAxis stroke="#ffffff40" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1f2937', 
                              border: '1px solid #ffffff20',
                              borderRadius: '8px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#8b5cf6" 
                            fill="url(#colorRevenue)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Health Distribution Pie Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white">Organization Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={healthDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {healthDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1f2937', 
                              border: '1px solid #ffffff20',
                              borderRadius: '8px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {healthDistribution.map((item) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-white/60">
                              {item.name}: {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Building2, label: 'Create Organization', color: 'from-blue-500 to-blue-600' },
                  { icon: Users, label: 'Manage Admins', color: 'from-green-500 to-green-600' },
                  { icon: MessageSquare, label: 'Send Announcement', color: 'from-purple-500 to-purple-600' },
                  { icon: Shield, label: 'Security Settings', color: 'from-orange-500 to-orange-600' },
                ].map((action, index) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Button
                      className={`w-full h-24 bg-gradient-to-br ${action.color} hover:opacity-90 text-white border-0 flex flex-col gap-2`}
                    >
                      <action.icon className="w-6 h-6" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">User Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="month" stroke="#ffffff40" />
                        <YAxis stroke="#ffffff40" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #ffffff20',
                            borderRadius: '8px'
                          }}
                        />
                        <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} />
                        <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Performance Radar Chart */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={performanceMetrics}>
                        <PolarGrid stroke="#ffffff20" />
                        <PolarAngleAxis dataKey="metric" stroke="#ffffff60" />
                        <PolarRadiusAxis stroke="#ffffff40" />
                        <Radar 
                          name="Current" 
                          dataKey="value" 
                          stroke="#8b5cf6" 
                          fill="#8b5cf6" 
                          fillOpacity={0.6} 
                        />
                        <Radar 
                          name="Target" 
                          dataKey="target" 
                          stroke="#10b981" 
                          fill="#10b981" 
                          fillOpacity={0.3} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="organizations">
              <OrganizationsList searchTerm={searchTerm} />
            </TabsContent>

            <TabsContent value="performance">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">System Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {performanceMetrics.map((metric) => (
                        <div key={metric.metric} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white/60">{metric.metric}</span>
                            <span className="text-sm font-semibold text-white">{metric.value}%</span>
                          </div>
                          <div className="relative">
                            <Progress value={metric.value} className="h-2" />
                            <div 
                              className="absolute top-0 h-2 w-0.5 bg-red-500"
                              style={{ left: `${metric.target}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Real-time Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { action: 'New user signup', time: '2 min ago', icon: Users },
                        { action: 'Event created', time: '5 min ago', icon: Calendar },
                        { action: 'Payment received', time: '12 min ago', icon: DollarSign },
                        { action: 'Challenge started', time: '18 min ago', icon: Trophy },
                        { action: 'Post published', time: '25 min ago', icon: MessageSquare },
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded">
                              <item.icon className="w-4 h-4 text-white/60" />
                            </div>
                            <span className="text-sm text-white/80">{item.action}</span>
                          </div>
                          <span className="text-xs text-white/40">{item.time}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="system">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-400/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      Database
                      <Badge className="bg-green-500/20 text-green-300">Healthy</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Connections</span>
                        <span className="text-white">42 / 100</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Response Time</span>
                        <span className="text-white">12ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Uptime</span>
                        <span className="text-white">99.99%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-400/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      API Services
                      <Badge className="bg-blue-500/20 text-blue-300">Operational</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Requests/min</span>
                        <span className="text-white">1,842</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Error Rate</span>
                        <span className="text-white">0.02%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Avg Latency</span>
                        <span className="text-white">89ms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-400/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      Storage
                      <Badge className="bg-purple-500/20 text-purple-300">Normal</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Used</span>
                        <span className="text-white">24.5 GB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Available</span>
                        <span className="text-white">475.5 GB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Usage</span>
                        <span className="text-white">4.9%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
};

export default DesktopSuperAdminDashboard;