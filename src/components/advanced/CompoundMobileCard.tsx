import React, { createContext, useContext, memo, useMemo } from 'react';
import { useViewport } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Advanced compound component pattern for mobile-optimized cards
interface MobileCardContextValue {
  isMobile: boolean;
  variant: 'default' | 'compact' | 'touch-optimized';
}

const MobileCardContext = createContext<MobileCardContextValue | null>(null);

// Main container component
interface MobileCardProps {
  variant?: 'default' | 'compact' | 'touch-optimized';
  children: React.ReactNode;
  className?: string;
}

const MobileCard = memo(({ variant = 'default', children, className, ...props }: MobileCardProps) => {
  const { isMobile } = useViewport();
  
  const contextValue = useMemo(() => ({
    isMobile,
    variant
  }), [isMobile, variant]);

  const cardClasses = useMemo(() => {
    const baseClasses = "glass-card transition-all duration-200";
    const mobileClasses = isMobile 
      ? "active:scale-[0.98] touch-optimized haptic-feedback" 
      : "hover:scale-[1.02]";
    
    const variantClasses = {
      'default': isMobile ? 'p-4 rounded-xl' : 'p-6 rounded-xl',
      'compact': isMobile ? 'p-3 rounded-lg' : 'p-4 rounded-lg',
      'touch-optimized': isMobile ? 'p-4 rounded-xl min-h-[80px]' : 'p-6 rounded-xl'
    };

    return cn(baseClasses, mobileClasses, variantClasses[variant], className);
  }, [isMobile, variant, className]);

  return (
    <MobileCardContext.Provider value={contextValue}>
      <Card className={cardClasses} {...props}>
        {children}
      </Card>
    </MobileCardContext.Provider>
  );
});

// Header component
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const Header = memo(({ children, className }: CardHeaderProps) => {
  const context = useContext(MobileCardContext);
  if (!context) throw new Error('MobileCard.Header must be used within MobileCard');

  const { isMobile } = context;
  
  const headerClasses = useMemo(() => cn(
    "flex items-center justify-between",
    isMobile ? "pb-2" : "pb-3",
    className
  ), [isMobile, className]);

  return (
    <div className={headerClasses}>
      {children}
    </div>
  );
});

// Content component
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const Content = memo(({ children, className }: CardContentProps) => {
  const context = useContext(MobileCardContext);
  if (!context) throw new Error('MobileCard.Content must be used within MobileCard');

  const { isMobile, variant } = context;
  
  const contentClasses = useMemo(() => {
    const spacing = {
      'default': isMobile ? 'space-y-3' : 'space-y-4',
      'compact': 'space-y-2',
      'touch-optimized': isMobile ? 'space-y-3' : 'space-y-4'
    };
    
    return cn(spacing[variant], className);
  }, [isMobile, variant, className]);

  return (
    <div className={contentClasses}>
      {children}
    </div>
  );
});

// Action component
interface CardActionProps {
  children: React.ReactNode;
  className?: string;
}

const Action = memo(({ children, className }: CardActionProps) => {
  const context = useContext(MobileCardContext);
  if (!context) throw new Error('MobileCard.Action must be used within MobileCard');

  const { isMobile } = context;
  
  const actionClasses = useMemo(() => cn(
    "flex items-center gap-2",
    isMobile ? "pt-3 border-t" : "pt-4 border-t",
    className
  ), [isMobile, className]);

  return (
    <div className={actionClasses}>
      {children}
    </div>
  );
});

// Compound component export with proper TypeScript support
const MobileCardComponent = MobileCard as typeof MobileCard & {
  Header: typeof Header;
  Content: typeof Content;
  Action: typeof Action;
};

MobileCardComponent.Header = Header;
MobileCardComponent.Content = Content;
MobileCardComponent.Action = Action;

export { MobileCardComponent as MobileCard };