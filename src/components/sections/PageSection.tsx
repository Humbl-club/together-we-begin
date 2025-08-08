import React from 'react';
import { cn } from '@/lib/utils';

interface PageSectionProps extends React.HTMLAttributes<HTMLElement> {
  surface?: 'none' | 'primary' | 'secondary' | 'accent';
  padded?: boolean;
}

export const PageSection: React.FC<PageSectionProps> = ({
  className,
  children,
  surface = 'none',
  padded = true,
  ...props
}) => {
  const surfaceCls =
    surface === 'primary' ? 'card-primary rounded-2xl' :
    surface === 'secondary' ? 'card-secondary rounded-2xl' :
    surface === 'accent' ? 'card-accent rounded-2xl' : '';

  return (
    <section
      className={cn(
        'w-full',
        padded && 'p-mobile',
        surfaceCls,
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
};

export default PageSection;
