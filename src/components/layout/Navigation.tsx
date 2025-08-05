import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { useViewport } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  Calendar, 
  Trophy, 
  User, 
  Settings, 
  LogOut,
  Shield,
  MoreHorizontal,
  X,
  MessageCircle,
  QrCode,
  Plus
} from 'lucide-react';
import { ProfileDropdown } from './ProfileDropdown';
import { MessagingOverlay } from '@/components/messaging/MessagingOverlay';
import { useMessaging } from '@/hooks/useMessaging';

interface NavigationProps {
  profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export const Navigation: React.FC<NavigationProps> = ({ profile }) => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const { isMobile, isTablet, isDesktop } = useViewport();
  const haptics = useHapticFeedback();
  const [showMessaging, setShowMessaging] = useState(false);
  const { totalUnreadCount } = useMessaging();

  // Force re-render and ensure navigation is always visible
  React.useEffect(() => {
    console.log('Navigation render state:', { isMobile, isTablet, isDesktop, width: window.innerWidth });
  }, [isMobile, isTablet, isDesktop]);

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/social', icon: Users, label: 'Community' },
    { href: '/events', icon: Calendar, label: 'Events' },
    { href: '/challenges', icon: Trophy, label: 'Wellness' },
  ];

  const secondaryNavItems = [
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
  ];

  if (isAdmin) {
    secondaryNavItems.push({ href: '/admin', icon: Shield, label: 'Admin' });
  }

  const isActive = (path: string) => location.pathname === path;

  // Always render navigation - fallback to mobile if detection fails
  const shouldRenderMobile = isMobile || window.innerWidth < 768;
  const shouldRenderTablet = !shouldRenderMobile && (isTablet || (window.innerWidth >= 768 && window.innerWidth < 1024));
  const shouldRenderDesktop = !shouldRenderMobile && !shouldRenderTablet;

  // Mobile Navigation - Simple and highly visible
  if (shouldRenderMobile) {
    return (
      <>
        {/* Simple, highly visible mobile navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-300 shadow-lg">
          <div className="grid grid-cols-4 gap-0 px-2 py-3">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                to={href}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                  isActive(href)
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <Icon className="w-6 h-6 mb-1" strokeWidth={isActive(href) ? 2.5 : 2} />
                <span className="text-xs font-medium">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </nav>
        
        {/* Simple floating message button */}
        <button
          onClick={() => setShowMessaging(true)}
          className="fixed bottom-20 right-4 z-[9999] w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </span>
          )}
        </button>
        
        <MessagingOverlay 
          isOpen={showMessaging} 
          onClose={() => setShowMessaging(false)} 
        />
      </>
    );
  }

  // Tablet Navigation (Enhanced Glass Sidebar)
  if (shouldRenderTablet) {
    return (
      <nav className="fixed top-0 left-0 w-16 h-full z-50">
        <div className="glass-nav h-full border-r border-border/20 flex flex-col">
          {/* Tablet Logo with Glass Effect */}
          <div className="p-3 border-b border-border/20">
            <div className="w-10 h-10 bg-gradient-to-br from-editorial-charcoal to-editorial-navy rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg tracking-tight">H</span>
            </div>
          </div>

          {/* Navigation Items with Enhanced Glass */}
          <div className="flex-1 flex flex-col space-y-2 p-2 mt-4">
            {[...navItems, ...secondaryNavItems].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                to={href}
                title={label}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group relative",
                  isActive(href)
                    ? 'bg-primary/20 text-primary backdrop-blur-sm shadow-sm border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50 hover:backdrop-blur-sm'
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive(href) ? 2.5 : 2} />
                {isActive(href) && (
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Tablet Actions with Glass Effects */}
          <div className="p-2 border-t border-border/20 space-y-2">
            <Link
              to="/settings"
              title="Settings"
              className="flex items-center justify-center w-12 h-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/50 hover:backdrop-blur-sm transition-all duration-200"
            >
              <Settings className="w-5 h-5" />
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              title="Logout"
              onClick={() => signOut()}
              className="flex items-center justify-center w-12 h-12 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:backdrop-blur-sm transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>
    );
  }

  // Desktop Navigation (Full Glass Experience) - Default fallback
  return (
    <nav className="fixed top-0 left-0 w-20 h-full z-50">
      <div className="glass-nav h-full border-r border-border/20 flex flex-col">
        {/* Desktop Logo with Enhanced Glass */}
        <div className="p-4 border-b border-border/20">
          <div className="w-12 h-12 mx-auto bg-gradient-to-br from-editorial-charcoal via-editorial-navy to-editorial-charcoal rounded-xl flex items-center justify-center shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <span className="text-white font-bold text-xl tracking-tight relative z-10">H</span>
          </div>
        </div>

        {/* Navigation Items with Premium Glass Effect */}
        <div className="flex-1 flex flex-col space-y-3 p-3 mt-6">
          {[...navItems, ...secondaryNavItems].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              to={href}
              className={cn(
                "flex flex-col items-center space-y-2 p-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive(href)
                  ? 'bg-primary/20 text-primary backdrop-blur-md shadow-lg border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50 hover:backdrop-blur-sm hover:shadow-md'
              )}
            >
              {isActive(href) && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl" />
              )}
              <Icon className="w-5 h-5 relative z-10 transition-transform group-hover:scale-110" strokeWidth={isActive(href) ? 2.5 : 2} />
              <span className="text-xs font-medium tracking-wide text-center leading-none relative z-10">
                {label}
              </span>
              {isActive(href) && (
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-full shadow-md" />
              )}
            </Link>
          ))}
        </div>

        {/* Desktop Actions with Glass Effects */}
        <div className="p-3 border-t border-border/20 space-y-2">
          <Link
            to="/settings"
            className="flex flex-col items-center space-y-1 p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/50 hover:backdrop-blur-sm transition-all duration-200 group"
          >
            <Settings className="w-5 h-5 transition-transform group-hover:rotate-90" />
            <span className="text-xs font-medium tracking-wide">Settings</span>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="flex flex-col items-center space-y-1 p-3 w-full rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:backdrop-blur-sm transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            <span className="text-xs font-medium tracking-wide">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};