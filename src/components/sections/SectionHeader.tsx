import React from 'react';
import { cn } from '@/lib/utils';
import { MobileTypography } from '@/components/ui/mobile-typography';

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  className,
  title,
  subtitle,
  actions,
  ...props
}) => {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-3', className)} {...props}>
      <div>
        <MobileTypography variant="h3" weight="semibold" className="font-display">
          {title}
        </MobileTypography>
        {subtitle && (
          <MobileTypography variant="caption" className="text-muted-foreground">
            {subtitle}
          </MobileTypography>
        )}
      </div>
      {actions && (
        <div className="shrink-0 flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
