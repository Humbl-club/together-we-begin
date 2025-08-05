import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Heart } from 'lucide-react';

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
      {/* Glassmorphism Header */}
      <div className="nav-glass-floating mx-2 mt-2 rounded-2xl overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/20 via-purple-100/20 to-blue-100/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-300/10 via-pink-300/10 to-purple-300/10" />
        
        {/* Decorative Elements */}
        <div className="absolute top-2 right-4 text-pink-400/30">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="absolute bottom-2 left-4 text-purple-400/30">
          <Heart className="w-3 h-3" />
        </div>
        <div className="absolute top-1 left-6 text-blue-400/30">
          <Sparkles className="w-3 h-3" />
        </div>
        
        {/* Content */}
        <div className="relative px-6 py-4 text-center">
          {/* Main Title */}
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent tracking-wide">
            HUMBL
          </h1>
          
          {/* Subtitle with artistic styling */}
          <div className="relative -mt-1">
            <p className="text-sm font-light text-gray-600 tracking-[0.2em] uppercase">
              girls club
            </p>
            
            {/* Decorative underline */}
            <div className="mx-auto mt-1 w-16 h-[1px] bg-gradient-to-r from-transparent via-pink-400/50 to-transparent" />
          </div>
          
          {/* Tagline */}
          <p className="text-xs text-gray-500/80 mt-2 font-light italic tracking-wide">
            Together we rise ✨
          </p>
        </div>
        
        {/* Bottom gradient border */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pink-300/50 to-transparent" />
      </div>
    </header>
  );
};