import React, { memo } from 'react';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { iPadNavigation } from './iPadNavigation';
import { SafeAreaProvider } from '@/components/layout/SafeAreaProvider';

interface iPadLayoutProps {
  children: React.ReactNode;
  profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

const IPadNavigation = iPadNavigation;

export const iPadLayout: React.FC<iPadLayoutProps> = memo(({ children, profile }) => {
  const { isTablet, isDesktop } = useMobileOptimization();
  
  // Only render on tablet/iPad screens
  if (!isTablet && !isDesktop) {
    return <>{children}</>;
  }

  return (
    <SafeAreaProvider>
      <div className="ipad-layout-container">
        {/* iPad-style Sidebar Navigation */}
        <IPadNavigation profile={profile} />
        
        {/* Main Content Area */}
        <main className="ipad-main-content">
          <div className="ipad-content-wrapper">
            {children}
          </div>
        </main>
      </div>
    </SafeAreaProvider>
  );
});

iPadLayout.displayName = 'iPadLayout';