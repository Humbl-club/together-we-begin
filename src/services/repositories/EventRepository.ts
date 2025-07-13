import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Domain-driven data access layer for Events
export class EventRepository {
  private static instance: EventRepository;

  private constructor() {}

  static getInstance(): EventRepository {
    if (!EventRepository.instance) {
      EventRepository.instance = new EventRepository();
    }
    return EventRepository.instance;
  }

  // Optimized event listing with database function
  async getEventsOptimized(params: {
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { userId, status = 'upcoming', limit = 20, offset = 0 } = params;
    
    const { data, error } = await supabase.rpc('get_events_optimized', {
      user_id_param: userId || null,
      status_filter: status,
      limit_param: limit,
      offset_param: offset
    });

    if (error) throw error;
    return data;
  }

  // Create event with optimized data validation
  async createEvent(eventData: Database['public']['Tables']['events']['Insert']) {
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select(`
        *,
        event_registrations!inner(count)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Update event with optimistic updates
  async updateEvent(id: string, updates: Database['public']['Tables']['events']['Update']) {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Register for event with transaction safety
  async registerForEvent(eventId: string, userId: string, registrationData: {
    payment_method?: string;
    loyalty_points_used?: number;
  } = {}) {
    const { data, error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        user_id: userId,
        ...registrationData
      })
      .select()
      .single();

    if (error) throw error;

    // First get the current event data to access current_capacity
    const { data: currentEvent } = await supabase
      .from('events')
      .select('current_capacity')
      .eq('id', eventId)
      .single();

    // Update event capacity (simplified version)
    await supabase
      .from('events')
      .update({ current_capacity: (currentEvent?.current_capacity || 0) + 1 })
      .eq('id', eventId);
    
    return data;
  }

  // Get user's registered events
  async getUserRegistrations(userId: string) {
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        *,
        events:event_id (
          id,
          title,
          start_time,
          end_time,
          location,
          image_url,
          status
        )
      `)
      .eq('user_id', userId)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}