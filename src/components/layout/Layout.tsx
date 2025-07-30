import React, { memo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useViewport } from '@/hooks/use-mobile';
import { Navigation } from './Navigation';
import { MobileLoading } from '@/components/ui/mobile-loading';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = memo(({ children }) => {
  const { user, loading } = useAuth();
  const { isMobile, isTablet } = useViewport();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-editorial-hero safe-area-layout">
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
    if (isMobile) return 'pb-24 pt-4'; // Space for bottom nav
    if (isTablet) return 'pl-16 pt-4'; // Space for side nav
    return 'pl-20 pt-4'; // Desktop side nav
  };

  const getMainPadding = () => {
    if (isMobile) return 'px-4 py-4';
    if (isTablet) return 'px-6 py-6';
    return 'px-8 py-8';
  };

  return (
    <div className={`min-h-screen bg-editorial-subtle safe-area-layout ${getLayoutPadding()}`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <Navigation />
      <main className={`responsive-container max-w-7xl mx-auto ${getMainPadding()}`}>
        <div className="mobile-nav-safe" style={{ paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : '0' }}>
          {children}
        </div>
      </main>
    </div>
  );
});