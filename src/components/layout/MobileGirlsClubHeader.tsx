import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Heart, Star } from 'lucide-react';

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
      {/* Full-width Banner with Glassmorphism */}
      <div className="relative h-20 glass-card-enhanced border-0 border-b border-border/20 rounded-none">
        {/* Layered background gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-blue-50/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-100/20 via-transparent to-purple-100/20" />
        
        {/* Decorative floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-3 right-8 text-pink-300/30 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="absolute top-6 right-16 text-purple-300/40 animate-pulse delay-1000">
            <Heart className="w-4 h-4" />
          </div>
          <div className="absolute top-2 left-8 text-blue-300/30 animate-pulse delay-500">
            <Star className="w-4 h-4" />
          </div>
          <div className="absolute top-8 left-16 text-pink-300/20 animate-pulse delay-1500">
            <Sparkles className="w-3 h-3" />
          </div>
        </div>
        
        {/* Main content centered */}
        <div className="relative h-full flex flex-col items-center justify-center px-6">
          {/* Main brand title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent tracking-wider">
              HUMBL
            </h1>
            
            {/* Subtitle with elegant spacing */}
            <div className="relative mt-1">
              <p className="text-sm font-light text-muted-foreground tracking-[0.25em] uppercase">
                girls club
              </p>
              
              {/* Decorative accent line */}
              <div className="mx-auto mt-2 w-24 h-[1px] bg-gradient-to-r from-transparent via-pink-400/60 to-transparent" />
            </div>
          </div>
        </div>
        
        {/* Subtle bottom border with gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-200/20 via-purple-200/40 to-blue-200/20" />
      </div>
    </header>
  );
};