import React, { memo } from 'react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { Navigation } from './Navigation';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = memo(({ children, profile }) => {
  const { isMobile } = useMobileFirst();

  if (isMobile) {
    return (
      <div className="mobile-app-container mobile-layout">
        {/* Main Content Area - Mobile First */}
        <main className="pb-20 min-h-screen">
          {children}
        </main>
        
        {/* Mobile Navigation */}
        <Navigation profile={profile} />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="mobile-app-container desktop-layout">
      {/* Desktop Sidebar Navigation */}
      <Navigation profile={profile} />
      
      {/* Desktop Main Content */}
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  );
});

export default MobileOptimizedLayout;