import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { useAuth } from '@/components/auth/AuthProvider';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { SafeAreaLayout } from '@/components/ui/safe-area-layout';
import { IOSScrollView } from '@/components/ui/ios-native';
import { MobileContainer } from '@/components/ui/mobile-container';
import { CardKit, CardKitContent, CardKitHeader, CardKitTitle } from '@/components/ui/card-kit';
import { MobileLoading } from '@/components/ui/mobile-loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronRight,
  Eye,
  Sparkles,
  Zap,
  Heart,
  MessageSquare,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Flame,
  Star
} from 'lucide-react';

// Mock data for organizations (in production, this would come from the database)
const mockOrganizations = [
  {
    id: '1',
    name: 'Sunset Wellness Club',
    logo: '🌅',
    members: 245,
    health: 92,
    revenue: 4500,
    status: 'active',
    trend: 'up'
  },
  {
    id: '2',
    name: 'Urban Fitness Hub',
    logo: '🏃‍♀️',
    members: 189,
    health: 78,
    revenue: 3200,
    status: 'active',
    trend: 'stable'
  },
  {
    id: '3',
    name: 'Zen Garden Community',
    logo: '🧘‍♀️',
    members: 456,
    health: 45,
    revenue: 8900,
    status: 'at-risk',
    trend: 'down'
  }
];

const MobileSuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const haptic = useHapticFeedback();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'users' | 'engagement'>('revenue');
  const { stats, loading, error, refetch, metrics } = usePlatformStats(30);

  const handleRefresh = async () => {
    haptic.impact('light');
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cents / 100);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading && !stats) {
    return (
      <SafeAreaLayout edges={['top', 'bottom']}>
        <MobileLoading variant="ios" size="lg" text="Initializing control center..." />
      </SafeAreaLayout>
    );
  }

  return (
    <SafeAreaLayout edges={['top', 'bottom']}>
      <MobileContainer className="bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-black">
        {/* Premium Header with Glass Effect */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative z-10 px-4 pt-4 pb-8">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">Control Center</h1>
                  <p className="text-white/80 text-xs">Platform Overview</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                className="text-white hover:bg-white/20 h-9 w-9 p-0"
              >
                <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
              </Button>
            </div>

            {/* Main Metric Display */}
            <motion.div 
              className="text-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-white/80 text-sm mb-2">Total Platform Value</p>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                <h2 className="text-4xl font-bold text-white">
                  {formatCurrency(stats?.total_revenue_cents || 0)}
                </h2>
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-300" />
                <span className="text-green-300 text-sm font-medium">+12.5% this month</span>
              </div>
            </motion.div>

            {/* Quick Metrics Pills */}
            <div className="flex gap-2 justify-center">
              {['revenue', 'users', 'engagement'].map((metric) => (
                <motion.button
                  key={metric}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    haptic.tap();
                    setSelectedMetric(metric as any);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    selectedMetric === metric
                      ? "bg-white text-purple-700 shadow-lg"
                      : "bg-white/20 text-white backdrop-blur-sm"
                  )}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <IOSScrollView className="-mt-6 relative z-20">
          {/* Live Activity Cards */}
          <div className="px-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <motion.div whileTap={{ scale: 0.98 }}>
                <CardKit variant="elevated" className="bg-gradient-to-br from-green-500 to-emerald-600 border-0">
                  <CardKitContent className="p-4 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <Users className="w-5 h-5" />
                      <Badge className="bg-white/20 text-white border-0">Live</Badge>
                    </div>
                    <p className="text-3xl font-bold mb-1">{formatNumber(stats?.active_users || 0)}</p>
                    <p className="text-white/80 text-xs">Active Users Now</p>
                    <div className="mt-3 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                      <span className="text-xs text-white/80">Real-time</span>
                    </div>
                  </CardKitContent>
                </CardKit>
              </motion.div>

              <motion.div whileTap={{ scale: 0.98 }}>
                <CardKit variant="elevated" className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0">
                  <CardKitContent className="p-4 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <Activity className="w-5 h-5" />
                      <Flame className="w-4 h-4 text-orange-300 animate-pulse" />
                    </div>
                    <p className="text-3xl font-bold mb-1">{metrics.contentActivity}</p>
                    <p className="text-white/80 text-xs">Content Today</p>
                    <Progress value={75} className="mt-3 h-1.5 bg-white/20" />
                  </CardKitContent>
                </CardKit>
              </motion.div>
            </div>
          </div>

          {/* Organization Health Monitor */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Organization Health</h3>
              <Button variant="ghost" size="sm" className="text-xs">
                View All
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <div className="space-y-3">
              {mockOrganizations.map((org, index) => (
                <motion.div
                  key={org.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CardKit 
                    variant="elevated" 
                    className={cn(
                      "overflow-hidden transition-all",
                      org.health < 50 && "border-red-200 bg-red-50/50"
                    )}
                  >
                    <CardKitContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-xl">
                            {org.logo}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{org.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{org.members} members</span>
                              {org.trend === 'up' && <ArrowUp className="w-3 h-3 text-green-500" />}
                              {org.trend === 'down' && <ArrowDown className="w-3 h-3 text-red-500" />}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          className={cn(
                            "text-xs",
                            org.status === 'active' ? "bg-green-100 text-green-700" :
                            org.status === 'at-risk' ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-700"
                          )}
                        >
                          {org.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Health Score</span>
                          <span className={cn(
                            "font-bold",
                            org.health >= 80 ? "text-green-600" :
                            org.health >= 50 ? "text-yellow-600" :
                            "text-red-600"
                          )}>
                            {org.health}%
                          </span>
                        </div>
                        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className={cn(
                              "absolute top-0 left-0 h-full rounded-full",
                              org.health >= 80 ? "bg-gradient-to-r from-green-400 to-green-500" :
                              org.health >= 50 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" :
                              "bg-gradient-to-r from-red-400 to-red-500"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${org.health}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-muted-foreground">Monthly Revenue</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            ${org.revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1 h-8">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 px-3">
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardKitContent>
                  </CardKit>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div className="px-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Platform Activity</h3>
            <CardKit variant="glass">
              <CardKitContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">New organization registered</p>
                    <p className="text-xs text-muted-foreground">Mindful Movement Studio • 2 min ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">Payment processed</p>
                    <p className="text-xs text-muted-foreground">$299 from Urban Fitness • 5 min ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">Challenge completed</p>
                    <p className="text-xs text-muted-foreground">Walking Challenge Week 4 • 12 min ago</p>
                  </div>
                </div>
              </CardKitContent>
            </CardKit>
          </div>

          {/* Action Center */}
          <div className="px-4 mb-20">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => haptic.tap()}
              >
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="text-xs">Analytics</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => haptic.tap()}
              >
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Moderation</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => haptic.tap()}
              >
                <MessageSquare className="w-5 h-5 text-green-600" />
                <span className="text-xs">Broadcast</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => haptic.tap()}
              >
                <Settings className="w-5 h-5 text-orange-600" />
                <span className="text-xs">Settings</span>
              </Button>
            </div>
          </div>
        </IOSScrollView>
      </MobileContainer>
    </SafeAreaLayout>
  );
};

export default MobileSuperAdminDashboard;