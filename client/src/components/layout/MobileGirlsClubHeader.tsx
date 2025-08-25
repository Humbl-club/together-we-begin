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
      <div className="nav-glass relative border-b" style={{ height: 'var(--mobile-header-height)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="h-full px-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60" aria-hidden="true" />
            <span className="text-[13px] font-semibold tracking-wide text-foreground/90">Humbl Girls Club</span>
          </div>
        </div>
      </div>
    </header>
  );
};