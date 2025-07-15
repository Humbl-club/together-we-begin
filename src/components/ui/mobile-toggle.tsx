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
      className={cn(className)}
    />
  );
};