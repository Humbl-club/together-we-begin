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
  const { isMobile } = useViewport();

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

  // Mobile Navigation - Bottom Fixed
  if (isMobile) {
    return (
      <nav className="adaptive-nav">
        <div className="editorial-card border-t border-border/20 backdrop-blur-xl mx-2 mb-2 rounded-2xl shadow-lg">
          <div className="responsive-grid gap-1 p-2">
            {navItems.slice(0, 5).map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                to={href}
                className={`modern-button flex-col justify-center ${
                  isActive(href)
                    ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 active:scale-95'
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
                className={`modern-button w-full ${
                  isActive('/admin')
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
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

  // Desktop Navigation - Side Fixed
  return (
    <nav className="adaptive-nav">
      <div className="editorial-card h-full border-r border-border/20 backdrop-blur-xl flex flex-col rounded-none">
        {/* Logo */}
        <div className="p-4 border-b border-border/20">
          <div className="aspect-square bg-editorial-charcoal rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-medium fluid-subheading tracking-tight">H</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col space-y-3 p-3 mt-6">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              to={href}
              className={`adaptive-card focus-ring transition-all duration-200 group ${
                isActive(href)
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Icon className="w-5 h-5" strokeWidth={isActive(href) ? 2.5 : 2} />
                <span className="text-xs font-medium tracking-wide text-center leading-none">
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-border/20 space-y-2">
          <Link
            to="/settings"
            className="adaptive-card focus-ring flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium tracking-wide">Settings</span>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="adaptive-card focus-ring flex flex-col items-center space-y-1 w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-medium tracking-wide">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};