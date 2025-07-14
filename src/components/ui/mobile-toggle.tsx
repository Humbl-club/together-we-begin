import React from 'react';
import { Switch } from '@/components/ui/switch';
import { useViewport } from '@/hooks/use-mobile';

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

  if (isMobile) {
    return (
      <button
        onClick={() => !disabled && onCheckedChange(!checked)}
        disabled={disabled}
        className={`mobile-toggle ${className}`}
        data-state={checked ? 'checked' : 'unchecked'}
        role="switch"
        aria-checked={checked}
        type="button"
      >
        <div className="mobile-toggle-thumb" />
      </button>
    );
  }

  // Use regular Switch for desktop
  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={className}
    />
  );
};