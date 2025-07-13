import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

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
    {
      'h-full': variant === 'default',
      'h-32': variant === 'compact',
      'min-h-[400px] featured-gradient': variant === 'featured'
    },
    className
  ), [variant, className]);

  const statusBadge = useMemo(() => {
    if (event.isToday) return { text: 'Today', className: 'bg-red-500' };
    if (event.isUpcoming) return { text: 'Upcoming', className: 'bg-blue-500' };
    return { text: 'Past', className: 'bg-gray-500' };
  }, [event.isToday, event.isUpcoming]);

  const priceDisplay = useMemo(() => {
    if (event.loyalty_points_price) {
      return `${event.loyalty_points_price} points`;
    }
    if (event.price_cents) {
      return `$${(event.price_cents / 100).toFixed(2)}`;
    }
    return 'Free';
  }, [event.loyalty_points_price, event.price_cents]);

  return (
    <div className={cardClasses}>
      {/* Image Section */}
      {event.image_url && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-2 right-2">
            <span className={cn(
              'px-2 py-1 text-xs rounded-full text-white',
              statusBadge.className
            )}>
              {statusBadge.text}
            </span>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-2">
            {event.title}
          </h3>
          {event.description && variant !== 'compact' && (
            <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
              {event.description}
            </p>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">📅</span>
            <span>{new Date(event.start_time).toLocaleDateString()}</span>
            {event.timeUntilStart && (
              <span className="text-primary">({event.timeUntilStart})</span>
            )}
          </div>

          {event.location && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">📍</span>
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">💰</span>
            <span>{priceDisplay}</span>
          </div>

          {/* Capacity Bar */}
          {event.max_capacity && variant !== 'compact' && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Capacity</span>
                <span>{event.current_capacity}/{event.max_capacity}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${event.capacityPercentage || 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onViewDetails?.(event.id)}
            className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            View Details
          </button>
          
          {!event.is_registered && event.isUpcoming && (
            <button
              onClick={() => onRegister?.(event.id)}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Register
            </button>
          )}
          
          {event.is_registered && (
            <span className="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-md text-center text-sm">
              ✓ Registered
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

EventCardPresentation.displayName = 'EventCardPresentation';

export { EventCardPresentation };