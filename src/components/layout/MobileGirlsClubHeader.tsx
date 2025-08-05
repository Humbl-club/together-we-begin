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
      {/* Artistic glassmorphism header with creative elements */}
      <div className="relative h-32 overflow-hidden">
        {/* Multi-layered glass foundation */}
        <div className="absolute inset-0 bg-background/70 backdrop-blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/40 to-background/60" />
        
        {/* Creative gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-accent/4 to-primary/6" />
        <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-foreground/3 to-primary/5" />
        <div className="absolute inset-0 bg-radial-gradient from-primary/10 via-transparent to-accent/8" />
        
        {/* Artistic geometric elements */}
        <div className="absolute top-4 left-8 w-8 h-8 rotate-45 bg-gradient-to-br from-primary/20 to-transparent rounded-sm blur-sm animate-pulse" style={{animationDuration: '4s'}} />
        <div className="absolute top-8 right-12 w-6 h-6 rotate-12 bg-gradient-to-tl from-accent/15 to-primary/10 rounded-full blur-md animate-pulse" style={{animationDelay: '1s', animationDuration: '5s'}} />
        <div className="absolute bottom-6 left-16 w-4 h-4 -rotate-12 bg-gradient-to-br from-foreground/15 to-accent/10 rounded-sm blur-sm animate-pulse" style={{animationDelay: '2s', animationDuration: '3.5s'}} />
        <div className="absolute top-12 right-20 w-3 h-3 rotate-45 bg-gradient-to-br from-primary/25 to-accent/15 rounded-full blur-xs animate-pulse" style={{animationDelay: '0.5s', animationDuration: '4.5s'}} />
        
        {/* Flowing light streaks */}
        <div className="absolute top-0 left-1/4 w-0.5 h-20 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent rotate-12 blur-sm" />
        <div className="absolute top-0 right-1/3 w-0.5 h-16 bg-gradient-to-b from-accent/25 via-accent/8 to-transparent -rotate-6 blur-sm" />
        <div className="absolute bottom-0 left-1/2 w-0.5 h-12 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent rotate-3 blur-sm" />
        
        {/* Creative content with enhanced typography */}
        <div className="relative h-full flex items-center justify-center px-6">
          <div className="text-center relative">
            {/* Main title with artistic effects */}
            <div className="relative mb-3">
              {/* Layered glow effects */}
              <h1 className="absolute inset-0 text-4xl font-bold text-primary/20 blur-lg tracking-tight transform scale-105">
                HUMBL
              </h1>
              <h1 className="absolute inset-0 text-4xl font-bold text-accent/15 blur-md tracking-tight transform scale-102">
                HUMBL
              </h1>
              {/* Sharp main text */}
              <h1 className="relative text-4xl font-bold text-foreground tracking-tight bg-gradient-to-r from-foreground via-foreground/95 to-foreground/90 bg-clip-text">
                HUMBL
              </h1>
            </div>
            
            {/* Enhanced subtitle with artistic spacing */}
            <div className="relative">
              <p className="text-sm font-medium text-muted-foreground/90 tracking-[0.25em] uppercase mb-4">
                girls club
              </p>
              
              {/* Sophisticated decorative pattern */}
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-px bg-gradient-to-r from-transparent via-primary/50 to-primary/30" />
                <div className="w-2 h-2 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 rotate-45" />
                <div className="w-4 h-px bg-gradient-to-r from-primary/40 to-accent/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-accent/35 to-primary/25" />
                <div className="w-4 h-px bg-gradient-to-l from-primary/40 to-accent/30" />
                <div className="w-2 h-2 rounded-full bg-gradient-to-bl from-primary/40 to-accent/30 -rotate-45" />
                <div className="w-6 h-px bg-gradient-to-l from-transparent via-primary/50 to-primary/30" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Artistic border and edge effects */}
        <div className="absolute inset-0 ring-1 ring-inset ring-primary/20 rounded-lg" style={{transform: 'scale(0.95)'}} />
        <div className="absolute inset-0 ring-1 ring-inset ring-accent/15 rounded-xl" style={{transform: 'scale(0.98)'}} />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        
        {/* Flowing transition to content */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent via-background/30 to-background/80" />
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-b from-transparent to-background" />
      </div>
    </header>
  );
};