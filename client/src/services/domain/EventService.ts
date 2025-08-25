import { EventRepository } from '@/services/repositories/EventRepository';
import { useSmartCaching } from '@/hooks/useSmartCaching';
import { useConcurrentFeatures } from '@/hooks/useConcurrentFeatures';
import { useCallback, useMemo } from 'react';

// Domain service for Event business logic
export class EventService {
  private static instance: EventService;
  private repository: EventRepository;

  private constructor() {
    this.repository = EventRepository.getInstance();
  }

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  // Business logic: Get events with caching and optimization
  async getEvents(params: {
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const events = await this.repository.getEventsOptimized(params);
      return this.enrichEventsData(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch events');
    }
  }

  // Business logic: Validate and create event
  async createEvent(eventData: any, userId: string) {
    this.validateEventData(eventData);

    const enrichedData = {
      ...eventData,
      created_by: userId,
      current_capacity: 0,
      status: 'upcoming' as const
    };

    return await this.repository.createEvent(enrichedData);
  }

  // Business logic: Register for event with validation
  async registerForEvent(eventId: string, userId: string, options: {
    usePoints?: boolean;
    pointsToUse?: number;
  } = {}) {
    // Validate registration eligibility
    await this.validateRegistrationEligibility(eventId, userId);

    const registrationData: any = {};
    
    if (options.usePoints && options.pointsToUse) {
      registrationData.loyalty_points_used = options.pointsToUse;
      registrationData.payment_method = 'loyalty_points';
    }

    return await this.repository.registerForEvent(eventId, userId, registrationData);
  }

  // Private business logic methods
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

// React hook for Event service with advanced optimization
export const useEventService = () => {
  const eventService = useMemo(() => EventService.getInstance(), []);
  const cache = useSmartCaching({ ttl: 5 * 60 * 1000, maxSize: 50 });
  const { updateWithTransition, scheduleWork } = useConcurrentFeatures();

  const getEvents = useCallback(async (params: any = {}) => {
    const cacheKey = `events_${JSON.stringify(params)}`;
    
    // Try cache first
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Fetch from service
    const events = await eventService.getEvents(params);
    cache.set(cacheKey, events);
    
    return events;
  }, [eventService, cache]);

  const createEvent = useCallback(async (eventData: any, userId: string) => {
    const result = await eventService.createEvent(eventData, userId);
    
    // Invalidate cache
    scheduleWork(() => {
      cache.cleanup();
    });
    
    return result;
  }, [eventService, cache, scheduleWork]);

  const registerForEvent = useCallback(async (eventId: string, userId: string, options?: any) => {
    const result = await eventService.registerForEvent(eventId, userId, options);
    
    // Update UI optimistically
    updateWithTransition(() => {
      cache.cleanup();
    });
    
    return result;
  }, [eventService, cache, updateWithTransition]);

  return {
    getEvents,
    createEvent,
    registerForEvent
  };
};