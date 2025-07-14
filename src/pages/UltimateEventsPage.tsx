import React, { Suspense, memo, useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAdvancedMobileOptimization } from '@/hooks/useAdvancedMobileOptimization';
import { useEnhancedEventService } from '@/services/domain/EnhancedEventService';
import { useProgressiveEnhancement } from '@/hooks/useProgressiveEnhancement';
import { VirtualizedList } from '@/components/advanced/VirtualizedList';
import { EventCardPresentation } from '@/components/presentation/EventCardPresentation';
import { MobileCard } from '@/components/advanced/CompoundMobileCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { eventBus } from '@/core/EventBus';
import { PerformanceMonitorService } from '@/services/core/PerformanceMonitorService';
import { Calendar } from 'lucide-react';

// Ultimate Events Page with enterprise architecture
const UltimateEventsPage = memo(() => {
  const { user } = useAuth();
  const { performanceMetrics, isMobileOptimized } = useAdvancedMobileOptimization();
  const { getEvents, createEvent, registerForEvent } = useEnhancedEventService();
  const { getLoadingStrategy, usePullToRefresh } = useProgressiveEnhancement();
  
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Performance monitoring
  const performanceMonitor = PerformanceMonitorService.getInstance();

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

  // Real-time event updates
  useEffect(() => {
    const unsubscribeCreated = eventBus.on('event:created', () => {
      loadEvents(activeTab);
    });

    const unsubscribeRegistered = eventBus.on('event:registered', () => {
      loadEvents(activeTab);
    });

    return () => {
      unsubscribeCreated();
      unsubscribeRegistered();
    };
  }, [loadEvents, activeTab]);

  // Pull to refresh with performance tracking
  usePullToRefresh(async () => {
    performance.mark('pullToRefresh-start');
    await loadEvents(activeTab);
    performance.mark('pullToRefresh-end');
    performance.measure('pullToRefresh-duration', 'pullToRefresh-start', 'pullToRefresh-end');
  });

  // Initial load and tab changes
  useEffect(() => {
    loadEvents(activeTab);
  }, [loadEvents, activeTab]);

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
    <div className="responsive-container max-w-7xl mx-auto mobile:p-4 sm:p-6 lg:p-8 safe-area-top mobile-content spacing-responsive-lg animate-fade-in" data-pull-refresh>
      {/* Header */}
      <div className="glass-card-enhanced mobile:p-4 sm:p-6 spacing-responsive-sm settings-header">
        <div className="text-center sm:text-left">
          <h1 className="font-display mobile:text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Events
          </h1>
          <p className="text-muted-foreground mobile:text-sm sm:text-base break-words text-balance mt-2">
            Discover and join community events
          </p>
        </div>
      </div>

      {/* Enhanced Tabs with Better Mobile Support */}
      <div className="glass-card-enhanced mobile:p-2 sm:p-3 rounded-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="premium-tabs grid w-full mobile:grid-cols-3 sm:grid-cols-3 mobile:h-auto sm:h-12 mobile:gap-1 sm:gap-2">
            <TabsTrigger 
              value="upcoming" 
              className="premium-tab mobile:min-h-[48px] sm:min-h-[44px] mobile:text-xs sm:text-sm font-medium touch-manipulation focus-ring"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger 
              value="ongoing" 
              className="premium-tab mobile:min-h-[48px] sm:min-h-[44px] mobile:text-xs sm:text-sm font-medium touch-manipulation focus-ring"
            >
              Ongoing
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="premium-tab mobile:min-h-[48px] sm:min-h-[44px] mobile:text-xs sm:text-sm font-medium touch-manipulation focus-ring"
            >
              Past
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mobile:mt-4 sm:mt-6 spacing-responsive-md">
            {loading ? (
              <div className="spacing-responsive-md stagger-children">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-section mobile:h-32 sm:h-40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="glass-card-enhanced mobile:p-6 sm:p-8 text-center">
                <div className="spacing-responsive-sm">
                  <div className="mobile:w-12 mobile:h-12 sm:w-16 sm:h-16 bg-muted rounded-full mx-auto opacity-50 flex items-center justify-center">
                    <Calendar className="mobile:w-6 mobile:h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h3 className="mobile:text-base sm:text-lg font-semibold">No {activeTab} events found</h3>
                    <p className="text-muted-foreground mobile:text-sm sm:text-base">
                      Check back later for new events
                    </p>
                  </div>
                  <Button variant="outline" className="btn-responsive mobile:text-sm sm:text-base">
                    Browse All Events
                  </Button>
                </div>
              </div>
            ) : (
              <div className="spacing-responsive-md">
                <Suspense fallback={
                  <div className="spacing-responsive-md">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="glass-section mobile:h-32 sm:h-40 rounded-xl animate-pulse" />
                    ))}
                  </div>
                }>
                  {/* Mobile-optimized event list without virtualization for better mobile performance */}
                  {isMobileOptimized ? (
                    <div className="spacing-responsive-md stagger-children">
                      {events.slice(0, 10).map((event, index) => (
                        <div key={event.id} className="glass-card-enhanced mobile:p-4 sm:p-6 rounded-xl">
                          <EventCardPresentation
                            event={event}
                            onRegister={handleRegister}
                            onViewDetails={(id) => console.log('View details:', id)}
                            variant="compact"
                          />
                        </div>
                      ))}
                      
                      {events.length > 10 && (
                        <div className="text-center">
                          <Button variant="outline" className="btn-responsive">
                            Load More Events
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <VirtualizedList
                      items={events}
                      renderItem={renderEventCard}
                      itemHeight={200}
                      containerHeight={600}
                      className="spacing-responsive-md"
                    />
                  )}
                </Suspense>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Enhanced Performance Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed mobile:bottom-20 sm:bottom-4 right-4 glass-modal p-3 rounded-lg mobile:text-xs sm:text-sm space-y-1 z-40">
          <div>Mobile: {isMobileOptimized ? 'Yes' : 'No'}</div>
          <div>Cache: Active</div>
          <div>Events: Real-time</div>
        </div>
      )}
    </div>
  );
});

UltimateEventsPage.displayName = 'UltimateEventsPage';

export default UltimateEventsPage;