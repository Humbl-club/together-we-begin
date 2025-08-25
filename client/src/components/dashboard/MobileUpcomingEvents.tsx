import React, { memo } from 'react';
import { generateStableKey } from '@/utils/keyGenerators';
import { MobileFirstCard, MobileFirstCardContent, MobileFirstCardHeader, MobileFirstCardTitle } from '@/components/ui/mobile-first-card';
import { MobileNativeButton } from '@/components/ui/mobile-native-button';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useAuth } from '@/components/auth/AuthProvider';
import { Calendar, MapPin, Users, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time?: string;
  location?: string;
  current_capacity?: number;
  max_capacity?: number;
  status: string;
  featured?: boolean;
}

interface MobileUpcomingEventsProps {
  events?: Event[];
}

const MobileUpcomingEvents: React.FC<MobileUpcomingEventsProps> = memo(({ events }) => {
  const { isMobile, safeAreaInsets } = useMobileFirst();
  const { isAdmin } = useAuth();
  const feedback = useHapticFeedback();

  const displayEvents = events || [];

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const handleEventTap = (event: Event) => {
    feedback.tap();
    console.log('Event tapped:', event.title);
  };

  const handleViewAll = () => {
    feedback.tap();
    console.log('View all events');
  };

  if (!isMobile) {
    // Return desktop version for non-mobile
    return (
      <MobileFirstCard variant="default" className="w-full">
        <MobileFirstCardHeader>
          <MobileFirstCardTitle>Upcoming Events</MobileFirstCardTitle>
        </MobileFirstCardHeader>
        <MobileFirstCardContent>
          <div className="space-y-3">
            {displayEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <p className="text-xs text-muted-foreground">{formatEventDate(event.start_time)} • {formatEventTime(event.start_time)}</p>
                </div>
                <Badge variant="outline" className="text-xs">{event.current_capacity || 0}</Badge>
              </div>
            ))}
          </div>
        </MobileFirstCardContent>
      </MobileFirstCard>
    );
  }

  return (
    <div 
      className="space-y-4"
      style={{
        paddingLeft: `max(0px, ${safeAreaInsets.left}px)`,
        paddingRight: `max(0px, ${safeAreaInsets.right}px)`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold text-foreground">What's Coming Up</h2>
        <MobileNativeButton
          variant="ghost"
          size="sm"
          onClick={handleViewAll}
          className="text-primary"
        >
          View All
          <ExternalLink className="h-4 w-4 ml-1" />
        </MobileNativeButton>
      </div>

      {/* Events List */}
      <div className="space-y-3 px-4">
        {displayEvents.map((event, index) => (
          <MobileFirstCard
            key={generateStableKey(event, index)}
            variant={event.featured ? "premium" : "elevated"}
            interactive
            padding="md"
            className={cn(
              "transform-gpu touch-manipulation transition-all duration-200",
              "active:scale-[0.98] active:shadow-sm",
              event.featured && "ring-1 ring-primary/20"
            )}
            onClick={() => handleEventTap(event)}
          >
            <MobileFirstCardContent>
              <div className="space-y-3">
                {/* Event Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-foreground truncate">
                      {event.title}
                    </h3>
                    {event.featured && (
                      <Badge className="mt-1 text-xs bg-primary/10 text-primary">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <Badge 
                    className="text-xs ml-2 flex-shrink-0"
                    variant="secondary"
                  >
                    Event
                  </Badge>
                </div>

                {/* Event Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{formatEventDate(event.start_time)}</span>
                    <Clock className="h-4 w-4 flex-shrink-0 ml-2" />
                    <span>{formatEventTime(event.start_time)}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {event.current_capacity || 0} going
                      {event.max_capacity && ` • ${event.max_capacity - (event.current_capacity || 0)} spots left`}
                    </span>
                  </div>
                </div>

                {/* Attendance Progress */}
                {event.max_capacity && (
                  <div className="space-y-1">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${((event.current_capacity || 0) / event.max_capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </MobileFirstCardContent>
          </MobileFirstCard>
        ))}
      </div>

      {isAdmin && (
        <div className="px-4">
          <MobileNativeButton
            variant="secondary"
            fullWidth
            size="lg"
            onClick={() => {
              feedback.tap();
              console.log('Create event');
            }}
            className="text-primary border-primary/20 hover:bg-primary/5"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Create Event
          </MobileNativeButton>
        </div>
      )}
    </div>
  );
});

MobileUpcomingEvents.displayName = 'MobileUpcomingEvents';

export default MobileUpcomingEvents;