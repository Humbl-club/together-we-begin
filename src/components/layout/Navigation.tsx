import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { useViewport } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
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

  // Mobile Navigation - unified design system
  if (isMobile) {
    return (
      <>
        <nav className="fixed bottom-0 left-0 right-0 z-50 mobile-nav-safe">
          <div className="nav-glass mx-3 mb-3 rounded-3xl shadow-xl">
            <div className="grid grid-cols-4 gap-2 p-4">
              {navItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => haptics.tap()}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-2xl 
                    touch-target-large touch-feedback transition-all duration-300
                    ${isActive(href)
                      ? 'card-accent text-primary scale-105 shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground hover:card-secondary'
                    }
                  `}
                >
                  <Icon className="w-6 h-6 mb-1" strokeWidth={isActive(href) ? 2.5 : 2} />
                  <span className="text-xs font-medium tracking-tight">
                    {label}
                  </span>
                  {isActive(href) && (
                    <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        
        {/* Floating Messages Button */}
        <Button
          onClick={() => {
            haptics.tap();
            setShowMessaging(true);
          }}
          className="
            fixed bottom-28 right-4 z-50 w-16 h-16 rounded-full 
            card-accent shadow-lg touch-feedback
            transition-all duration-300 hover:scale-110 active:scale-95
          "
          aria-label="Messages"
        >
          <MessageCircle className="w-6 h-6" strokeWidth={2} />
          {totalUnreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground text-xs font-bold border-2 border-background">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </div>
          )}
        </Button>
        
        <MessagingOverlay 
          isOpen={showMessaging} 
          onClose={() => setShowMessaging(false)} 
        />
        
        {/* Profile Dropdown */}
        <ProfileDropdown profile={profile || user?.user_metadata || {}} />
      </>
    );
  }

  // Tablet Navigation (Simplified Desktop)
  if (isTablet) {
    return (
      <nav className="fixed top-0 left-0 w-16 h-full z-50">
        <div className="glass-nav h-full border-r border-border/20 flex flex-col rounded-none">
          {/* Tablet Logo */}
          <div className="p-3 border-b border-border/20">
            <div className="w-10 h-10 bg-editorial-charcoal rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-medium text-lg tracking-tight">H</span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 flex flex-col space-y-2 p-2 mt-4">
            {[...navItems, ...secondaryNavItems].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                to={href}
                title={label}
                className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 group ${
                  isActive(href)
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive(href) ? 2.5 : 2} />
              </Link>
            ))}
          </div>

          {/* Tablet Actions */}
          <div className="p-2 border-t border-border/20 space-y-2">
            <Link
              to="/settings"
              title="Settings"
              className="flex items-center justify-center w-12 h-12 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
            >
              <Settings className="w-5 h-5" />
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              title="Logout"
              onClick={() => signOut()}
              className="flex items-center justify-center w-12 h-12 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>
    );
  }

  // Desktop Navigation (Full)
  return (
    <nav className="fixed top-0 left-0 w-20 h-full z-50">
      <div className="glass-nav h-full border-r border-border/20 flex flex-col rounded-none">
        {/* Desktop Logo */}
        <div className="p-4 border-b border-border/20">
          <div className="w-12 h-12 mx-auto bg-editorial-charcoal rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-medium text-xl tracking-tight">H</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col space-y-3 p-3 mt-6">
          {[...navItems, ...secondaryNavItems].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              to={href}
              className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all duration-200 group ${
                isActive(href)
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive(href) ? 2.5 : 2} />
              <span className="text-xs font-medium tracking-wide text-center leading-none">
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="p-3 border-t border-border/20 space-y-2">
          <Link
            to="/settings"
            className="flex flex-col items-center space-y-1 p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium tracking-wide">Settings</span>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="flex flex-col items-center space-y-1 p-3 w-full rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-medium tracking-wide">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};