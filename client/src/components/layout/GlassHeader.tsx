import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GlassHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  actions,
  className
}) => {
  const location = useLocation();

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-40 nav-glass-floating",
      "pt-[env(safe-area-inset-top,0px)] px-4",
      className
    )}>
      <div className="flex items-center justify-between h-16 px-2">
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="h-8 w-8 p-0 rounded-full hover:bg-background/50"
            >
              <Link to={-1 as any}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {actions || (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-background/50"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-background/50"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};