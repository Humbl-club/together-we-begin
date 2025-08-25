import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home' },
  { href: '/social', label: 'Community' },
  { href: '/events', label: 'Events' },
  { href: '/challenges', label: 'Wellness' },
];

export const EditorialMasthead: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="hover-scale hidden md:inline-flex text-foreground" />
          <Link to="/dashboard" className="group">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl md:text-3xl tracking-tight leading-none">Humbl Girls Club</span>
              <span className="hidden md:inline text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Community</span>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              to={href}
              className={cn(
                'text-sm font-semibold transition-colors',
                isActive(href)
                  ? 'text-primary underline underline-offset-4'
                  : 'text-foreground hover:text-foreground'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/settings" className="text-sm text-foreground hover:text-foreground font-semibold">
            Settings
          </Link>
          <Link to="/profile" className="text-sm text-foreground hover:text-foreground hidden md:inline font-semibold">
            Profile
          </Link>
        </div>
      </div>
    </header>
  );
};

export default EditorialMasthead;
