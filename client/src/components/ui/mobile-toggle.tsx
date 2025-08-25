import React from 'react';
import { Switch } from '@/components/ui/switch';

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
  

  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        className
      )}
    />
  );
};
