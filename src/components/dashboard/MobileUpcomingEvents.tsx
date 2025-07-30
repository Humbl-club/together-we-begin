import React, { memo } from 'react';
import { MobileFirstCard, MobileFirstCardContent, MobileFirstCardHeader, MobileFirstCardTitle } from '@/components/ui/mobile-first-card';
import { MobileNativeButton } from '@/components/ui/mobile-native-button';
import { useMobileFirst } from '@/hooks/useMobileFirst';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Calendar, MapPin, Users, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees?: number;
  category: 'wellness' | 'social' | 'learning' | 'networking';
  featured?: boolean;
}

interface MobileUpcomingEventsProps {
  events?: Event[];
}

const MobileUpcomingEvents: React.FC<MobileUpcomingEventsProps> = memo(({ events }) => {
  const { isMobile, safeAreaInsets } = useMobileFirst();
  const feedback = useHapticFeedback();

  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Morning Mindfulness & Coffee',
      date: 'Today',
      time: '9:00 AM',
      location: 'Central Park',
      attendees: 12,
      maxAttendees: 15,
      category: 'wellness',
      featured: true
    },
    {
      id: '2',
      title: 'Women in Tech Networking',
      date: 'Tomorrow',
      time: '6:30 PM',
      location: 'WeWork SoHo',
      attendees: 28,
      maxAttendees: 40,
      category: 'networking'
    },
    {
      id: '3',
      title: 'Book Club: "Atomic Habits"',
      date: 'Sat, Mar 16',
      time: '2:00 PM',
      location: 'Cozy Corner Café',
      attendees: 8,
      maxAttendees: 12,
      category: 'learning'
    }
  ];

  const displayEvents = events || mockEvents;

  const getCategoryColor = (category: Event['category']) => {
    const colors = {
      wellness: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      social: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      learning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      networking: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    };
    return colors[category];
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
                  <p className="text-xs text-muted-foreground">{event.date} • {event.time}</p>
                </div>
                <Badge variant="outline" className="text-xs">{event.attendees}</Badge>
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
            key={event.id}
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
                    className={cn("text-xs ml-2 flex-shrink-0", getCategoryColor(event.category))}
                    variant="secondary"
                  >
                    {event.category}
                  </Badge>
                </div>

                {/* Event Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{event.date}</span>
                    <Clock className="h-4 w-4 flex-shrink-0 ml-2" />
                    <span>{event.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {event.attendees} going
                      {event.maxAttendees && ` • ${event.maxAttendees - event.attendees} spots left`}
                    </span>
                  </div>
                </div>

                {/* Attendance Progress */}
                {event.maxAttendees && (
                  <div className="space-y-1">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </MobileFirstCardContent>
          </MobileFirstCard>
        ))}
      </div>

      {/* Quick Action */}
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
          Create Your Own Event
        </MobileNativeButton>
      </div>
    </div>
  );
});

MobileUpcomingEvents.displayName = 'MobileUpcomingEvents';

export default MobileUpcomingEvents;