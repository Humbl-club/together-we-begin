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
      {/* Enhanced Glassmorphism Banner */}
      <div className="relative h-28 glass-nav border-0 border-b border-border/30">
        {/* Additional glass layers for depth */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background/20" />
        
        {/* Subtle magazine-style pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/10 via-transparent to-accent/5" />
        
        {/* Content with magazine elegance */}
        <div className="relative h-full flex flex-col items-center justify-center px-8">
          <div className="text-center space-y-2">
            {/* Editorial-style brand name */}
            <h1 className="text-3xl font-light tracking-[0.15em] text-foreground/90 uppercase">
              HUMBL
            </h1>
            
            {/* Sophisticated subtitle */}
            <div className="relative">
              <p className="text-sm font-light text-muted-foreground tracking-[0.3em] uppercase">
                girls club
              </p>
              
              {/* Elegant divider line */}
              <div className="mx-auto mt-3 w-32 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-60" />
            </div>
          </div>
        </div>
        
        {/* Sophisticated bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        {/* Additional glass enhancement */}
        <div className="absolute inset-0 ring-1 ring-inset ring-border/20" />
      </div>
    </header>
  );
};