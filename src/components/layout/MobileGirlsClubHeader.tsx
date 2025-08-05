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
      {/* Artistic glassmorphism banner with premium aesthetics */}
      <div className="relative h-32 overflow-hidden">
        {/* Primary glass foundation */}
        <div className="absolute inset-0 bg-white/25 backdrop-blur-3xl" />
        
        {/* Layered gradient system for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/8 via-transparent to-accent/6" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/2 to-transparent" />
        
        {/* Artistic light rays */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-primary/20 via-primary/5 to-transparent rotate-12 transform origin-top" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-accent/15 via-accent/3 to-transparent -rotate-6 transform origin-top" />
        
        {/* Floating artistic elements */}
        <div className="absolute top-6 left-12 w-4 h-4 rounded-full bg-primary/15 blur-md animate-pulse" style={{animationDuration: '3s'}} />
        <div className="absolute top-8 right-16 w-3 h-3 rounded-full bg-accent/20 blur-sm animate-pulse" style={{animationDelay: '1.5s', animationDuration: '4s'}} />
        <div className="absolute bottom-8 left-1/4 w-2 h-2 rounded-full bg-foreground/10 blur-sm animate-pulse" style={{animationDelay: '2.5s', animationDuration: '5s'}} />
        <div className="absolute top-12 left-2/3 w-1.5 h-1.5 rounded-full bg-primary/25 blur-xs animate-pulse" style={{animationDelay: '0.5s', animationDuration: '3.5s'}} />
        
        {/* Elegant content composition */}
        <div className="relative h-full flex items-center justify-center px-8">
          <div className="text-center relative">
            {/* Sophisticated typography with artistic flair */}
            <div className="relative mb-2">
              {/* Background glow effect */}
              <h1 className="absolute inset-0 text-4xl font-bold text-primary/15 blur-md tracking-tight">
                HUMBL
              </h1>
              {/* Main text with elegant styling */}
              <h1 className="relative text-4xl font-bold text-foreground tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/90 bg-clip-text">
                HUMBL
              </h1>
            </div>
            
            {/* Artistic subtitle with enhanced spacing */}
            <div className="relative">
              <p className="text-sm font-medium text-muted-foreground/85 tracking-[0.2em] uppercase">
                girls club
              </p>
              
              {/* Elegant decorative elements */}
              <div className="flex items-center justify-center mt-4 space-x-3">
                <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                <div className="w-8 h-px bg-gradient-to-l from-transparent to-primary/40" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Sophisticated border system */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/15" />
        <div className="absolute inset-0 ring-1 ring-inset ring-primary/10" style={{transform: 'scale(0.98)'}} />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        {/* Subtle artistic overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/5" />
      </div>
    </header>
  );
};