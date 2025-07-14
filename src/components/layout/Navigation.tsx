import React, { useState } from 'react';
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
  Shield,
  MoreHorizontal,
  X,
  MessageCircle
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export const Navigation: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const { isMobile, isTablet, isDesktop } = useViewport();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Mobile Navigation with Settings Sheet
  if (isMobile) {
    return (
      <>
        <nav className="fixed bottom-0 left-0 right-0 z-50 mobile-nav-safe">
          <div className="glass-nav border-t border-border/20 mx-2 mb-2 rounded-2xl shadow-lg">
            <div className="grid grid-cols-5 gap-1 p-2">
              {/* Main navigation items including Messages */}
              {navItems.map(({ href, icon: Icon, label }) => (
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
              
              {/* More button that opens Sheet */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="glass-button flex flex-col items-center justify-center min-h-[48px] min-w-[48px] p-2 rounded-xl transition-all duration-300 touch-manipulation text-muted-foreground hover:text-foreground hover:bg-primary/10 active:scale-95">
                    <MoreHorizontal className="w-5 h-5 mb-1" strokeWidth={2} />
                    <span className="text-[10px] font-medium tracking-tight leading-none">More</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="glass-modal border-0 rounded-t-3xl max-h-[80vh]">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="font-display text-xl text-center">Menu</SheetTitle>
                  </SheetHeader>
                  
                   <div className="spacing-responsive-md">
                    {/* Profile Section */}
                    <div className="glass-section p-4 rounded-xl mb-4">
                      <Link 
                        to="/profile" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors touch-manipulation"
                      >
                        <User className="w-6 h-6 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium">Profile</div>
                          <div className="text-sm text-muted-foreground">View and edit your profile</div>
                        </div>
                      </Link>
                    </div>

                    {/* Settings & More */}
                    <div className="glass-section p-4 rounded-xl mb-4">
                      <div className="space-y-2">
                        {secondaryNavItems.map(({ href, icon: Icon, label }) => (
                          <Link 
                            key={href}
                            to={href} 
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors touch-manipulation ${
                              isActive(href) ? 'bg-primary/20 text-primary' : ''
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                            <div className="flex-1">
                              <div className="font-medium">{label}</div>
                              <div className="text-sm text-muted-foreground">
                                {href === '/messages' ? 'Direct messages with members' : 
                                 href === '/profile' ? 'View and edit your profile' :
                                 href === '/admin' ? 'Manage the community' : ''}
                              </div>
                            </div>
                          </Link>
                        ))}
                        
                        <Link 
                          to="/settings" 
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors touch-manipulation ${
                            isActive('/settings') ? 'bg-primary/20 text-primary' : ''
                          }`}
                        >
                          <Settings className="w-6 h-6" />
                          <div className="flex-1">
                            <div className="font-medium">Settings</div>
                            <div className="text-sm text-muted-foreground">Customize your experience</div>
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Logout */}
                    <div className="glass-section p-4 rounded-xl">
                      <button 
                        onClick={() => {
                          setMobileMenuOpen(false);
                          signOut();
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 transition-colors touch-manipulation w-full text-left text-destructive"
                      >
                        <LogOut className="w-6 h-6" />
                        <div className="flex-1">
                          <div className="font-medium">Sign Out</div>
                          <div className="text-sm text-muted-foreground">Securely sign out of your account</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
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