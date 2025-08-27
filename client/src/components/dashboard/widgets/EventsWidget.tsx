import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Calendar, Clock, MapPin, Users, ArrowRight, Plus } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { useMobileFirst } from '../../../hooks/useMobileFirst';

interface EventsWidgetProps {
  configuration: {
    showPastEvents?: boolean;
    maxEvents?: number;
    showRegistrationStatus?: boolean;
    viewMode?: 'list' | 'card' | 'compact';
  };
  size: 'small' | 'medium' | 'large' | 'full';
}

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  max_capacity: number;
  price: number;
  status: string;
  registration_count?: number;
  is_registered?: boolean;
}

export const EventsWidget: React.FC<EventsWidgetProps> = ({ 
  configuration = {}, 
  size 
}) => {
  const { currentOrganization } = useOrganization();
  const { isMobile } = useMobileFirst();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    showPastEvents = false,
    maxEvents = size === 'small' ? 2 : size === 'medium' ? 4 : 6,
    showRegistrationStatus = true,
    viewMode = size === 'small' ? 'compact' : 'card'
  } = configuration;

  useEffect(() => {
    loadEvents();
  }, [currentOrganization?.id, showPastEvents]);

  const loadEvents = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      const now = new Date().toISOString();
      let query = supabase
        .from('events')
        .select(`
          *,
          event_registrations!inner(count)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'published')
        .limit(maxEvents);

      // Filter by date
      if (!showPastEvents) {
        query = query.gte('start_date', now);
      }

      query = query.order('start_date', { ascending: !showPastEvents });

      const { data: eventsData, error } = await query;

      if (error) throw error;

      // Check user registration status
      const user = await supabase.auth.getUser();
      if (user.data.user && eventsData) {
        const eventIds = eventsData.map(e => e.id);
        const { data: registrations } = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', user.data.user.id)
          .in('event_id', eventIds);

        const registeredEventIds = new Set(registrations?.map(r => r.event_id) || []);

        const eventsWithRegistration = eventsData.map(event => ({
          ...event,
          registration_count: event.event_registrations?.[0]?.count || 0,
          is_registered: registeredEventIds.has(event.id)
        }));

        setEvents(eventsWithRegistration);
      } else {
        setEvents(eventsData || []);
      }

    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderCompactView = () => (
    <div className="space-y-2">
      {events.slice(0, size === 'small' ? 3 : 4).map((event) => (
        <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{event.title}</div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              {formatDate(event.start_date)}
              <Clock className="w-3 h-3 ml-1" />
              {formatTime(event.start_date)}
            </div>
          </div>
          {showRegistrationStatus && (
            <Badge 
              variant={event.is_registered ? "default" : "outline"}
              className="text-xs"
            >
              {event.is_registered ? 'Registered' : 'Open'}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h4>
            {showRegistrationStatus && (
              <Badge 
                variant={event.is_registered ? "default" : "outline"}
                className="ml-2 shrink-0"
              >
                {event.is_registered ? 'Registered' : 'Open'}
              </Badge>
            )}
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(event.start_date)} at {formatTime(event.start_date)}
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{event.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {event.registration_count}/{event.max_capacity} registered
            </div>
          </div>

          {event.price > 0 && (
            <div className="mt-2 text-sm font-medium text-green-600">
              ${event.price.toFixed(2)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderCardView = () => (
    <div className={`grid gap-3 ${
      size === 'large' || size === 'full' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
    }`}>
      {events.map((event) => (
        <Card key={event.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                {event.title}
              </h4>
              {showRegistrationStatus && (
                <Badge 
                  variant={event.is_registered ? "default" : "outline"}
                  className="ml-2 shrink-0"
                >
                  {event.is_registered ? 'Registered' : 'Open'}
                </Badge>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                {formatDate(event.start_date)} at {formatTime(event.start_date)}
              </div>
              
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                {event.registration_count}/{event.max_capacity} registered
              </div>
            </div>

            {event.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {event.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              {event.price > 0 ? (
                <div className="text-lg font-bold text-green-600">
                  ${event.price.toFixed(2)}
                </div>
              ) : (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Free
                </Badge>
              )}

              <Button size="sm" variant="outline">
                View
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <div className="text-gray-500 mb-2">
          No {showPastEvents ? 'past' : 'upcoming'} events
        </div>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {viewMode === 'compact' && renderCompactView()}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'card' && renderCardView()}

      {events.length >= maxEvents && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-center"
        >
          View All Events
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
};