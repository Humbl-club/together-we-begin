import React, { Suspense, memo, useCallback, useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAdvancedMobileOptimization } from '@/hooks/useAdvancedMobileOptimization';
import { useEnhancedEventService } from '@/services/domain/EnhancedEventService';
import { useProgressiveEnhancement } from '@/hooks/useProgressiveEnhancement';
import { VirtualizedList } from '@/components/advanced/VirtualizedList';
import { EventCardPresentation } from '@/components/presentation/EventCardPresentation';
import { EnhancedEventCard } from '@/components/events/EnhancedEventCard';
import { EventSearch } from '@/components/events/EventSearch';
import { MobileCard } from '@/components/advanced/CompoundMobileCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { eventBus } from '@/core/EventBus';
import { PerformanceMonitorService } from '@/services/core/PerformanceMonitorService';
import { Calendar, Plus, Grid3X3, List, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [savedEvents, setSavedEvents] = useState<Set<string>>(new Set());

  // Performance monitoring
  const performanceMonitor = PerformanceMonitorService.getInstance();

  // Load events with enhanced caching and monitoring
  const loadEvents = useCallback(async (status = 'upcoming') => {
    performance.mark('loadEvents-start');
    console.log(`🔄 Loading events with status: ${status}, user: ${user?.id}`);
    
    try {
      setLoading(true);
      setError(null);
      
      const eventsData = await getEvents({
        userId: user?.id,
        status,
        limit: 20
      });
      
      console.log(`✅ Loaded ${Array.isArray(eventsData) ? eventsData.length : 0} events:`, eventsData);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      
      performance.mark('loadEvents-end');
      performance.measure('loadEvents-duration', 'loadEvents-start', 'loadEvents-end');
      
    } catch (err) {
      console.error('❌ Error loading events:', err);
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

  // Save/Unsave event functionality
  const handleSaveEvent = useCallback(async (eventId: string, saved: boolean) => {
    // Update local state immediately for better UX
    setSavedEvents(prev => {
      const newSet = new Set(prev);
      if (saved) {
        newSet.add(eventId);
      } else {
        newSet.delete(eventId);
      }
      return newSet;
    });

    // TODO: Implement API call to save/unsave event
    // This would typically involve a database call to store user preferences
  }, []);

  // Share event functionality
  const handleShareEvent = useCallback(async (eventId: string) => {
    // Analytics tracking could be added here
    console.log('Event shared:', eventId);
  }, []);

  // Filtered and sorted events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }

    // Apply category filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(event => {
        if (activeFilters.includes('free') && !event.price_cents && !event.loyalty_points_price) return true;
        if (activeFilters.includes('paid') && (event.price_cents || event.loyalty_points_price)) return true;
        if (activeFilters.includes('today') && event.isToday) return true;
        if (activeFilters.includes('this-week')) {
          const eventDate = new Date(event.start_time);
          const weekFromNow = new Date();
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return eventDate <= weekFromNow;
        }
        if (activeFilters.includes('available')) {
          return !event.max_capacity || event.current_capacity < event.max_capacity;
        }
        return false;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        case 'price':
          const priceA = a.price_cents || a.loyalty_points_price || 0;
          const priceB = b.price_cents || b.loyalty_points_price || 0;
          return priceA - priceB;
        case 'popularity':
          return (b.current_capacity || 0) - (a.current_capacity || 0);
        default:
          return 0;
      }
    });

    // Add saved status to events
    return filtered.map(event => ({
      ...event,
      isSaved: savedEvents.has(event.id)
    }));
  }, [events, searchQuery, activeFilters, sortBy, savedEvents]);

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
    <div key={event.id} className={cn(
      'transition-all duration-200',
      viewMode === 'grid' ? 'mb-4' : 'mb-3'
    )}>
      <EnhancedEventCard
        event={event}
        onRegister={handleRegister}
        onViewDetails={(id) => console.log('View details:', id)}
        onSave={handleSaveEvent}
        onShare={handleShareEvent}
        variant={viewMode === 'list' || isMobileOptimized ? 'compact' : 'default'}
      />
    </div>
  ), [handleRegister, handleSaveEvent, handleShareEvent, isMobileOptimized, viewMode]);

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
    <div className="min-h-screen bg-background mobile:p-2 sm:p-4 lg:p-6 safe-area-top" data-pull-refresh>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="glass-card-enhanced mobile:p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col mobile:gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-display mobile:text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                Events
              </h1>
              <p className="text-muted-foreground mobile:text-sm sm:text-base lg:text-lg">
                Discover and join community events
              </p>
            </div>
            
            {/* Create Event Button - Admin/Organizer only */}
            <Button className="glass-button mobile:w-full lg:w-auto mobile:h-10 sm:h-11 lg:h-12 mobile:px-4 sm:px-6">
              <Plus className="mobile:w-4 mobile:h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="mobile:text-sm sm:text-base">Create Event</span>
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="glass-card-enhanced mobile:p-3 sm:p-4 lg:p-6">
          <EventSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {/* Enhanced Tabs with Better Mobile Support */}
        <div className="glass-card-enhanced mobile:p-3 sm:p-4 lg:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex mobile:flex-col sm:flex-row mobile:gap-3 sm:items-center sm:justify-between mb-4">
              <TabsList className="grid w-full grid-cols-3 mobile:h-12 sm:h-10 gap-1">
                <TabsTrigger 
                  value="upcoming" 
                  className="mobile:text-sm sm:text-base font-medium touch-manipulation"
                >
                  Upcoming
                </TabsTrigger>
                <TabsTrigger 
                  value="ongoing" 
                  className="mobile:text-sm sm:text-base font-medium touch-manipulation"
                >
                  Ongoing
                </TabsTrigger>
                <TabsTrigger 
                  value="completed" 
                  className="mobile:text-sm sm:text-base font-medium touch-manipulation"
                >
                  Past
                </TabsTrigger>
              </TabsList>

              {/* View Mode Toggle - Hidden on mobile */}
              {!isMobileOptimized && (
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value="upcoming" className="mobile:mt-4 sm:mt-6">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: isMobileOptimized ? 2 : 3 }).map((_, i) => (
                    <div key={i} className="glass-card mobile:h-32 sm:h-40 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="glass-card-enhanced mobile:p-6 sm:p-8 text-center">
                  <div className="space-y-4">
                    <div className="mobile:w-12 mobile:h-12 sm:w-16 sm:h-16 bg-muted rounded-full mx-auto opacity-50 flex items-center justify-center">
                      <Calendar className="mobile:w-6 mobile:h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <h3 className="mobile:text-base sm:text-lg font-semibold">
                        {searchQuery || activeFilters.length > 0 
                          ? 'No events match your search' 
                          : `No ${activeTab} events found`}
                      </h3>
                      <p className="text-muted-foreground mobile:text-sm sm:text-base">
                        {searchQuery || activeFilters.length > 0
                          ? 'Try adjusting your search or filters'
                          : 'Check back later for new events'}
                      </p>
                    </div>
                    <Button variant="outline" className="mobile:text-sm sm:text-base">
                      Browse All Events
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mobile:space-y-3 sm:space-y-4">
                  {/* Mobile-first event list */}
                  {isMobileOptimized ? (
                    <div className="space-y-3">
                      {filteredEvents.slice(0, 10).map((event, index) => renderEventCard(event, index))}
                      
                      {filteredEvents.length > 10 && (
                        <div className="text-center pt-4">
                          <Button variant="outline" className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Load More Events ({filteredEvents.length - 10} remaining)
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={cn(
                      'grid gap-4',
                      viewMode === 'grid' ? 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                    )}>
                      {filteredEvents.slice(0, 12).map((event, index) => renderEventCard(event, index))}
                      
                      {filteredEvents.length > 12 && (
                        <div className="col-span-full text-center pt-4">
                          <Button variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Load More Events ({filteredEvents.length - 12} remaining)
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="ongoing" className="mobile:mt-4 sm:mt-6">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: isMobileOptimized ? 2 : 3 }).map((_, i) => (
                    <div key={i} className="glass-card mobile:h-32 sm:h-40 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="glass-card-enhanced mobile:p-6 sm:p-8 text-center">
                  <div className="space-y-4">
                    <div className="mobile:w-12 mobile:h-12 sm:w-16 sm:h-16 bg-muted rounded-full mx-auto opacity-50 flex items-center justify-center">
                      <Calendar className="mobile:w-6 mobile:h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <h3 className="mobile:text-base sm:text-lg font-semibold">No ongoing events</h3>
                      <p className="text-muted-foreground mobile:text-sm sm:text-base">
                        Check back later for ongoing events
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mobile:space-y-3 sm:space-y-4">
                  {/* Mobile-first event list */}
                  {isMobileOptimized ? (
                    <div className="space-y-3">
                      {filteredEvents.slice(0, 10).map((event, index) => renderEventCard(event, index))}
                    </div>
                  ) : (
                    <div className={cn(
                      'grid gap-4',
                      viewMode === 'grid' ? 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                    )}>
                      {filteredEvents.slice(0, 12).map((event, index) => renderEventCard(event, index))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mobile:mt-4 sm:mt-6">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: isMobileOptimized ? 2 : 3 }).map((_, i) => (
                    <div key={i} className="glass-card mobile:h-32 sm:h-40 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="glass-card-enhanced mobile:p-6 sm:p-8 text-center">
                  <div className="space-y-4">
                    <div className="mobile:w-12 mobile:h-12 sm:w-16 sm:h-16 bg-muted rounded-full mx-auto opacity-50 flex items-center justify-center">
                      <Calendar className="mobile:w-6 mobile:h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <h3 className="mobile:text-base sm:text-lg font-semibold">No past events</h3>
                      <p className="text-muted-foreground mobile:text-sm sm:text-base">
                        Past events will appear here once they're completed
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mobile:space-y-3 sm:space-y-4">
                  {/* Mobile-first event list */}
                  {isMobileOptimized ? (
                    <div className="space-y-3">
                      {filteredEvents.slice(0, 10).map((event, index) => renderEventCard(event, index))}
                    </div>
                  ) : (
                    <div className={cn(
                      'grid gap-4',
                      viewMode === 'grid' ? 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                    )}>
                      {filteredEvents.slice(0, 12).map((event, index) => renderEventCard(event, index))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Enhanced Performance Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed mobile:bottom-4 sm:bottom-6 right-4 glass-modal p-2 rounded-lg mobile:text-xs sm:text-sm space-y-1 z-40 max-w-32">
          <div>Mobile: {isMobileOptimized ? '✓' : '✗'}</div>
          <div>View: {viewMode}</div>
          <div>Events: {filteredEvents.length}/{events.length}</div>
        </div>
      )}
    </div>
  );
});

UltimateEventsPage.displayName = 'UltimateEventsPage';

export default UltimateEventsPage;