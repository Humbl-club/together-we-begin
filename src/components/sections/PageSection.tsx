import React from 'react';
import { cn } from '@/lib/utils';

interface PageSectionProps extends React.HTMLAttributes<HTMLElement> {
  surface?: 'none' | 'primary' | 'secondary' | 'accent' | 'hero';
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
    surface === 'accent' ? 'card-accent rounded-2xl' :
    surface === 'hero' ? 'bg-atelier-hero rounded-2xl' : '';

  return (
    <section
      className={cn(
        'w-full',
        padded && 'p-4 md:p-6',
        surfaceCls,
        'motion-safe:animate-fade-in',
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
};

export default PageSection;
