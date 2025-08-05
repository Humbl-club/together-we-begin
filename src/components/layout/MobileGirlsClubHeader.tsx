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
      {/* Premium Apple-style glassmorphism header */}
      <div className="relative h-32 overflow-hidden">
        {/* Apple-quality glass foundation */}
        <div className="absolute inset-0 bg-background/85 backdrop-blur-[20px] backdrop-saturate-150" />
        
        {/* Refined depth layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/75 to-background/85" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/2" />
        
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-primary/8 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-24 h-12 bg-accent/6 blur-2xl rounded-full" />
        
        {/* Minimal elegant accents */}
        <div className="absolute top-6 right-8 w-1 h-1 rounded-full bg-primary/30 animate-pulse" style={{animationDuration: '3s'}} />
        <div className="absolute bottom-8 left-12 w-0.5 h-0.5 rounded-full bg-accent/25 animate-pulse" style={{animationDelay: '1.5s', animationDuration: '4s'}} />
        
        {/* Clean, centered content */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            {/* Premium typography */}
            <div className="relative">
              <h1 className="text-3xl font-bold text-foreground tracking-[-0.02em] leading-none">
                HUMBL
              </h1>
            </div>
            
            {/* Refined subtitle */}
            <p className="text-sm font-medium text-muted-foreground/80 tracking-[0.2em] uppercase">
              girls club
            </p>
            
            {/* Minimalist accent */}
            <div className="flex items-center justify-center">
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </div>
          </div>
        </div>
        
        {/* Apple-style borders */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        {/* Seamless content transition */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/60" />
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-b from-transparent to-background" />
      </div>
    </header>
  );
};