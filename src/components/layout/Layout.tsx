import React, { memo, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useViewport } from '@/hooks/use-mobile';
import { Navigation } from './Navigation';
import { MobileGirlsClubHeader } from './MobileGirlsClubHeader';
import { MobileLoading } from '@/components/ui/mobile-loading';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = memo(({ children }) => {
  const { user, loading } = useAuth();
  const { isMobile, isTablet } = useViewport();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  
  // Show header only on dashboard/home routes
  const showHeader = location.pathname === '/' || location.pathname === '/dashboard';

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        setProfile(data || user.user_metadata);
      }
    };

    fetchProfile();
  }, [user?.id, user?.user_metadata]);

  if (loading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center bg-editorial-hero safe-area-layout",
        "pt-[env(safe-area-inset-top,0px)]"
      )}>
        <MobileLoading 
          variant="ios"
          size={isMobile ? "md" : "lg"}
          text="Loading your experience..."
          className="glass-card rounded-xl p-8 max-w-sm mobile:max-w-xs mobile:p-6"
        />
      </div>
    );
  }

  // Calculate layout padding based on viewport
  const getLayoutPadding = () => {
    if (isMobile) return `pb-24 ${showHeader ? 'pt-32' : 'pt-4'}`; // Space for flowing header
    if (isTablet) return 'pl-16 pt-4'; // Space for side nav
    return 'pl-20 pt-4'; // Desktop side nav
  };

  const getMainPadding = () => {
    if (isMobile) return 'px-4 py-4';
    if (isTablet) return 'px-6 py-6';
    return 'px-8 py-8';
  };

  // Use the new unified mobile-first layout system with glass effects
  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground",
      "pt-[env(safe-area-inset-top,0px)]",
      getLayoutPadding()
    )}>
      {/* Mobile Girls Club Header - only on dashboard */}
      {isMobile && showHeader && <MobileGirlsClubHeader />}
      
      <Navigation profile={profile} />
      <main className={cn(
        `responsive-container max-w-7xl mx-auto ${getMainPadding()}`,
        "px-[env(safe-area-inset-left,0px)]",
        "pr-[env(safe-area-inset-right,0px)]"
      )}>
        {/* Pull to refresh indicator */}
        <div className="pull-refresh-indicator" />
        {children}
      </main>
    </div>
  );
});