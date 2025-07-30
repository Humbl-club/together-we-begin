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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export const Navigation: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const { isMobile, isTablet, isDesktop } = useViewport();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const haptics = useHapticFeedback();

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
          <div className="glass-nav border-t border-border/40 mx-3 mb-3 rounded-3xl shadow-2xl backdrop-blur-3xl bg-background/95 border border-border/40">
            <div className="grid grid-cols-4 gap-3 p-4">
              {/* Main navigation items - reduced to 4 */}
              {navItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => haptics.tap()}
                  className={`glass-button flex flex-col items-center justify-center min-h-[60px] min-w-[60px] p-4 rounded-2xl transition-all duration-500 touch-manipulation ${
                    isActive(href)
                      ? 'bg-primary/30 text-primary border-primary/50 shadow-2xl scale-110 transform ring-2 ring-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-primary/15 active:scale-95 hover:shadow-lg'
                  }`}
                >
                  <Icon className="w-7 h-7 mb-2" strokeWidth={isActive(href) ? 2.5 : 2} />
                  <span className="text-xs font-semibold tracking-tight leading-none">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </nav>
        
        {/* Floating Messages Button */}
        <Link
          to="/messages"
          onClick={() => haptics.impact('light')}
          className={`fixed bottom-28 right-5 z-40 glass-button w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-2 transition-all duration-500 hover:scale-110 active:scale-95 ${
            isActive('/messages')
              ? 'bg-primary/30 text-primary border-primary/50 shadow-primary/25 ring-4 ring-primary/20'
              : 'bg-background/90 text-muted-foreground hover:text-foreground hover:bg-primary/20 active:scale-95 hover:shadow-2xl'
          }`}
        >
          <MessageCircle className="w-7 h-7" strokeWidth={isActive('/messages') ? 2.5 : 2} />
        </Link>

        {/* More Menu Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button 
              onClick={() => haptics.impact('medium')}
              className="fixed bottom-28 left-5 z-40 glass-button w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-2 transition-all duration-500 bg-background/90 text-muted-foreground hover:text-foreground hover:bg-primary/20 hover:scale-110 active:scale-95 hover:shadow-2xl"
            >
              <MoreHorizontal className="w-7 h-7" strokeWidth={2} />
            </button>
          </SheetTrigger>
                <SheetContent side="bottom" className="glass-modal border-0 rounded-t-3xl max-h-[85vh] bg-background/95 backdrop-blur-3xl">
                  <SheetHeader className="mb-8">
                    <SheetTitle className="font-display text-2xl text-center text-primary">Menu</SheetTitle>
                  </SheetHeader>
                  
                   <div className="spacing-responsive-md px-2">
                    {/* Profile Section */}
                    <div className="glass-section p-6 rounded-2xl mb-6 bg-primary/5 border border-primary/10">
                      <Link 
                        to="/profile" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-primary/10 transition-all duration-300 touch-manipulation min-h-[56px]"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg">Profile</div>
                          <div className="text-sm text-muted-foreground">View and edit your profile</div>
                        </div>
                      </Link>
                    </div>

                    {/* Settings & More */}
                    <div className="glass-section p-6 rounded-2xl mb-6">
                      <div className="space-y-3">
                        {secondaryNavItems.map(({ href, icon: Icon, label }) => (
                          <Link 
                            key={href}
                            to={href} 
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-4 p-4 rounded-xl hover:bg-primary/10 transition-all duration-300 touch-manipulation min-h-[56px] ${
                              isActive(href) ? 'bg-primary/20 text-primary' : ''
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-base">{label}</div>
                              <div className="text-sm text-muted-foreground">
                                {href === '/admin' ? 'Manage the community' : ''}
                              </div>
                            </div>
                          </Link>
                        ))}
                        
                        <Link 
                          to="/qr-scanner" 
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-4 p-4 rounded-xl hover:bg-primary/10 transition-all duration-300 touch-manipulation min-h-[56px] ${
                            isActive('/qr-scanner') ? 'bg-primary/20 text-primary' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center">
                            <QrCode className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-base">Scan QR Code</div>
                            <div className="text-sm text-muted-foreground">Mark event attendance and earn points</div>
                          </div>
                        </Link>
                        
                        <Link 
                          to="/settings" 
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-4 p-4 rounded-xl hover:bg-primary/10 transition-all duration-300 touch-manipulation min-h-[56px] ${
                            isActive('/settings') ? 'bg-primary/20 text-primary' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center">
                            <Settings className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-base">Settings</div>
                            <div className="text-sm text-muted-foreground">Customize your experience</div>
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Logout */}
                    <div className="glass-section p-6 rounded-2xl bg-destructive/5 border border-destructive/10">
                      <button 
                        onClick={() => {
                          setMobileMenuOpen(false);
                          signOut();
                        }}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-destructive/10 transition-all duration-300 touch-manipulation w-full text-left text-destructive min-h-[56px]"
                      >
                        <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                          <LogOut className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-base">Sign Out</div>
                          <div className="text-sm text-muted-foreground">Securely sign out of your account</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
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