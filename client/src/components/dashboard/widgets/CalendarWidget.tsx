import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Filter,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useOrganization } from '../../../contexts/OrganizationContext';

interface CalendarWidgetProps {
  configuration: {
    viewMode?: 'month' | 'week' | 'agenda';
    showMiniCalendar?: boolean;
    maxEvents?: number;
    eventTypes?: string[];
    showEventDetails?: boolean;
  };
  size: 'small' | 'medium' | 'large' | 'full';
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  max_capacity?: number;
  registration_count: number;
  is_registered: boolean;
  status: string;
  color?: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ 
  configuration = {}, 
  size 
}) => {
  const { currentOrganization } = useOrganization();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    viewMode = size === 'small' ? 'agenda' : size === 'medium' ? 'week' : 'month',
    showMiniCalendar = size !== 'small',
    maxEvents = size === 'small' ? 3 : size === 'medium' ? 5 : 10,
    eventTypes = ['all'],
    showEventDetails = size !== 'small'
  } = configuration;

  useEffect(() => {
    loadEvents();
  }, [currentOrganization?.id, currentDate, viewMode]);

  const loadEvents = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      // Calculate date range based on view mode
      let startDate: Date, endDate: Date;
      
      if (viewMode === 'month') {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      } else if (viewMode === 'week') {
        const dayOfWeek = currentDate.getDay();
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      } else {
        // Agenda view - next 30 days
        startDate = new Date();
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
      }

      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          *,
          event_registrations!inner(count)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'published')
        .gte('start_date', startDate.toISOString())
        .lte('start_date', endDate.toISOString())
        .order('start_date', { ascending: true })
        .limit(maxEvents);

      if (error) throw error;

      // Check user registration status
      const user = await supabase.auth.getUser();
      let registeredEventIds: Set<string> = new Set();
      
      if (user.data.user && eventsData) {
        const eventIds = eventsData.map(e => e.id);
        const { data: registrations } = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', user.data.user.id)
          .in('event_id', eventIds);
        
        registeredEventIds = new Set(registrations?.map(r => r.event_id) || []);
      }

      const formattedEvents = eventsData?.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        location: event.location,
        max_capacity: event.max_capacity,
        registration_count: event.event_registrations?.[0]?.count || 0,
        is_registered: registeredEventIds.has(event.id),
        status: event.status,
        color: getEventColor(event.title) // Helper function to assign colors
      })) || [];

      setEvents(formattedEvents);

    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (title: string): string => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    // Simple hash function to assign consistent colors
    const hash = title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const formatDate = (dateString: string, format: 'time' | 'date' | 'short' = 'time') => {
    const date = new Date(dateString);
    
    switch (format) {
      case 'time':
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      case 'date':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      case 'short':
        return date.toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric'
        });
      default:
        return date.toLocaleString();
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      // Agenda view doesn't need navigation
      return;
    }
    
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const renderMiniCalendar = () => {
    if (!showMiniCalendar) return null;

    const days = getDaysInMonth();
    const today = new Date();

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateDate('prev')}
              className="p-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateDate('next')}
              className="p-1"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="text-center text-gray-500 font-medium p-1">
              {day}
            </div>
          ))}
          
          {days.map(({ date, isCurrentMonth }, index) => {
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`p-1 text-xs rounded hover:bg-gray-100 relative ${
                  !isCurrentMonth ? 'text-gray-300' :
                  isToday ? 'bg-blue-500 text-white' :
                  isSelected ? 'bg-blue-100 text-blue-800' :
                  'text-gray-900'
                }`}
              >
                {date.getDate()}
                {dayEvents.length > 0 && (
                  <div className={`absolute bottom-0 right-0 w-1 h-1 rounded-full ${
                    isToday ? 'bg-white' : 'bg-blue-500'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => (
    <div className="space-y-3">
      {events.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <div className="text-gray-500 mb-2">No upcoming events</div>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>
      ) : (
        events.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm line-clamp-1">{event.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(event.start_date, 'date')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(event.start_date)}
                    </div>
                  </div>
                </div>
                
                <Badge 
                  variant={event.is_registered ? "default" : "outline"}
                  className="ml-2"
                >
                  {event.is_registered ? 'Registered' : 'Open'}
                </Badge>
              </div>

              {showEventDetails && (
                <>
                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                    <Users className="w-3 h-3" />
                    {event.registration_count}/{event.max_capacity} registered
                  </div>

                  {event.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {event.description}
                    </p>
                  )}
                </>
              )}

              <div className="flex items-center justify-between">
                <div className={`px-2 py-1 rounded text-xs ${event.color}`}>
                  Event
                </div>
                <Button size="sm" variant="outline">
                  View Details
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-sm">
              {formatDate(weekDays[0].toISOString(), 'date')} - {formatDate(weekDays[6].toISOString(), 'date')}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button size="sm" variant="outline">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div key={index} className="text-center">
                <div className={`text-xs font-medium p-2 rounded ${
                  isToday ? 'bg-blue-500 text-white' : 'text-gray-600'
                }`}>
                  <div>{DAYS_OF_WEEK[index]}</div>
                  <div className="text-lg">{date.getDate()}</div>
                </div>
                
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div 
                      key={event.id}
                      className={`text-xs p-1 rounded truncate ${event.color}`}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderMiniCalendar()}
      
      {viewMode === 'agenda' && renderAgendaView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMiniCalendar()}

      {/* Quick Stats */}
      {events.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <span>{events.length} upcoming events</span>
          <span>{events.filter(e => e.is_registered).length} registered</span>
        </div>
      )}
    </div>
  );
};