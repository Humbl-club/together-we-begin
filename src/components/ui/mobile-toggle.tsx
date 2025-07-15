import React from 'react';
import { Switch } from '@/components/ui/switch';
import { useViewport } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const MobileToggle: React.FC<MobileToggleProps> = ({
  checked,
  onCheckedChange,
  className = '',
  disabled = false
}) => {
  const { isMobile } = useViewport();

  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        // Mobile: slightly larger for easier touch
        isMobile ? "h-6 w-11 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input" : "",
        // Desktop: standard size
        !isMobile ? "h-5 w-9" : "",
        className
      )}
    />
  );
};