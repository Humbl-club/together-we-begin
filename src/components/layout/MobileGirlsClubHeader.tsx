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
      {/* Apple-style light glassmorphism banner */}
      <div className="relative h-28 overflow-hidden">
        {/* Multiple layered glass effects for Apple-style depth */}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-white/5" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        {/* Subtle noise texture overlay for premium feel */}
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxmaWx0ZXIgaWQ9Im5vaXNlIj4KICAgICAgPGZlVHVyYnVsZW5jZSBiYXNlRnJlcXVlbmN5PSIwLjkiIG51bU9jdGF2ZXM9IjEiIHNlZWQ9IjIiLz4KICAgICAgPGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPgogICAgPC9maWx0ZXI+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNCIvPgo8L3N2Zz4K')]" />
        
        {/* Floating light orbs for ambient effect */}
        <div className="absolute top-4 left-8 w-3 h-3 rounded-full bg-primary/20 blur-sm animate-pulse" />
        <div className="absolute top-6 right-12 w-2 h-2 rounded-full bg-accent/30 blur-sm animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-4 left-1/3 w-1.5 h-1.5 rounded-full bg-muted-foreground/20 blur-sm animate-pulse" style={{animationDelay: '2s'}} />
        
        {/* Content with elevated glassmorphism */}
        <div className="relative h-full flex items-center justify-center px-6">
          <div className="text-center relative">
            {/* Enhanced typography with subtle glow */}
            <h1 className="text-3xl font-bold text-foreground tracking-tight relative">
              <span className="absolute inset-0 text-primary/20 blur-sm">HUMBL</span>
              <span className="relative">HUMBL</span>
            </h1>
            <p className="text-sm text-muted-foreground/80 mt-2 font-medium tracking-wide">
              girls club
            </p>
            
            {/* Subtle accent line */}
            <div className="mt-3 mx-auto w-16 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
        </div>
        
        {/* Multi-layered border effects */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/20" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>
    </header>
  );
};