import React from 'react';
import { cn } from '@/lib/utils';

interface MasonryGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: {
    base: number;
    sm?: number;
    lg?: number;
  };
  gap?: string; // tailwind gap class e.g. 'gap-4'
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  className,
  children,
  columns = { base: 1, sm: 2, lg: 3 },
  gap = 'gap-4',
  ...props
}) => {
  const columnClasses = [
    `columns-${columns.base}`,
    columns.sm ? `sm:columns-${columns.sm}` : '',
    columns.lg ? `lg:columns-${columns.lg}` : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn(columnClasses, gap, 'w-full', className)} {...props}>
      {React.Children.map(children, (child, idx) => (
        <div key={idx} className="mb-4" style={{ breakInside: 'avoid' }}>
          {child}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;
