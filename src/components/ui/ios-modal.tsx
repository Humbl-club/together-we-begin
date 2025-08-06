import React, { memo, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAdvancedMobileOptimization } from '@/hooks/useAdvancedMobileOptimization';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { generateStableKey } from '@/utils/keyGenerators';

interface IOSModalProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  variant?: 'sheet' | 'modal' | 'fullscreen';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const IOSModal = memo(({ 
  children, 
  trigger, 
  title, 
  description,
  variant = 'sheet',
  open,
  onOpenChange
}: IOSModalProps) => {
  const { isMobile } = useAdvancedMobileOptimization();
  const haptic = useHapticFeedback();

  const handleOpenChange = (newOpen: boolean) => {
    if (isMobile && newOpen) {
      haptic.impact('light');
    }
    onOpenChange?.(newOpen);
  };

  // On mobile, always use sheet unless fullscreen
  if (isMobile && variant !== 'fullscreen') {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          {trigger}
        </SheetTrigger>
        <SheetContent 
          side="bottom" 
          className={cn(
            'rounded-t-3xl border-t-0 pb-safe',
            variant === 'sheet' ? 'max-h-[90vh]' : 'h-[95vh]'
          )}
        >
          <div className="mx-auto w-10 h-1 bg-muted rounded-full mb-4" />
          {title && (
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold">{title}</h2>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          )}
          <div className="overflow-y-auto max-h-full">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop or fullscreen modal
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent 
        className={cn(
          'glass-modal border-border/20',
          variant === 'fullscreen' && 'w-full h-full max-w-full max-h-full rounded-none'
        )}
      >
        {title && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold">{title}</h2>
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
});

interface IOSActionSheetProps {
  trigger: React.ReactNode;
  actions: {
    label: string;
    variant?: 'default' | 'destructive' | 'cancel';
    onClick: () => void;
    icon?: React.ReactNode;
  }[];
  title?: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const IOSActionSheet = memo(({ 
  trigger, 
  actions, 
  title, 
  description,
  open,
  onOpenChange
}: IOSActionSheetProps) => {
  const { isMobile } = useAdvancedMobileOptimization();
  const haptic = useHapticFeedback();

  const handleActionClick = (action: typeof actions[0]) => {
    if (isMobile) {
      haptic.impact(action.variant === 'destructive' ? 'medium' : 'light');
    }
    action.onClick();
    onOpenChange?.(false);
  };

  return (
    <IOSModal 
      trigger={trigger} 
      variant="sheet"
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="space-y-4">
        {(title || description) && (
          <div className="text-center px-4 py-2">
            {title && <h3 className="font-medium text-foreground">{title}</h3>}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          {actions.map((action, index) => (
            <button
              key={generateStableKey(action, index)}
              onClick={() => handleActionClick(action)}
              className={cn(
                'w-full flex items-center justify-center gap-3 p-4 rounded-xl',
                'font-medium transition-all duration-200',
                'touch-manipulation active:scale-98',
                action.variant === 'destructive' 
                  ? 'text-destructive hover:bg-destructive/10' 
                  : action.variant === 'cancel'
                  ? 'text-muted-foreground hover:bg-muted/50 font-normal'
                  : 'text-primary hover:bg-primary/10'
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </IOSModal>
  );
});

interface IOSTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const IOSTooltip = memo(({ 
  children, 
  content, 
  side = 'top',
  className 
}: IOSTooltipProps) => {
  const { isMobile } = useAdvancedMobileOptimization();
  const [show, setShow] = useState(false);
  const haptic = useHapticFeedback();

  const handlePress = () => {
    if (isMobile) {
      haptic.impact('light');
      setShow(true);
      setTimeout(() => setShow(false), 2000);
    }
  };

  if (!isMobile) {
    // Use regular tooltip on desktop
    return (
      <div className="relative group">
        {children}
        <div className={cn(
          'absolute z-50 opacity-0 group-hover:opacity-100',
          'transition-opacity duration-200 pointer-events-none',
          'bg-foreground text-background text-xs rounded-lg px-2 py-1',
          'whitespace-nowrap',
          side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2',
          side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
          side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2',
          side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2',
          className
        )}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div onTouchStart={handlePress}>
        {children}
      </div>
      {show && (
        <div className={cn(
          'absolute z-50 bg-foreground text-background text-xs rounded-lg px-3 py-2',
          'animate-fade-in shadow-lg',
          side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2',
          side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
          className
        )}>
          {content}
        </div>
      )}
    </div>
  );
});

IOSModal.displayName = 'IOSModal';
IOSActionSheet.displayName = 'IOSActionSheet';
IOSTooltip.displayName = 'IOSTooltip';