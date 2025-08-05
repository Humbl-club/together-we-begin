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
      {/* Flowing glassmorphism header that blends with app */}
      <div className="relative h-28 overflow-hidden">
        {/* Seamless glass foundation */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
        
        {/* Subtle flowing gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/60 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/3" />
        
        {/* Minimal floating elements for elegance */}
        <div className="absolute top-4 right-8 w-2 h-2 rounded-full bg-primary/20 blur-sm animate-pulse" style={{animationDuration: '4s'}} />
        <div className="absolute bottom-6 left-6 w-1.5 h-1.5 rounded-full bg-accent/15 blur-sm animate-pulse" style={{animationDelay: '2s', animationDuration: '3s'}} />
        
        {/* Clean content layout */}
        <div className="relative h-full flex items-center justify-center px-6">
          <div className="text-center">
            {/* Clean typography matching app style */}
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-1">
              HUMBL
            </h1>
            
            {/* Consistent subtitle */}
            <p className="text-sm font-medium text-muted-foreground tracking-[0.15em] uppercase">
              girls club
            </p>
            
            {/* Simple decorative line */}
            <div className="flex items-center justify-center mt-3">
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
          </div>
        </div>
        
        {/* Flowing bottom edge that blends into content */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border/30" />
      </div>
    </header>
  );
};