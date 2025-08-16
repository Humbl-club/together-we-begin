import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Calendar, Users, Trophy, MessageCircle, 
  Settings, User, Bell, Search, Plus, Heart,
  Zap, Star, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useMessaging } from '@/hooks/useMessaging';
import { AnimatedLogo } from '@/components/ui/animated-logo';

interface iPadNavigationProps {
  profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export const iPadNavigation: React.FC<iPadNavigationProps> = memo(({ profile }) => {
  const location = useLocation();
  const haptics = useHapticFeedback();
  const messaging = useMessaging();
  const unreadCount = messaging.threads?.filter(t => t.unread_count > 0)?.length || 0;

  const primaryNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard', badge: null },
    { href: '/events', icon: Calendar, label: 'Events', badge: null },
    { href: '/social', icon: Users, label: 'Community', badge: null },
    { href: '/challenges', icon: Trophy, label: 'Challenges', badge: null },
    { href: '/messages', icon: MessageCircle, label: 'Messages', badge: unreadCount },
    { href: '/wellness', icon: Heart, label: 'Wellness', badge: null },
  ];

  const secondaryNavItems = [
    { href: '/insights', icon: TrendingUp, label: 'Insights', badge: null },
    { href: '/loyalty', icon: Star, label: 'Rewards', badge: null },
    { href: '/settings', icon: Settings, label: 'Settings', badge: null },
  ];

  const quickActions = [
    { icon: Search, label: 'Search', action: () => {} },
    { icon: Plus, label: 'Create', action: () => {} },
    { icon: Bell, label: 'Notifications', action: () => {} },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="ipad-navigation">
      {/* Header Section */}
      <div className="ipad-nav-header">
        <div className="flex items-center gap-3 mb-6">
          <AnimatedLogo className="w-8 h-8" />
          <span className="text-lg font-semibold text-foreground">Together</span>
        </div>

        {/* Profile Section */}
        <Link 
          to="/profile"
          className="ipad-profile-card group"
          onClick={() => haptics.tap()}
        >
          <Avatar className="w-12 h-12">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-sm font-medium">
              {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {profile?.full_name || 'Your Profile'}
            </p>
            <p className="text-sm text-muted-foreground">View profile</p>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="ipad-nav-section">
        <h3 className="ipad-nav-section-title">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              size="sm"
              className="ipad-quick-action"
              onClick={() => {
                haptics.tap();
                action.action();
              }}
            >
              <action.icon className="w-4 h-4" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="ipad-nav-section">
        <h3 className="ipad-nav-section-title">Main</h3>
        <div className="space-y-1">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'ipad-nav-item group',
                isActive(item.href) && 'ipad-nav-item-active'
              )}
              onClick={() => haptics.tap()}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-auto bg-primary/20 text-primary text-xs px-2 py-0.5"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Secondary Navigation */}
      <div className="ipad-nav-section">
        <h3 className="ipad-nav-section-title">More</h3>
        <div className="space-y-1">
          {secondaryNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'ipad-nav-item group',
                isActive(item.href) && 'ipad-nav-item-active'
              )}
              onClick={() => haptics.tap()}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="flex-1" />
    </nav>
  );
});

iPadNavigation.displayName = 'iPadNavigation';