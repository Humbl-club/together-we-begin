import React, { memo, forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Navigation as DesktopNavigation } from './Navigation';
import { ProfileDropdown } from './ProfileDropdown';

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
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
      <nav 
        ref={ref}
        className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom,0px)] px-2"
      >
        <div className="nav-glass-floating mx-auto mb-2 max-w-sm">
          <div className="flex items-center justify-around px-2 py-3">
            {/* Home */}
            <Link
              to="/dashboard"
              onClick={() => feedback.tap()}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200",
                "min-h-[60px] min-w-[60px]", // Touch target
                "transform-gpu touch-manipulation relative overflow-hidden group",
                "active:scale-95 active:bg-primary/10",
                isActive('/dashboard')
                  ? "text-primary bg-primary/10 backdrop-blur-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/30"
              )}
            >
              <Home className={cn(
                "h-5 w-5 mb-1 transition-all duration-200 group-active:scale-95",
                isActive('/dashboard') && "text-primary"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isActive('/dashboard') ? "text-primary" : "text-muted-foreground"
              )}>
                Home
              </span>
              {isActive('/dashboard') && (
                <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full animate-pulse" />
              )}
            </Link>

            {/* Events */}
            <Link
              to="/events"
              onClick={() => feedback.tap()}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200",
                "min-h-[60px] min-w-[60px]", // Touch target
                "transform-gpu touch-manipulation relative overflow-hidden group",
                "active:scale-95 active:bg-primary/10",
                isActive('/events')
                  ? "text-primary bg-primary/10 backdrop-blur-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/30"
              )}
            >
              <Calendar className={cn(
                "h-5 w-5 mb-1 transition-all duration-200 group-active:scale-95",
                isActive('/events') && "text-primary"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isActive('/events') ? "text-primary" : "text-muted-foreground"
              )}>
                Events
              </span>
              {isActive('/events') && (
                <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full animate-pulse" />
              )}
            </Link>

            {/* Profile Dropdown - replaces wellness */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl min-h-[60px] min-w-[60px] relative">
              <div className="mb-1">
                <ProfileDropdown profile={profile} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Profile
              </span>
            </div>

            {/* Social */}
            <Link
              to="/social"
              onClick={() => feedback.tap()}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200",
                "min-h-[60px] min-w-[60px]", // Touch target
                "transform-gpu touch-manipulation relative overflow-hidden group",
                "active:scale-95 active:bg-primary/10",
                isActive('/social')
                  ? "text-primary bg-primary/10 backdrop-blur-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/30"
              )}
            >
              <Heart className={cn(
                "h-5 w-5 mb-1 transition-all duration-200 group-active:scale-95",
                isActive('/social') && "text-primary"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isActive('/social') ? "text-primary" : "text-muted-foreground"
              )}>
                Social
              </span>
              {isActive('/social') && (
                <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full animate-pulse" />
              )}
            </Link>

            {/* Messages */}
            <Link
              to="/messages"
              onClick={() => feedback.tap()}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200",
                "min-h-[60px] min-w-[60px]", // Touch target
                "transform-gpu touch-manipulation relative overflow-hidden group",
                "active:scale-95 active:bg-primary/10",
                isActive('/messages')
                  ? "text-primary bg-primary/10 backdrop-blur-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/30"
              )}
            >
              <MessageCircle className={cn(
                "h-5 w-5 mb-1 transition-all duration-200 group-active:scale-95",
                isActive('/messages') && "text-primary"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isActive('/messages') ? "text-primary" : "text-muted-foreground"
              )}>
                Messages
              </span>
              {isActive('/messages') && (
                <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full animate-pulse" />
              )}
            </Link>
          </div>
        </div>
      </nav>
    );
  }
);

MobileFirstNavigation.displayName = 'MobileFirstNavigation';

export { MobileFirstNavigation };