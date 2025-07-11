import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-auto md:left-0 md:w-20 md:h-full">
      <div className="editorial-card border-t border-border/20 md:border-t-0 md:border-r md:rounded-none backdrop-blur-xl p-4 md:h-full md:flex md:flex-col">
        {/* Desktop Logo */}
        <div className="hidden md:block mb-8 text-center">
          <div className="w-12 h-12 mx-auto bg-editorial-charcoal rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-medium text-xl tracking-tight">H</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex justify-between px-4 md:flex-col md:space-y-3 md:flex-1 md:px-0">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              to={href}
              className={`flex flex-col items-center space-y-1 md:space-y-2 p-3 rounded-lg transition-all duration-200 ${
                isActive(href)
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium tracking-wide">{label}</span>
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex md:flex-col md:space-y-2 md:mt-8">
          <Link
            to="/settings"
            className="flex flex-col items-center space-y-1 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium tracking-wide">Settings</span>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="flex flex-col items-center space-y-1 p-3 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-medium tracking-wide">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};