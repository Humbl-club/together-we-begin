import React from 'react';
import { cn } from '@/lib/utils';

interface MobileGirlsClubHeaderProps {
  className?: string;
}

export const MobileGirlsClubHeader: React.FC<MobileGirlsClubHeaderProps> = ({ className }) => {
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-40",
      "pt-[env(safe-area-inset-top,0px)]",
      className
    )}>
      {/* Seamless glassmorphism banner matching app design */}
      <div className="relative h-24 glass-nav border-0 border-b border-border/20">
        {/* Enhanced glass background layers */}
        <div className="absolute inset-0 bg-background/70 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-card/30 to-background/10" />
        
        {/* Content matching existing typography */}
        <div className="relative h-full flex items-center justify-center px-6">
          <div className="text-center">
            {/* Match the exact typography from MobileDashboard */}
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              HUMBL
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              girls club
            </p>
          </div>
        </div>
        
        {/* Subtle glass border effect */}
        <div className="absolute inset-0 ring-1 ring-inset ring-border/10" />
      </div>
    </header>
  );
};