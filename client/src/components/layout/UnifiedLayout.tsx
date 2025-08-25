import React, { memo } from 'react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { MobileFirstNavigation } from './MobileFirstNavigation';
import { cn } from '@/lib/utils';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = memo(({ children, profile }) => {
  const { isMobile, isTablet, safeAreaInsets } = useMobileFirst();

  // Mobile-first approach
  if (isMobile) {
    return (
      <div className="mobile-app-container">
        {/* Mobile main content */}
        <main 
          className="min-h-screen bg-background"
          style={{
            paddingTop: `max(16px, ${safeAreaInsets.top}px)`,
            paddingBottom: `max(100px, ${safeAreaInsets.bottom + 80}px)`,
            paddingLeft: `max(0px, ${safeAreaInsets.left}px)`,
            paddingRight: `max(0px, ${safeAreaInsets.right}px)`,
          }}
        >
          {children}
        </main>
        
        {/* Mobile navigation */}
        <MobileFirstNavigation profile={profile} />
      </div>
    );
  }

  // Tablet layout
  if (isTablet) {
    return (
      <div className="tablet-layout flex min-h-screen bg-background">
        <aside className="w-16 border-r border-border flex flex-col">
          <MobileFirstNavigation profile={profile} />
        </aside>
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8 max-w-4xl">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="desktop-layout flex min-h-screen bg-background">
      <aside className="w-20 border-r border-border flex flex-col">
        <MobileFirstNavigation profile={profile} />
      </aside>
      
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-8 py-12 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
});

UnifiedLayout.displayName = 'UnifiedLayout';