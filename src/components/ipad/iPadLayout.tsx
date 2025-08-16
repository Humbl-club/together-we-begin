import React, { memo } from 'react';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { iPadNavigation } from './iPadNavigation';
import { SafeAreaProvider } from '@/components/layout/SafeAreaProvider';
import { cn } from '@/lib/utils';

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
      <div className={cn(
        "ipad-layout-container min-h-screen flex",
        "bg-background text-foreground"
      )}>
        {/* iPad-style Sidebar Navigation */}
        <IPadNavigation profile={profile} />
        
        {/* Main Content Area */}
        <main className={cn(
          "ipad-main-content",
          "pt-[env(safe-area-inset-top,0px)]",
          "pb-[env(safe-area-inset-bottom,0px)]"
        )}>
          <div className="ipad-content-wrapper">
            {children}
          </div>
        </main>
      </div>
    </SafeAreaProvider>
  );
});

iPadLayout.displayName = 'iPadLayout';