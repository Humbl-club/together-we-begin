import React, { Suspense, memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAdvancedMobileOptimization } from '@/hooks/useAdvancedMobileOptimization';
import { useEventService } from '@/services/domain/EventService';
import { useProgressiveEnhancement } from '@/hooks/useProgressiveEnhancement';
import { VirtualizedList } from '@/components/advanced/VirtualizedList';
import { EventCardPresentation } from '@/components/presentation/EventCardPresentation';
import { MobileCard } from '@/components/advanced/CompoundMobileCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Clean container component with domain service integration
const EventsPage = memo(() => {
  const { user } = useAuth();
  const { performanceMetrics, isMobileOptimized } = useAdvancedMobileOptimization();
  const { getEvents, createEvent, registerForEvent } = useEventService();
  const { getLoadingStrategy, usePullToRefresh } = useProgressiveEnhancement();
  
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load events with error boundary
  const loadEvents = useCallback(async (status = 'upcoming') => {
    try {
      setLoading(true);
      setError(null);
      
      const eventsData = await getEvents({
        userId: user?.id,
        status,
        limit: 20
      });
      
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events');
      toast({
        title: 'Error',
        description: 'Failed to load events. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [getEvents, user?.id]);

  // Handle event registration
  const handleRegister = useCallback(async (eventId: string) => {
    if (!user) return;
    
    try {
      await registerForEvent(eventId, user.id);
      
      // Update local state optimistically
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, is_registered: true }
          : event
      ));
      
      toast({
        title: 'Success',
        description: 'Successfully registered for event!'
      });
    } catch (err) {
      console.error('Registration error:', err);
      toast({
        title: 'Registration Failed',
        description: err instanceof Error ? err.message : 'Failed to register for event',
        variant: 'destructive'
      });
    }
  }, [registerForEvent, user]);

  // Pull to refresh implementation
  usePullToRefresh(async () => {
    await loadEvents(activeTab);
  });

  // Initial load and tab changes
  useEffect(() => {
    loadEvents(activeTab);
  }, [loadEvents, activeTab]);

  // Render event card
  const renderEventCard = useCallback((event: any, index: number) => (
    <MobileCard key={event.id} variant="touch-optimized" className="mb-4">
      <EventCardPresentation
        event={event}
        onRegister={handleRegister}
        onViewDetails={(id) => console.log('View details:', id)}
        variant={isMobileOptimized ? 'compact' : 'default'}
      />
    </MobileCard>
  ), [handleRegister, isMobileOptimized]);

  // Loading state with adaptive strategy
  const loadingStrategy = getLoadingStrategy();
  
  if (loading && loadingStrategy === 'minimal') {
    return (
      <div className="container mx-auto p-4">
        <div className="loading-skeleton h-8 w-48 mb-4" />
        <div className="loading-skeleton h-32 mb-4" />
        <div className="loading-skeleton h-32 mb-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <MobileCard variant="touch-optimized">
          <MobileCard.Content>
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => loadEvents(activeTab)}>
                Try Again
              </Button>
            </div>
          </MobileCard.Content>
        </MobileCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4" data-pull-refresh>
      <MobileCard variant="touch-optimized" className="mb-6">
        <MobileCard.Header>
          <h1 className="text-2xl font-bold">Events</h1>
          <div className="text-sm text-muted-foreground">
            Discover and join community events
          </div>
        </MobileCard.Header>
      </MobileCard>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="completed">Past</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="loading-skeleton h-32" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <MobileCard variant="touch-optimized">
              <MobileCard.Content>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No {activeTab} events found
                  </p>
                  <Button variant="outline">
                    Browse All Events
                  </Button>
                </div>
              </MobileCard.Content>
            </MobileCard>
          ) : (
            <Suspense fallback={<div className="loading-skeleton h-96" />}>
              <VirtualizedList
                items={events}
                renderItem={renderEventCard}
                itemHeight={isMobileOptimized ? 140 : 200}
                containerHeight={600}
                className="space-y-4"
              />
            </Suspense>
          )}
        </TabsContent>
      </Tabs>

      {/* Performance Debug Info (dev mode only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs">
          Mobile: {isMobileOptimized ? 'Yes' : 'No'} | 
          Performance: Active
        </div>
      )}
    </div>
  );
});

EventsPage.displayName = 'EventsPage';

export default EventsPage;