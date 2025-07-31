import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Calendar, Clock } from 'lucide-react';
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { useViewport } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { OptimizedSkeleton } from '@/components/ui/optimized-skeleton';
import { EmptyState } from '@/components/ui/empty-state';

const UpcomingEvents: React.FC = memo(() => {
  const { events, loading } = useUpcomingEvents();
  const { isMobile } = useViewport();
  const haptics = useHapticFeedback();

  const processedEvents = useMemo(() => {
    const now = new Date();
    return events.map(event => {
      const eventTime = new Date(event.start_time);
      const isToday = eventTime.toDateString() === now.toDateString();
      
      return {
        ...event,
        isActive: isToday,
        time: eventTime.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    });
  }, [events]);

  if (loading) {
    return <OptimizedSkeleton variant="card" />;
  }

  if (isMobile) {
    return (
      <Card className="card-primary mx-1 mb-4">
        <CardHeader className="pb-3 p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="editorial-heading text-base">This Week</CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-1">
              {processedEvents.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {processedEvents.length > 0 ? (
            processedEvents.slice(0, 2).map((event) => (
              <div 
                key={event.id}
                onClick={() => haptics.tap()}
                className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 touch-feedback ${
                  event.isActive 
                    ? 'card-accent' 
                    : 'card-secondary hover:card-primary'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  event.isActive ? 'bg-primary/20' : 'bg-muted/50'
                }`}>
                  <Calendar className={`w-4 h-4 ${event.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">{event.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground leading-none">{event.time}</p>
                  </div>
                </div>
                {event.isActive && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                    Today
                  </Badge>
                )}
              </div>
            ))
          ) : (
            <EmptyState
              icon={<Calendar className="w-full h-full" />}
              title="No upcoming events"
              description="Check back soon for exciting new events!"
              className="py-6"
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // Desktop version
  return (
    <Card className="card-secondary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="editorial-heading text-lg">This Week</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-mobile">
        {processedEvents.length > 0 ? (
          processedEvents.map((event) => (
            <div 
              key={event.id}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                event.isActive 
                  ? 'card-accent' 
                  : 'hover:card-secondary'
              }`}
            >
              <div className={`w-2 h-8 rounded-full ${
                event.isActive ? 'bg-primary' : 'bg-muted'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.time}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No upcoming events</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default UpcomingEvents;