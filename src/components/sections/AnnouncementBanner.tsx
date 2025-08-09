import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface AnnouncementBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string; // used for localStorage persistence
  title?: string;
  message: string | React.ReactNode;
  variant?: 'info' | 'success' | 'warning';
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  id,
  title,
  message,
  variant = 'info',
  className,
  ...props
}) => {
  const storageKey = `announcement:dismissed:${id}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey) === 'true';
    setDismissed(isDismissed);
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  const styles = {
    info: 'bg-card text-card-foreground border-border',
    success: 'bg-secondary text-secondary-foreground border-secondary',
    warning: 'bg-destructive/10 text-destructive-foreground border-destructive/30',
  } as const;

  return (
    <div
      className={cn(
        'w-full rounded-xl border p-3 md:p-4 flex items-start gap-3',
        styles[variant],
        className
      )}
      role="status"
      {...props}
    >
      <div className="flex-1">
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <div className="text-sm leading-relaxed text-foreground">{message}</div>
      </div>
      <button
        type="button"
        className="rounded-md p-1 hover:bg-foreground/5"
        aria-label="Dismiss announcement"
        onClick={handleDismiss}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
