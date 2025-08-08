import React from 'react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterChipsProps extends React.HTMLAttributes<HTMLDivElement> {
  options: FilterOption[];
  value: string;
  onValueChange: (value: string) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ options, value, onValueChange, className, ...props }) => {
  return (
    <div className={cn('flex flex-wrap gap-2', className)} {...props}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onValueChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm transition-colors touch-target',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
