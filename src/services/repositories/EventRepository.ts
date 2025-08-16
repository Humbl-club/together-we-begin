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
    
    try {
      const { data, error } = await supabase.rpc('get_events_optimized', {
        user_id_param: userId || null,
        status_filter: status,
        limit_param: limit,
        offset_param: offset
      });

      if (error) throw error;
      
      // CRITICAL FIX: Handle null/undefined returns
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('getEventsOptimized error:', error);
      return []; // Fallback to empty array
    }
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

  // Register for event via atomic RPC to avoid race conditions
  async registerForEvent(eventId: string, userId: string, registrationData: {
    payment_method?: string;
    loyalty_points_used?: number;
  } = {}) {
    const { data, error } = await supabase
      .rpc('register_for_event', {
        event_id_param: eventId,
        user_id_param: userId,
        payment_method_param: registrationData.payment_method || null,
        loyalty_points_used_param: registrationData.loyalty_points_used || 0,
      });
    const result = (data as unknown) as { success?: boolean; error?: string; registration_id?: string };

    if (!result?.success) {
      throw new Error(result?.error || 'Registration failed');
    }

    return { id: result.registration_id, event_id: eventId, user_id: userId, ...registrationData } as any;
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