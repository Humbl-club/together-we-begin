import React, { memo, useState } from 'react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { MobileFirstCard, MobileFirstCardContent, MobileFirstCardHeader, MobileFirstCardTitle } from '@/components/ui/mobile-first-card';
import { MobileNativeButton } from '@/components/ui/mobile-native-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Edit3, 
  Award, 
  Target, 
  TrendingUp, 
  Calendar,
  Heart,
  Users,
  Settings,
  Share,
  Trophy,
  Zap,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate: string;
  category: 'fitness' | 'social' | 'learning' | 'milestone';
}

const MobileProfilePage: React.FC = memo(() => {
  const { isMobile, safeAreaInsets } = useMobileFirst();
  const feedback = useHapticFeedback();
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'activity'>('overview');

  const profileData = {
    name: 'Sarah Chen',
    username: '@sarahc',
    bio: 'Wellness enthusiast • Coffee lover • Always learning something new ✨',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop&crop=face',
    stats: {
      events: 24,
      connections: 156,
      achievements: 12,
      points: 2847
    },
    recentAchievements: [
      {
        id: '1',
        title: 'Early Bird',
        description: 'Attended 5 morning events',
        icon: '🌅',
        earnedDate: '2 days ago',
        category: 'fitness'
      },
      {
        id: '2',
        title: 'Social Butterfly',
        description: 'Made 10 new connections',
        icon: '🦋',
        earnedDate: '1 week ago',
        category: 'social'
      },
      {
        id: '3',
        title: 'Wellness Warrior',
        description: 'Completed 30-day challenge',
        icon: '⚡',
        earnedDate: '2 weeks ago',
        category: 'fitness'
      }
    ]
  };

  const handleEditProfile = () => {
    feedback.tap();
    console.log('Edit profile');
  };

  const handleShare = () => {
    feedback.tap();
    console.log('Share profile');
  };

  const handleTabChange = (tab: typeof activeTab) => {
    feedback.tap();
    setActiveTab(tab);
  };

  if (!isMobile) {
    // Desktop version - simplified
    return (
      <UnifiedLayout>
        <div className="container mx-auto px-8 py-12 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Profile</h1>
          {/* Desktop profile content */}
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div 
        className="min-h-screen bg-background"
        style={{
          paddingTop: `max(16px, ${safeAreaInsets.top}px)`,
          paddingBottom: `max(24px, ${safeAreaInsets.bottom}px)`,
          paddingLeft: `max(16px, ${safeAreaInsets.left}px)`,
          paddingRight: `max(16px, ${safeAreaInsets.right}px)`
        }}
      >
        {/* Profile Header */}
        <div className="space-y-6 px-4">
          {/* Top Actions */}
          <div className="flex items-center justify-between py-2">
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <div className="flex items-center gap-2">
              <MobileNativeButton
                variant="ghost"
                size="sm"
                onClick={handleShare}
              >
                <Share className="h-5 w-5" />
              </MobileNativeButton>
              <MobileNativeButton
                variant="ghost"
                size="sm"
                onClick={() => feedback.tap()}
              >
                <Settings className="h-5 w-5" />
              </MobileNativeButton>
            </div>
          </div>

          {/* Profile Info Card */}
          <MobileFirstCard variant="elevated" padding="lg">
            <MobileFirstCardContent>
              <div className="space-y-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileData.avatar} />
                      <AvatarFallback className="text-lg">SC</AvatarFallback>
                    </Avatar>
                    <MobileNativeButton
                      variant="secondary"
                      size="sm"
                      className="absolute -bottom-1 -right-1 h-8 w-8 p-0 rounded-full shadow-lg"
                      onClick={() => feedback.tap()}
                    >
                      <Camera className="h-4 w-4" />
                    </MobileNativeButton>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-foreground truncate">
                        {profileData.name}
                      </h2>
                      <Badge className="bg-primary/10 text-primary">
                        ✓
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {profileData.username}
                    </p>
                    <MobileNativeButton
                      variant="primary"
                      size="sm"
                      onClick={handleEditProfile}
                      className="w-full"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </MobileNativeButton>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-foreground leading-relaxed">
                  {profileData.bio}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(profileData.stats).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-lg font-bold text-foreground">{value}</p>
                      <p className="text-xs text-muted-foreground capitalize">{key}</p>
                    </div>
                  ))}
                </div>
              </div>
            </MobileFirstCardContent>
          </MobileFirstCard>

          {/* Tab Navigation */}
          <div className="flex bg-secondary/30 rounded-2xl p-1">
            {[
              { key: 'overview', label: 'Overview', icon: Users },
              { key: 'achievements', label: 'Badges', icon: Trophy },
              { key: 'activity', label: 'Activity', icon: TrendingUp }
            ].map((tab) => (
              <MobileNativeButton
                key={tab.key}
                variant={activeTab === tab.key ? "primary" : "ghost"}
                size="sm"
                className={cn(
                  "flex-1 h-10",
                  activeTab === tab.key && "shadow-sm"
                )}
                onClick={() => handleTabChange(tab.key as typeof activeTab)}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </MobileNativeButton>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Quick Stats */}
                <MobileFirstCard variant="glass" padding="md">
                  <MobileFirstCardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                            <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <p className="text-sm font-medium">This Week</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">4/5 Goals</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                            <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          </div>
                        </div>
                        <p className="text-sm font-medium">Streak</p>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">12 Days</p>
                      </div>
                    </div>
                  </MobileFirstCardContent>
                </MobileFirstCard>

                {/* Recent Activity */}
                <MobileFirstCard variant="default" padding="md">
                  <MobileFirstCardHeader>
                    <MobileFirstCardTitle>Recent Activity</MobileFirstCardTitle>
                  </MobileFirstCardHeader>
                  <MobileFirstCardContent>
                    <div className="space-y-3">
                      {[
                        { action: 'Completed morning run', time: '2h ago', icon: '🏃‍♀️' },
                        { action: 'Joined book club event', time: '1d ago', icon: '📚' },
                        { action: 'Earned Early Bird badge', time: '2d ago', icon: '🏆' }
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-lg">{activity.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </MobileFirstCardContent>
                </MobileFirstCard>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {profileData.recentAchievements.map((achievement) => (
                    <MobileFirstCard
                      key={achievement.id}
                      variant="elevated"
                      interactive
                      padding="md"
                      className="transform-gpu active:scale-95"
                      onClick={() => feedback.tap()}
                    >
                      <MobileFirstCardContent>
                        <div className="text-center space-y-2">
                          <div className="text-3xl mb-2">{achievement.icon}</div>
                          <h3 className="font-semibold text-sm">{achievement.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {achievement.description}
                          </p>
                          <p className="text-xs text-primary">{achievement.earnedDate}</p>
                        </div>
                      </MobileFirstCardContent>
                    </MobileFirstCard>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <MobileFirstCard variant="default" padding="md">
                  <MobileFirstCardContent>
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Activity Insights</h3>
                      <p className="text-sm text-muted-foreground">
                        Your detailed activity insights will appear here
                      </p>
                    </div>
                  </MobileFirstCardContent>
                </MobileFirstCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
});

export default MobileProfilePage;