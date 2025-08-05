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

    const renderProfileButton = () => (
      <div className="flex flex-col items-center justify-center p-3 rounded-xl min-h-[60px] min-w-[60px] relative">
        <div className="mb-1">
          <ProfileDropdown profile={profile} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Profile
        </span>
      </div>
    );

    const isActive = (path: string) => location.pathname === path;

    return (
      <nav 
        ref={ref}
        className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom,0px)] px-2"
      >
        <div className="nav-glass-floating mx-auto mb-2 max-w-sm">
          <div className="flex items-center justify-around px-2 py-3">
            {navItems.map((item, index) => {
              const isAfterEvents = item.id === 'events';
              return (
                <React.Fragment key={`nav-${item.id}`}>
                  <Link
                    to={item.href}
                    onClick={() => feedback.tap()}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200",
                      "min-h-[60px] min-w-[60px]", // Touch target
                      "transform-gpu touch-manipulation relative overflow-hidden group",
                      "active:scale-95 active:bg-primary/10",
                      isActive(item.href)
                        ? "text-primary bg-primary/10 backdrop-blur-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-background/30"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 mb-1 transition-all duration-200 group-active:scale-95",
                      isActive(item.href) && "text-primary"
                    )} />
                    <span className={cn(
                      "text-xs font-medium",
                      isActive(item.href) ? "text-primary" : "text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                    {isActive(item.href) && (
                      <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full animate-pulse" />
                    )}
                  </Link>
                  {/* Insert profile dropdown right after events section */}
                  {isAfterEvents && renderProfileButton()}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </nav>
    );
  }
);

MobileFirstNavigation.displayName = 'MobileFirstNavigation';

export { MobileFirstNavigation };