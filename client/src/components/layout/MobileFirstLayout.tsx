import React, { memo } from 'react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { Navigation } from './Navigation';
import { cn } from '@/lib/utils';

interface MobileFirstLayoutProps {
  children: React.ReactNode;
  profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export const MobileFirstLayout: React.FC<MobileFirstLayoutProps> = memo(({ children, profile }) => {
  const { isMobile, isTablet, safeAreaInsets } = useMobileFirst();

  // Mobile-first layout
  if (isMobile) {
    return (
      <div className="mobile-app-container">
        {/* Mobile-specific safe area handling */}
        <div 
          className="min-h-screen bg-background"
          style={{
            paddingTop: `max(16px, ${safeAreaInsets.top}px)`,
            paddingLeft: `max(0px, ${safeAreaInsets.left}px)`,
            paddingRight: `max(0px, ${safeAreaInsets.right}px)`,
          }}
        >
          {/* Main content with bottom navigation space */}
          <main className="pb-24">
            <div 
              className="mobile-content"
              style={{
                paddingBottom: `max(24px, ${safeAreaInsets.bottom}px)`
              }}
            >
              {children}
            </div>
          </main>
          
          {/* Fixed bottom navigation */}
          <Navigation profile={profile} />
        </div>
      </div>
    );
  }

  // Enhanced Tablet layout with improved spacing and glassmorphism
  if (isTablet) {
    return (
      <div className="tablet-layout flex min-h-screen bg-background">
        {/* Enhanced Tablet Sidebar Navigation */}
        <div className="w-20 border-r border-border/60 glass-nav">
          <Navigation profile={profile} />
        </div>
        
        {/* Tablet Main content with optimized spacing */}
        <main className="flex-1 overflow-auto">
          <div className="tablet-container mx-auto px-6 py-6 max-w-5xl">
            <div className="tablet-content-wrapper space-y-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Enhanced Desktop layout
  return (
    <div className="desktop-layout flex min-h-screen bg-background">
      {/* Enhanced Desktop Sidebar */}
      <div className="w-24 border-r border-border/60 glass-nav">
        <Navigation profile={profile} />
      </div>
      
      {/* Desktop Main content */}
      <main className="flex-1 overflow-auto">
        <div className="desktop-container mx-auto px-8 py-12 max-w-7xl">
          <div className="desktop-content-wrapper space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
});

MobileFirstLayout.displayName = 'MobileFirstLayout';