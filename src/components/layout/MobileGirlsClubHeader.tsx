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
      {/* Compact glass top bar with subtle branding */}
      <div className="relative h-12 bg-background/70 backdrop-blur-xl border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
        <div className="h-full px-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary/60" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-wide text-foreground/90">Humbl Girlstar</span>
          </div>
        </div>
      </div>
    </header>
  );
};