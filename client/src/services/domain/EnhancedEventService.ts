import { EventRepository } from '@/services/repositories/EventRepository';
import { AdvancedCacheService } from '@/services/core/AdvancedCacheService';
import { PerformanceMonitorService } from '@/services/core/PerformanceMonitorService';
import { eventBus } from '@/core/EventBus';
import { container } from '@/core/Container';
import { useCallback, useMemo } from 'react';
import { useConcurrentFeatures } from '@/hooks/useConcurrentFeatures';

// Enhanced Event Service with enterprise patterns
export class EnhancedEventService {
  private static instance: EnhancedEventService;
  private repository: EventRepository;
  private cache: AdvancedCacheService;
  private performance: PerformanceMonitorService;

  private constructor() {
    this.repository = EventRepository.getInstance();
    this.cache = AdvancedCacheService.getInstance();
    this.performance = PerformanceMonitorService.getInstance();
    this.setupEventListeners();
  }

  static getInstance(): EnhancedEventService {
    if (!EnhancedEventService.instance) {
      EnhancedEventService.instance = new EnhancedEventService();
    }
    return EnhancedEventService.instance;
  }

  private setupEventListeners(): void {
    // Listen for cache invalidation events
    eventBus.on('event:created', () => {
      this.cache.invalidate('events');
    });

    eventBus.on('event:updated', () => {
      this.cache.invalidate('events');
    });

    eventBus.on('event:registered', () => {
      this.cache.invalidate('events');
    });
  }

  async getEvents(params: {
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    return this.performance.measure('getEvents', async () => {
      const cacheKey = `events_${JSON.stringify(params)}`;
      
      // Try cache first
      const cached = this.cache.get('events', cacheKey);
      if (cached) {
        this.performance.recordMetric({
          name: 'cache_hit',
          value: 1,
          timestamp: Date.now(),
          metadata: { operation: 'getEvents' }
        });
        return cached;
      }

      // Fetch from repository
      const events = await this.repository.getEventsOptimized(params);
      const enrichedEvents = this.enrichEventsData(events);
      
      // Cache the result
      this.cache.set('events', cacheKey, enrichedEvents);
      
      this.performance.recordMetric({
        name: 'cache_miss',
        value: 1,
        timestamp: Date.now(),
        metadata: { operation: 'getEvents' }
      });

      return enrichedEvents;
    });
  }

  async createEvent(eventData: any, userId: string) {
    return this.performance.measure('createEvent', async () => {
      this.validateEventData(eventData);

      const enrichedData = {
        ...eventData,
        created_by: userId,
        current_capacity: 0,
        status: 'upcoming' as const
      };

      const result = await this.repository.createEvent(enrichedData);
      
      // Emit event for cache invalidation
      await eventBus.emit('event:created', { eventId: result.id, userId });
      
      return result;
    });
  }

  async registerForEvent(eventId: string, userId: string, options: {
    usePoints?: boolean;
    pointsToUse?: number;
  } = {}) {
    return this.performance.measure('registerForEvent', async () => {
      await this.validateRegistrationEligibility(eventId, userId);

      const registrationData: any = {};
      
      if (options.usePoints && options.pointsToUse) {
        registrationData.loyalty_points_used = options.pointsToUse;
        registrationData.payment_method = 'loyalty_points';
      }

      const result = await this.repository.registerForEvent(eventId, userId, registrationData);
      
      // Emit event for cache invalidation and notifications
      await eventBus.emit('event:registered', { eventId, userId, result });
      
      return result;
    });
  }

  // Business logic methods (unchanged to maintain functionality)
  private enrichEventsData(events: any[]) {
    return events.map(event => ({
      ...event,
      isUpcoming: new Date(event.start_time) > new Date(),
      isToday: this.isToday(event.start_time),
      timeUntilStart: this.getTimeUntilStart(event.start_time),
      capacityPercentage: event.max_capacity 
        ? (event.current_capacity / event.max_capacity) * 100 
        : 0
    }));
  }

  private validateEventData(eventData: any) {
    if (!eventData.title?.trim()) {
      throw new Error('Event title is required');
    }
    if (!eventData.start_time) {
      throw new Error('Event start time is required');
    }
    if (new Date(eventData.start_time) <= new Date()) {
      throw new Error('Event start time must be in the future');
    }
  }

  private async validateRegistrationEligibility(eventId: string, userId: string) {
    const events = await this.repository.getEventsOptimized({ 
      userId, 
      status: 'all' 
    });
    
    const event = events.find(e => e.id === eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    if (event.is_registered) {
      throw new Error('Already registered for this event');
    }
    
    if (event.current_capacity >= event.max_capacity) {
      throw new Error('Event is at full capacity');
    }
  }

  private isToday(dateString: string): boolean {
    const eventDate = new Date(dateString);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }

  private getTimeUntilStart(dateString: string): string {
    const eventDate = new Date(dateString);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }
}

// Enhanced React Hook with all optimizations
export const useEnhancedEventService = () => {
  const eventService = useMemo(() => EnhancedEventService.getInstance(), []);
  const { updateWithTransition, scheduleWork } = useConcurrentFeatures();

  const getEvents = useCallback(async (params: any = {}) => {
    return eventService.getEvents(params);
  }, [eventService]);

  const createEvent = useCallback(async (eventData: any, userId: string) => {
    const result = await eventService.createEvent(eventData, userId);
    
    // Schedule background work for analytics
    scheduleWork(() => {
      performance.mark('event-created');
    });
    
    return result;
  }, [eventService, scheduleWork]);

  const registerForEvent = useCallback(async (eventId: string, userId: string, options?: any) => {
    const result = await eventService.registerForEvent(eventId, userId, options);
    
    // Update UI with concurrent features
    updateWithTransition(() => {
      // This will trigger re-render in a non-blocking way
    });
    
    return result;
  }, [eventService, updateWithTransition]);

  return {
    getEvents,
    createEvent,
    registerForEvent
  };
};

// Register service in container
container.registerFactory('eventService', () => EnhancedEventService.getInstance());
