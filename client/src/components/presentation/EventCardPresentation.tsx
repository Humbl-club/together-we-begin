import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMobileFirst';
import { SafeAreaBottom } from '@/components/ui/safe-area-layout';

// Pure presentational component with zero business logic
interface EventCardPresentationProps {
  event: {
    id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time?: string;
    location?: string;
    image_url?: string;
    price_cents?: number;
    loyalty_points_price?: number;
    max_capacity?: number;
    current_capacity?: number;
    is_registered?: boolean;
    isUpcoming?: boolean;
    isToday?: boolean;
    timeUntilStart?: string;
    capacityPercentage?: number;
  };
  onRegister?: (eventId: string) => void;
  onViewDetails?: (eventId: string) => void;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

const EventCardPresentation = memo(({
  event,
  onRegister,
  onViewDetails,
  variant = 'default',
  className
}: EventCardPresentationProps) => {
  const cardClasses = useMemo(() => cn(
    'glass-card overflow-hidden transition-all duration-200',
    'hover:scale-[1.02] active:scale-[0.98]',
    'mobile:rounded-lg sm:rounded-xl',
    {
      'h-full': variant === 'default',
      'mobile:h-auto sm:h-32 mobile:min-h-[280px]': variant === 'compact',
      'min-h-[400px] featured-gradient': variant === 'featured'
    },
    className
  ), [variant, className]);

  const statusBadge = useMemo(() => {
    if (event.isToday) return { text: 'Today', className: 'bg-destructive text-destructive-foreground' };
    if (event.isUpcoming) return { text: 'Upcoming', className: 'bg-primary text-primary-foreground' };
    return { text: 'Past', className: 'bg-muted text-muted-foreground' };
  }, [event.isToday, event.isUpcoming]);

  const priceDisplay = useMemo(() => {
    if (event.loyalty_points_price) {
      return `${event.loyalty_points_price} points`;
    }
    if (event.price_cents) {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(event.price_cents / 100);
    }
    return 'Free';
  }, [event.loyalty_points_price, event.price_cents]);

  const isMobile = useIsMobile();
  return (
    <div className={cardClasses}>
      {/* Image Section */}
      {event.image_url && (
        <div className="relative mobile:h-40 sm:h-48 overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute mobile:top-1 mobile:right-1 sm:top-2 sm:right-2">
            <span className={cn(
              'mobile:px-1.5 mobile:py-0.5 sm:px-2 sm:py-1 mobile:text-xs sm:text-xs rounded-full text-white font-medium',
              statusBadge.className
            )}>
              {statusBadge.text}
            </span>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="mobile:p-3 sm:p-4 mobile:space-y-2 sm:space-y-3">
        <div>
          <h3 className="font-semibold mobile:text-base sm:text-lg line-clamp-2">
            {event.title}
          </h3>
          {event.description && variant !== 'compact' && (
            <p className="text-muted-foreground mobile:text-xs sm:text-sm line-clamp-2 mt-1">
              {event.description}
            </p>
          )}
        </div>

        {/* Event Details */}
        <div className="mobile:space-y-1.5 sm:space-y-2 mobile:text-xs sm:text-sm">
          <div className="flex items-center mobile:gap-1.5 sm:gap-2">
            <span className="text-muted-foreground mobile:text-sm sm:text-base">📅</span>
            <span className="mobile:text-xs sm:text-sm">
              {new Date(event.start_time).toLocaleDateString()}
            </span>
            {event.timeUntilStart && (
              <span className="text-primary mobile:text-xs sm:text-sm">({event.timeUntilStart})</span>
            )}
          </div>

          {event.location && (
            <div className="flex items-center mobile:gap-1.5 sm:gap-2">
              <span className="text-muted-foreground mobile:text-sm sm:text-base">📍</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="line-clamp-1 mobile:text-xs sm:text-sm text-primary hover:underline"
                aria-label="Open location in Google Maps"
              >
                {event.location}
              </a>
            </div>
          )}

          <div className="flex items-center mobile:gap-1.5 sm:gap-2">
            <span className="text-muted-foreground mobile:text-sm sm:text-base">💰</span>
            <span className="mobile:text-xs sm:text-sm font-medium">{priceDisplay}</span>
          </div>

          {/* Capacity Bar */}
          {event.max_capacity && variant !== 'compact' && (
            <div className="mobile:space-y-0.5 sm:space-y-1">
              <div className="flex justify-between mobile:text-xs sm:text-xs">
                <span>Capacity</span>
                <span>{event.current_capacity}/{event.max_capacity}</span>
              </div>
              <div className="w-full bg-muted rounded-full mobile:h-1.5 sm:h-2">
                <div
                  className="bg-primary mobile:h-1.5 sm:h-2 rounded-full transition-all duration-300"
                  style={{ width: `${event.capacityPercentage || 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex mobile:gap-1.5 sm:gap-2 mobile:pt-1.5 sm:pt-2">
          <button
            onClick={() => onViewDetails?.(event.id)}
            className="flex-1 mobile:px-3 mobile:py-2 sm:px-4 sm:py-2 border border-border rounded-md hover:bg-muted transition-colors mobile:text-xs sm:text-sm font-medium touch-manipulation"
          >
            View Details
          </button>
          
          {!event.is_registered && event.isUpcoming && (
            <button
              onClick={() => onRegister?.(event.id)}
              className="flex-1 mobile:px-3 mobile:py-2 sm:px-4 sm:py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors mobile:text-xs sm:text-sm font-medium touch-manipulation"
            >
              Register
            </button>
          )}
          
          {event.is_registered && (
            <span className="flex-1 mobile:px-3 mobile:py-2 sm:px-4 sm:py-2 bg-green-100 text-green-800 rounded-md text-center mobile:text-xs sm:text-sm font-medium">
              ✓ Registered
            </span>
          )}
        </div>
      </div>

      {isMobile && !event.is_registered && event.isUpcoming && (
        <div data-testid="mobile-sticky-cta" className="sticky bottom-0 inset-x-0 z-10">
          <SafeAreaBottom className="bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-t border-border px-3 py-2">
            <button
              onClick={() => onRegister?.(event.id)}
              className="w-full mobile:px-4 mobile:py-3 sm:px-4 sm:py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium touch-manipulation"
              data-testid="mobile-register-button"
            >
              Register
            </button>
          </SafeAreaBottom>
        </div>
      )}
    </div>
  );
});

EventCardPresentation.displayName = 'EventCardPresentation';

export { EventCardPresentation };