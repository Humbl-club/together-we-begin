import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface ActionSheetAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

interface MobileActionSheetProps {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  actions: ActionSheetAction[];
  children?: React.ReactNode;
  className?: string;
}

export const MobileActionSheet: React.FC<MobileActionSheetProps> = ({
  trigger,
  title,
  description,
  actions,
  children,
  className
}) => {
  const [open, setOpen] = useState(false);
  const feedback = useHapticFeedback();

  const handleActionSelect = (action: ActionSheetAction) => {
    if (action.disabled) return;
    
    feedback.tap();
    action.onSelect();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className={cn(
          "rounded-t-xl border-t-0 p-0 gap-0",
          "safe-area-bottom",
          className
        )}
      >
        <div className="p-6 pb-safe">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </SheetHeader>

          {children && (
            <div className="mb-6">
              {children}
            </div>
          )}

          <div className="space-y-2">
            {actions.map((action) => {
              const IconComponent = action.icon;
              
              return (
                <Button
                  key={action.id}
                  variant={action.destructive ? "destructive" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left h-12 px-4",
                    "touch-manipulation",
                    action.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleActionSelect(action)}
                  disabled={action.disabled}
                >
                  {IconComponent && (
                    <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
                  )}
                  <span className="flex-1">{action.label}</span>
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            className="w-full mt-4 h-12"
            onClick={() => {
              feedback.tap();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};