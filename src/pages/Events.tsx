import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, Clock, DollarSign, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  price_cents: number | null;
  loyalty_points_price: number | null;
  max_capacity: number | null;
  current_capacity: number | null;
  status: string;
  image_url: string | null;
  created_at: string;
  user_registered?: boolean;
  registration_payment_status?: string;
}

interface Profile {
  available_loyalty_points: number;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    price_cents: 0,
    loyalty_points_price: 0,
    max_capacity: 50
  });
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchUserProfile();
      subscribeToRealtime();
    }
  }, [user]);

  const subscribeToRealtime = () => {
    const channel = supabase
      .channel('events-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events'
      }, () => {
        fetchEvents();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_registrations'
      }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('available_loyalty_points')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('status', ['upcoming', 'ongoing'])
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      // Check user registrations
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('event_id, payment_status')
        .eq('user_id', user!.id);

      if (regError) throw regError;

      const eventsWithRegistration = eventsData?.map(event => ({
        ...event,
        user_registered: registrations?.some(reg => reg.event_id === event.id),
        registration_payment_status: registrations?.find(reg => reg.event_id === event.id)?.payment_status
      })) || [];

      setEvents(eventsWithRegistration);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.start_time) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const eventData = {
        ...newEvent,
        created_by: user!.id,
        status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
      };

      const { error } = await supabase
        .from('events')
        .insert(eventData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully!"
      });

      setShowCreateEvent(false);
      setNewEvent({
        title: '',
        description: '',
        location: '',
        start_time: '',
        end_time: '',
        price_cents: 0,
        loyalty_points_price: 0,
        max_capacity: 50
      });
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      });
    }
  };

  const registerForEvent = async (event: Event, paymentMethod: 'card' | 'loyalty') => {
    try {
      // Check if user has enough loyalty points
      if (paymentMethod === 'loyalty' && event.loyalty_points_price) {
        if (!userProfile || userProfile.available_loyalty_points < event.loyalty_points_price) {
          toast({
            title: "Insufficient Points",
            description: "You don't have enough loyalty points for this event",
            variant: "destructive"
          });
          return;
        }
      }

      // Check capacity
      if (event.max_capacity && event.current_capacity && event.current_capacity >= event.max_capacity) {
        toast({
          title: "Event Full",
          description: "This event has reached maximum capacity",
          variant: "destructive"
        });
        return;
      }

      const registrationData = {
        event_id: event.id,
        user_id: user!.id,
        payment_method: paymentMethod,
        loyalty_points_used: paymentMethod === 'loyalty' ? event.loyalty_points_price : 0,
        payment_status: (paymentMethod === 'loyalty' ? 'completed' : 'pending') as 'completed' | 'pending' | 'failed' | 'refunded'
      };

      const { error } = await supabase
        .from('event_registrations')
        .insert(registrationData);

      if (error) throw error;

      // Update capacity
      await supabase
        .from('events')
        .update({ current_capacity: (event.current_capacity || 0) + 1 })
        .eq('id', event.id);

      // Deduct loyalty points if used
      if (paymentMethod === 'loyalty' && event.loyalty_points_price) {
        await supabase
          .from('loyalty_transactions')
          .insert([{
            user_id: user!.id,
            type: 'redeemed',
            points: event.loyalty_points_price,
            description: `Event registration: ${event.title}`,
            reference_type: 'event',
            reference_id: event.id
          }]);
      }

      toast({
        title: "Success",
        description: paymentMethod === 'loyalty' 
          ? "Registration successful! Points deducted."
          : "Registration pending payment confirmation"
      });

      fetchEvents();
      fetchUserProfile();
    } catch (error) {
      console.error('Error registering for event:', error);
      toast({
        title: "Error",
        description: "Failed to register for event",
        variant: "destructive"
      });
    }
  };

  const getEventStatusBadge = (event: Event) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = event.end_time ? new Date(event.end_time) : null;

    if (now < startTime) {
      return <Badge variant="secondary">Upcoming</Badge>;
    } else if (endTime && now > endTime) {
      return <Badge variant="outline">Completed</Badge>;
    } else {
      return <Badge className="bg-green-500">Ongoing</Badge>;
    }
  };

  const getRegistrationStatus = (event: Event) => {
    if (!event.user_registered) return null;
    
    switch (event.registration_payment_status) {
      case 'completed':
        return <Badge className="bg-green-500">Registered</Badge>;
      case 'pending':
        return <Badge variant="secondary">Payment Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Payment Failed</Badge>;
      default:
        return <Badge variant="outline">Registered</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-4">
        <div className="text-center">Loading events...</div>
      </div>
    );
  }

  const upcomingEvents = events.filter(e => new Date(e.start_time) > new Date());
  const ongoingEvents = events.filter(e => {
    const now = new Date();
    const start = new Date(e.start_time);
    const end = e.end_time ? new Date(e.end_time) : null;
    return start <= now && (!end || end >= now);
  });

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Events</h1>
          <p className="text-muted-foreground">Discover and join exclusive community events</p>
        </div>
        
        {isAdmin && (
          <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Event title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description"
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Event location"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={newEvent.start_time}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={newEvent.end_time}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_cents">Price (cents)</Label>
                    <Input
                      id="price_cents"
                      type="number"
                      value={newEvent.price_cents}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, price_cents: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="loyalty_points_price">Loyalty Points Price</Label>
                    <Input
                      id="loyalty_points_price"
                      type="number"
                      value={newEvent.loyalty_points_price}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, loyalty_points_price: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="max_capacity">Maximum Capacity</Label>
                  <Input
                    id="max_capacity"
                    type="number"
                    value={newEvent.max_capacity}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, max_capacity: parseInt(e.target.value) || 50 }))}
                    placeholder="50"
                  />
                </div>
                
                <Button onClick={createEvent} className="w-full">
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {userProfile && (
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="font-semibold">Available Loyalty Points: {userProfile.available_loyalty_points}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Events ({upcomingEvents.length})</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing Events ({ongoingEvents.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <div className="flex gap-2">
                        {getEventStatusBadge(event)}
                        {getRegistrationStatus(event)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.start_time).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {event.current_capacity || 0}
                        {event.max_capacity && ` / ${event.max_capacity}`} attendees
                      </span>
                    </div>
                    
                    {(event.price_cents || event.loyalty_points_price) && (
                      <div className="space-y-1">
                        {event.price_cents && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>${(event.price_cents / 100).toFixed(2)}</span>
                          </div>
                        )}
                        {event.loyalty_points_price && (
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            <span>{event.loyalty_points_price} points</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!event.user_registered && (
                    <div className="space-y-2 pt-4 border-t">
                      {event.price_cents && event.price_cents > 0 && (
                        <Button
                          className="w-full"
                          onClick={() => registerForEvent(event, 'card')}
                        >
                          Register with Card (${(event.price_cents / 100).toFixed(2)})
                        </Button>
                      )}
                      
                      {event.loyalty_points_price && event.loyalty_points_price > 0 && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => registerForEvent(event, 'loyalty')}
                          disabled={!userProfile || userProfile.available_loyalty_points < event.loyalty_points_price}
                        >
                          Register with Points ({event.loyalty_points_price})
                        </Button>
                      )}
                      
                      {(!event.price_cents || event.price_cents === 0) && 
                       (!event.loyalty_points_price || event.loyalty_points_price === 0) && (
                        <Button
                          className="w-full"
                          onClick={() => registerForEvent(event, 'card')}
                        >
                          Register (Free)
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {upcomingEvents.length === 0 && (
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No upcoming events. Check back soon for new events!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="ongoing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ongoingEvents.map((event) => (
              <Card key={event.id} className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <div className="flex gap-2">
                        {getEventStatusBadge(event)}
                        {getRegistrationStatus(event)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.start_time).toLocaleDateString()}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {event.current_capacity || 0}
                        {event.max_capacity && ` / ${event.max_capacity}`} attendees
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Badge className="bg-green-500">Event in Progress</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {ongoingEvents.length === 0 && (
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No ongoing events at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Events;