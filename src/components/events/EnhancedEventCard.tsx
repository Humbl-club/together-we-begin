import React, { memo, useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  Share2, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock,
  Star,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

interface EnhancedEventCardProps {
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
    organizer?: {
      name: string;
      avatar?: string;
      rating?: number;
    };
    attendees?: Array<{
      id: string;
      name: string;
      avatar?: string;
    }>;
    categories?: string[];
    isSaved?: boolean;
    reviews_count?: number;
    average_rating?: number;
  };
  onRegister?: (eventId: string) => void;
  onViewDetails?: (eventId: string) => void;
  onSave?: (eventId: string, saved: boolean) => void;
  onShare?: (eventId: string) => void;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export const EnhancedEventCard = memo(({
  event,
  onRegister,
  onViewDetails,
  onSave,
  onShare,
  variant = 'default',
  className
}: EnhancedEventCardProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const cardClasses = useMemo(() => cn(
    'glass-card-enhanced overflow-hidden transition-all duration-300 group',
    'hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
    'mobile:rounded-lg sm:rounded-xl',
    {
      'h-full': variant === 'default',
      'mobile:h-auto sm:h-40 mobile:min-h-[320px] flex mobile:flex-col sm:flex-row': variant === 'compact',
      'min-h-[450px] featured-gradient border-2 border-primary/20': variant === 'featured'
    },
    className
  ), [variant, className]);

  const statusBadge = useMemo(() => {
    if (event.isToday) return { text: 'Today', className: 'bg-red-500 text-white' };
    if (event.isUpcoming) return { text: 'Upcoming', className: 'bg-blue-500 text-white' };
    return { text: 'Past', className: 'bg-gray-500 text-white' };
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

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      await onSave?.(event.id, !event.isSaved);
      toast({
        title: event.isSaved ? 'Event removed from saved' : 'Event saved!',
        description: event.isSaved ? 'Event removed from your saved list' : 'You can find it in your saved events',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update saved status',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [event.id, event.isSaved, isSaving, onSave]);

  const handleShare = useCallback(async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.origin + `/events/${event.id}`
        });
      } else {
        await navigator.clipboard.writeText(window.location.origin + `/events/${event.id}`);
        toast({
          title: 'Link copied!',
          description: 'Event link copied to clipboard',
        });
      }
      onShare?.(event.id);
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  }, [event.id, event.title, event.description, isSharing, onShare]);

  const attendeePreview = useMemo(() => {
    if (!event.attendees?.length) return null;
    const visibleAttendees = event.attendees.slice(0, 3);
    const remainingCount = Math.max(0, event.attendees.length - 3);
    
    return (
      <div className="flex items-center gap-1">
        <div className="flex -space-x-2">
          {visibleAttendees.map((attendee, index) => (
            <Avatar key={attendee.id} className="w-6 h-6 border-2 border-background">
              <AvatarImage src={attendee.avatar} alt={attendee.name} />
              <AvatarFallback className="text-xs">
                {attendee.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        {remainingCount > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            +{remainingCount} more
          </span>
        )}
      </div>
    );
  }, [event.attendees]);

  return (
    <div className={cardClasses} onClick={() => onViewDetails?.(event.id)}>
      {/* Image Section */}
      <div className={cn(
        'relative overflow-hidden',
        variant === 'compact' 
          ? 'mobile:h-48 sm:w-48 sm:h-full' 
          : 'mobile:h-48 sm:h-56'
      )}>
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-primary/40" />
          </div>
        )}

        {/* Overlay Actions */}
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge className={cn('text-xs', statusBadge.className)}>
            {statusBadge.text}
          </Badge>
        </div>

        <div className="absolute top-2 left-2 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            disabled={isSaving}
            className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            <Heart 
              className={cn(
                'h-4 w-4 transition-colors',
                event.isSaved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
              )} 
            />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            disabled={isSharing}
            className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Category Tags */}
        {event.categories && event.categories.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {event.categories.slice(0, 2).map((category) => (
              <Badge key={category} variant="secondary" className="text-xs bg-background/80 backdrop-blur-sm">
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={cn(
        'mobile:p-4 sm:p-5 flex-1',
        variant === 'compact' ? 'mobile:space-y-2 sm:space-y-3' : 'mobile:space-y-3 sm:space-y-4'
      )}>
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={cn(
              'font-semibold line-clamp-2 group-hover:text-primary transition-colors',
              variant === 'compact' ? 'mobile:text-base sm:text-lg' : 'mobile:text-lg sm:text-xl'
            )}>
              {event.title}
            </h3>
            {event.average_rating && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{event.average_rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {event.description && variant !== 'compact' && (
            <p className="text-muted-foreground mobile:text-sm sm:text-base line-clamp-2">
              {event.description}
            </p>
          )}
        </div>

        {/* Organizer Info */}
        {event.organizer && (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={event.organizer.avatar} alt={event.organizer.name} />
              <AvatarFallback className="text-xs">
                {event.organizer.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">by {event.organizer.name}</span>
            {event.organizer.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">{event.organizer.rating}</span>
              </div>
            )}
          </div>
        )}

        {/* Event Details */}
        <div className={cn(
          'space-y-2',
          variant === 'compact' ? 'mobile:text-xs sm:text-sm' : 'mobile:text-sm sm:text-base'
        )}>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>{new Date(event.start_time).toLocaleDateString()}</span>
            {event.timeUntilStart && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {event.timeUntilStart}
              </Badge>
            )}
          </div>

          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-primary">{priceDisplay}</span>
          </div>
        </div>

        {/* Capacity & Social Proof */}
        {(event.max_capacity || attendeePreview) && variant !== 'compact' && (
          <div className="space-y-2">
            {event.max_capacity && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Capacity</span>
                  <span>{event.current_capacity}/{event.max_capacity}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      event.capacityPercentage && event.capacityPercentage > 80 
                        ? 'bg-red-500' 
                        : event.capacityPercentage && event.capacityPercentage > 60 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    )}
                    style={{ width: `${event.capacityPercentage || 0}%` }}
                  />
                </div>
              </div>
            )}

            {attendeePreview && (
              <div className="flex items-center justify-between">
                {attendeePreview}
                {event.reviews_count && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="w-3 h-3" />
                    {event.reviews_count} reviews
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(event.id);
            }}
            className={cn(
              'flex-1 glass-button',
              variant === 'compact' ? 'mobile:text-xs sm:text-sm h-8' : 'mobile:text-sm sm:text-base h-10'
            )}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Details
          </Button>
          
          {!event.is_registered && event.isUpcoming && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRegister?.(event.id);
              }}
              className={cn(
                'flex-1',
                variant === 'compact' ? 'mobile:text-xs sm:text-sm h-8' : 'mobile:text-sm sm:text-base h-10'
              )}
            >
              <Users className="w-4 h-4 mr-2" />
              Register
            </Button>
          )}
          
          {event.is_registered && (
            <div className={cn(
              'flex-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md flex items-center justify-center font-medium',
              variant === 'compact' ? 'mobile:text-xs sm:text-sm h-8' : 'mobile:text-sm sm:text-base h-10'
            )}>
              ✓ Registered
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

EnhancedEventCard.displayName = 'EnhancedEventCard';