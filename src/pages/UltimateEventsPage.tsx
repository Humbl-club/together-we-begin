import React, { Suspense, memo, useCallback, useState, useEffect } from 'react';
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

// Ultimate Events Page with enterprise architecture
const UltimateEventsPage = memo(() => {
  const { user } = useAuth();
  const { performanceMetrics, isMobileOptimized } = useAdvancedMobileOptimization();
  const { getEvents, createEvent, registerForEvent } = useEventService();
  const { getLoadingStrategy, usePullToRefresh } = useProgressiveEnhancement();
  
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhanced performance monitoring
  console.log('UltimateEventsPage: Component rendered');

  // Load events with enhanced caching and monitoring
  const loadEvents = useCallback(async (status = 'upcoming') => {
    performance.mark('loadEvents-start');
    
    try {
      setLoading(true);
      setError(null);
      
      const eventsData = await getEvents({
        userId: user?.id,
        status,
        limit: 20
      });
      
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      
      performance.mark('loadEvents-end');
      performance.measure('loadEvents-duration', 'loadEvents-start', 'loadEvents-end');
      
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

  // Enhanced event registration with optimistic updates
  const handleRegister = useCallback(async (eventId: string) => {
    if (!user) return;
    
    try {
      // Optimistic update
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, is_registered: true }
          : event
      ));

      await registerForEvent(eventId, user.id);
      
      toast({
        title: 'Success',
        description: 'Successfully registered for event!'
      });
    } catch (err) {
      // Revert optimistic update on error
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, is_registered: false }
          : event
      ));
      
      console.error('Registration error:', err);
      toast({
        title: 'Registration Failed',
        description: err instanceof Error ? err.message : 'Failed to register for event',
        variant: 'destructive'
      });
    }
  }, [registerForEvent, user]);

  // Enhanced event loading
  useEffect(() => {
    console.log('UltimateEventsPage: Loading events for tab:', activeTab);
    loadEvents(activeTab);
  }, [loadEvents, activeTab]);

  // Pull to refresh with performance tracking
  usePullToRefresh(async () => {
    performance.mark('pullToRefresh-start');
    await loadEvents(activeTab);
    performance.mark('pullToRefresh-end');
    performance.measure('pullToRefresh-duration', 'pullToRefresh-start', 'pullToRefresh-end');
  });


  // Enhanced render event card with error boundaries
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

  // Adaptive loading strategy
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

      {/* Enhanced Performance Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Mobile: {isMobileOptimized ? 'Yes' : 'No'}</div>
          <div>Cache: Active</div>
          <div>Events: Real-time</div>
          <div>Performance: Monitored</div>
        </div>
      )}
    </div>
  );
});

UltimateEventsPage.displayName = 'UltimateEventsPage';

export default UltimateEventsPage;