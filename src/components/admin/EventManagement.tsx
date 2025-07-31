import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Calendar, 
  Users,
  MapPin,
  Eye,
  Edit,
  QrCode,
  BarChart3,
  DollarSign,
  Clock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AttendanceManager } from '@/components/events/AttendanceManager';

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  image_url: string | null;
  price_cents: number;
  loyalty_points_price: number | null;
  max_capacity: number | null;
  current_capacity: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  attendance_points: number;
  qr_code_token: string | null;
  qr_code_generated_at: string | null;
}

const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAttendeeDialog, setShowAttendeeDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [qrGenerating, setQrGenerating] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    price_cents: 0,
    loyalty_points_price: null as number | null,
    max_capacity: null as number | null,
    attendance_points: 0
  });
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    price_cents: 0,
    loyalty_points_price: null as number | null,
    max_capacity: null as number | null,
    attendance_points: 0
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...createForm,
          created_by: user?.id,
          current_capacity: 0,
          status: 'upcoming'
        }])
        .select()
        .single();

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_text: 'event_created',
        target_type_text: 'event',
        target_id_param: data.id,
        details_param: { title: createForm.title }
      });

      toast({
        title: 'Success',
        description: 'Event created successfully',
      });

      setShowCreateDialog(false);
      setCreateForm({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        price_cents: 0,
        loyalty_points_price: null,
        max_capacity: null,
        attendance_points: 0
      });
      loadEvents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create event',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (event: Event) => {
    setSelectedEvent(event);
    setEditForm({
      title: event.title,
      description: event.description || '',
      start_time: event.start_time.slice(0, 16), // Format for datetime-local
      end_time: event.end_time?.slice(0, 16) || '',
      location: event.location || '',
      price_cents: event.price_cents,
      loyalty_points_price: event.loyalty_points_price,
      max_capacity: event.max_capacity,
      attendance_points: event.attendance_points
    });
    setShowEditDialog(true);
  };

  const updateEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .update({
          ...editForm,
          end_time: editForm.end_time || null
        })
        .eq('id', selectedEvent.id);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_text: 'event_updated',
        target_type_text: 'event',
        target_id_param: selectedEvent.id,
        details_param: { title: editForm.title }
      });

      toast({
        title: 'Success',
        description: 'Event updated successfully',
      });

      setShowEditDialog(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update event',
        variant: 'destructive',
      });
    }
  };

  const openAttendeeDialog = (event: Event) => {
    setSelectedEvent(event);
    setShowAttendeeDialog(true);
  };

  const generateQRCode = async (eventId: string) => {
    try {
      const { data, error } = await supabase.rpc('generate_event_qr_code', {
        event_id_param: eventId
      });

      if (error) throw error;

      const result = data as { success: boolean; qr_token?: string; error?: string };
      
      if (result.success && result.qr_token) {
        setQrCode(result.qr_token);
        setShowQRDialog(true);
        loadEvents(); // Refresh to show updated QR status
        
        toast({
          title: 'Success',
          description: 'QR code generated successfully',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate QR code',
        variant: 'destructive',
      });
    }
  };

  const updateEventStatus = async (eventId: string, status: Event['status']) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status })
        .eq('id', eventId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_text: `event_status_changed`,
        target_type_text: 'event',
        target_id_param: eventId,
        details_param: { new_status: status }
      });

      toast({
        title: 'Success',
        description: `Event status updated to ${status}`,
      });

      loadEvents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update event status',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'secondary';
      case 'ongoing':
        return 'default';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Management</h2>
          <p className="text-muted-foreground">Create and manage community events</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Create a new community event with all the details
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 overflow-y-auto pr-2 -mr-2 max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={createForm.title}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter event title..."
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your event..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="datetime-local"
                    value={createForm.start_time}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="datetime-local"
                    value={createForm.end_time}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={createForm.location}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Event location..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="price">Price (cents)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={createForm.price_cents}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      price_cents: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="loyalty-price">Loyalty Points Price</Label>
                  <Input
                    id="loyalty-price"
                    type="number"
                    min="0"
                    value={createForm.loyalty_points_price || ''}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      loyalty_points_price: e.target.value ? parseInt(e.target.value) : null
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="capacity">Max Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={createForm.max_capacity || ''}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      max_capacity: e.target.value ? parseInt(e.target.value) : null
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="attendance-points">Attendance Points</Label>
                  <Input
                    id="attendance-points"
                    type="number"
                    min="0"
                    value={createForm.attendance_points}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      attendance_points: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-6 mt-6 border-t bg-background/80 backdrop-blur -mx-6 px-6 py-4 sticky bottom-0">
                <Button 
                  onClick={createEvent} 
                  className="flex-1"
                  disabled={loading || !createForm.title || !createForm.start_time}
                >
                  {loading ? "Creating..." : "Create Event"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false);
                    setCreateForm({
                      title: '',
                      description: '',
                      start_time: '',
                      end_time: '',
                      location: '',
                      price_cents: 0,
                      loyalty_points_price: null,
                      max_capacity: null,
                      attendance_points: 0
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => e.status === 'upcoming').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold">
                  {events.reduce((sum, event) => sum + (event.max_capacity || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">
                  ${(events.reduce((sum, event) => 
                    sum + (event.current_capacity * event.price_cents), 0) / 100).toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="search-events"
            name="searchEvents"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            autoComplete="off"
          />
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        <Badge variant={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                        {event.qr_code_token && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <QrCode className="w-3 h-3" />
                            QR Ready
                          </Badge>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-muted-foreground mb-2">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.start_time).toLocaleDateString()}
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {formatPrice(event.price_cents)}
                        </div>
                        
                        {event.max_capacity && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {event.current_capacity}/{event.max_capacity}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(event)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAttendeeDialog(event)}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Attendees
                  </Button>
                  {event.status === 'upcoming' && !event.qr_code_token && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateQRCode(event.id)}
                      disabled={qrGenerating === event.id}
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      {qrGenerating === event.id ? 'Generating...' : 'Generate QR'}
                    </Button>
                  )}
                  
                  {event.qr_code_token && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQrCode(event.qr_code_token!);
                        setShowQRDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View QR
                    </Button>
                  )}
                  
                  <Select onValueChange={(value) => updateEventStatus(event.id, value as Event['status'])}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Actions..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Set Upcoming</SelectItem>
                      <SelectItem value="ongoing">Set Ongoing</SelectItem>
                      <SelectItem value="completed">Set Completed</SelectItem>
                      <SelectItem value="cancelled">Cancel Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <EmptyState
            icon={<Calendar className="w-full h-full" />}
            title="No events found"
            description={searchTerm ? 'Try adjusting your search terms.' : 'Create your first event to get started.'}
          />
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogHeader>
            <DialogTitle>Event QR Code</DialogTitle>
            <DialogDescription>
              Share this QR code for event attendance tracking
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="w-48 h-48 bg-muted flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
            </div>
            
            <div className="text-center">
              <p className="font-mono text-sm bg-muted px-3 py-1 rounded">
                {qrCode}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Scan this code to mark attendance
              </p>
            </div>
            
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(qrCode);
                toast({ title: 'Copied', description: 'QR code copied to clipboard' });
              }}
              variant="outline"
              className="w-full"
            >
              Copy QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update event details and information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-title">Event Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title..."
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your event..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-start-time">Start Time</Label>
                <Input
                  id="edit-start-time"
                  type="datetime-local"
                  value={editForm.start_time}
                  onChange={(e) => setEditForm(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-end-time">End Time</Label>
                <Input
                  id="edit-end-time"
                  type="datetime-local"
                  value={editForm.end_time}
                  onChange={(e) => setEditForm(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Event location..."
                />
              </div>
              
              <div>
                <Label htmlFor="edit-price">Price (cents)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  value={editForm.price_cents}
                  onChange={(e) => setEditForm(prev => ({ 
                    ...prev, 
                    price_cents: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-loyalty-price">Loyalty Points Price</Label>
                <Input
                  id="edit-loyalty-price"
                  type="number"
                  min="0"
                  value={editForm.loyalty_points_price || ''}
                  onChange={(e) => setEditForm(prev => ({ 
                    ...prev, 
                    loyalty_points_price: e.target.value ? parseInt(e.target.value) : null
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-capacity">Max Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  value={editForm.max_capacity || ''}
                  onChange={(e) => setEditForm(prev => ({ 
                    ...prev, 
                    max_capacity: e.target.value ? parseInt(e.target.value) : null
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-attendance-points">Attendance Points</Label>
                <Input
                  id="edit-attendance-points"
                  type="number"
                  min="0"
                  value={editForm.attendance_points}
                  onChange={(e) => setEditForm(prev => ({ 
                    ...prev, 
                    attendance_points: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={updateEvent} className="flex-1">
                Update Event
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attendee Management Dialog */}
      <Dialog open={showAttendeeDialog} onOpenChange={setShowAttendeeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogHeader>
            <DialogTitle>Event Attendees</DialogTitle>
            <DialogDescription>
              Manage attendance and view QR codes for {selectedEvent?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {selectedEvent && (
              <AttendanceManager
                eventId={selectedEvent.id}
                eventTitle={selectedEvent.title}
                eventDate={selectedEvent.start_time}
                attendancePoints={selectedEvent.attendance_points}
                qrCodeToken={selectedEvent.qr_code_token || undefined}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventManagement;