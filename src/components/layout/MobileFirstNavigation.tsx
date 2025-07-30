import React, { memo, forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Navigation as DesktopNavigation } from './Navigation';

// Mobile Navigation Icons
import { Home, Calendar, MessageCircle, User, Heart, Search, Settings } from 'lucide-react';

interface MobileFirstNavigationProps {
  profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

const MobileFirstNavigation = forwardRef<HTMLElement, MobileFirstNavigationProps>(
  ({ profile }, ref) => {
    const { isMobile, isTablet, safeAreaInsets } = useMobileFirst();
    const feedback = useHapticFeedback();
    const location = useLocation();

    // Return desktop navigation for non-mobile devices
    if (!isMobile) {
      return <DesktopNavigation profile={profile} />;
    }

    const navItems = [
      { id: 'home', icon: Home, label: 'Home', href: '/dashboard' },
      { id: 'events', icon: Calendar, label: 'Events', href: '/events' },
      { id: 'social', icon: Heart, label: 'Social', href: '/social' },
      { id: 'messages', icon: MessageCircle, label: 'Messages', href: '/messages' },
      { id: 'profile', icon: User, label: 'Profile', href: '/profile' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
      <nav 
        ref={ref}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border"
        style={{
          paddingBottom: `max(16px, ${safeAreaInsets.bottom}px)`,
          paddingLeft: `max(0px, ${safeAreaInsets.left}px)`,
          paddingRight: `max(0px, ${safeAreaInsets.right}px)`,
        }}
      >
        <div className="flex items-center justify-around px-2 pt-2">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              onClick={() => feedback.tap()}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200",
                "min-h-[60px] min-w-[60px]", // Touch target
                "transform-gpu touch-manipulation",
                "active:scale-95 active:bg-accent/50",
                isActive(item.href)
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 mb-1 transition-colors",
                isActive(item.href) && "text-primary"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isActive(item.href) ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    );
  }
);

MobileFirstNavigation.displayName = 'MobileFirstNavigation';

export { MobileFirstNavigation };