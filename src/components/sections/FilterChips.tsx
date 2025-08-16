import React from 'react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterChipsProps extends React.HTMLAttributes<HTMLDivElement> {
  options: FilterOption[];
  value: string;
  onValueChange: (value: string) => void;
  size?: 'default' | 'compact';
}

export const FilterChips: React.FC<FilterChipsProps> = ({ options, value, onValueChange, size = 'default', className, ...props }) => {
  const haptics = useHapticFeedback();
  const baseBtn = 'rounded-full transition-colors touch-target touch-feedback hover-scale';
  const sizeCls = size === 'compact' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <div className={cn('flex flex-wrap gap-2', className)} {...props}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => { haptics.tap(); onValueChange(opt.value); }}
            className={cn(
              baseBtn,
              sizeCls,
              active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default FilterChips;
