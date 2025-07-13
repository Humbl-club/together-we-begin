import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { OptimizedSkeleton } from '@/components/ui/optimized-skeleton';

const UpcomingEvents: React.FC = memo(() => {
  const { events, loading } = useUpcomingEvents();

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

  return (
    <Card className="border-0 bg-card/40 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">This Week</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {processedEvents.length > 0 ? (
          processedEvents.map((event) => (
            <div 
              key={event.id}
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                event.isActive 
                  ? 'bg-gradient-to-r from-primary/5 to-transparent' 
                  : ''
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
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No upcoming events</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default UpcomingEvents;