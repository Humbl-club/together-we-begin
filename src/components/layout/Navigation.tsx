import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { useViewport } from '@/hooks/use-mobile';
import { 
  Home, 
  Users, 
  Calendar, 
  Trophy, 
  User, 
  Settings, 
  LogOut,
  Shield
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const { isMobile, isTablet, isDesktop } = useViewport();

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/social', icon: Users, label: 'Community' },
    { href: '/events', icon: Calendar, label: 'Events' },
    { href: '/challenges', icon: Trophy, label: 'Wellness' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  if (isAdmin) {
    navItems.push({ href: '/admin', icon: Shield, label: 'Admin' });
  }

  const isActive = (path: string) => location.pathname === path;

  // Mobile Navigation
  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 mobile-nav-safe">
        <div className="glass-nav border-t border-border/20 mx-2 mb-2 rounded-2xl shadow-lg">
          <div className="grid grid-cols-5 gap-1 p-2">
            {navItems.slice(0, 5).map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                to={href}
                 className={`glass-button flex flex-col items-center justify-center min-h-[48px] min-w-[48px] p-2 rounded-xl transition-all duration-300 touch-manipulation ${
                   isActive(href)
                     ? 'bg-primary/20 text-primary border-primary/30 shadow-lg scale-105'
                     : 'text-muted-foreground hover:text-foreground hover:bg-primary/10 active:scale-95'
                 }`}
              >
                <Icon className="w-5 h-5 mb-1" strokeWidth={isActive(href) ? 2.5 : 2} />
                <span className="text-[10px] font-medium tracking-tight leading-none">
                  {label.length > 7 ? label.substring(0, 6) + '.' : label}
                </span>
              </Link>
            ))}
          </div>
          
          {/* Mobile overflow menu for admin */}
          {isAdmin && navItems.length > 5 && (
            <div className="border-t border-border/20 p-2">
              <Link
                to="/admin"
                className={`flex items-center justify-center min-h-[44px] p-2 rounded-xl transition-all duration-200 touch-manipulation ${
                  isActive('/admin')
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 active:scale-95'
                }`}
              >
                <Shield className="w-4 h-4 mr-2" />
                <span className="text-xs font-medium">Admin</span>
              </Link>
            </div>
          )}
        </div>
      </nav>
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
            {navItems.map(({ href, icon: Icon, label }) => (
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
          {navItems.map(({ href, icon: Icon, label }) => (
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