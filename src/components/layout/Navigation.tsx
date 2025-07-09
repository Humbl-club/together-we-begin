
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

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/social', icon: Users, label: 'Social' },
    { href: '/events', icon: Calendar, label: 'Events' },
    { href: '/challenges', icon: Trophy, label: 'Challenges' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  if (isAdmin) {
    navItems.push({ href: '/admin', icon: Shield, label: 'Admin' });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-auto md:left-0 md:w-20 md:h-full">
      <div className="glass-card rounded-t-3xl md:rounded-none md:rounded-r-3xl p-4 md:h-full md:flex md:flex-col">
        {/* Desktop Logo */}
        <div className="hidden md:block mb-8 text-center">
          <div className="w-12 h-12 mx-auto bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">H</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex justify-around md:flex-col md:space-y-4 md:flex-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              to={href}
              className={`flex flex-col items-center space-y-1 md:space-y-2 p-2 rounded-2xl transition-all duration-300 ${
                isActive(href)
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex md:flex-col md:space-y-2 md:mt-8">
          <Link
            to="/settings"
            className="flex flex-col items-center space-y-1 p-2 rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">Settings</span>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="flex flex-col items-center space-y-1 p-2 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xs font-medium">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};
