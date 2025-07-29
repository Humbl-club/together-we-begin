import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell,
  Plus, 
  Send,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Search
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

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  type: string;
  data: any;
  read_at: string | null;
  created_at: string;
}

const NotificationManagement: React.FC = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateTemplateDialog, setShowCreateTemplateDialog] = useState(false);
  const [showSendNotificationDialog, setShowSendNotificationDialog] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    content: '',
    type: 'general'
  });
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    content: '',
    type: 'general',
    template_id: '',
    target_audience: 'all' // all, admins, recent_users
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesResult, notificationsResult] = await Promise.all([
        supabase
          .from('notification_templates')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      if (templatesResult.error) throw templatesResult.error;
      if (notificationsResult.error) throw notificationsResult.error;

      setTemplates(templatesResult.data || []);
      setNotifications(notificationsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert([{
          ...templateForm,
          created_by: user?.id,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_text: 'notification_template_created',
        target_type_text: 'notification_template',
        target_id_param: data.id,
        details_param: { name: templateForm.name, type: templateForm.type }
      });

      toast({
        title: 'Success',
        description: 'Notification template created successfully',
      });

      setShowCreateTemplateDialog(false);
      setTemplateForm({
        name: '',
        title: '',
        content: '',
        type: 'general'
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create template',
        variant: 'destructive',
      });
    }
  };

  const sendNotification = async () => {
    try {
      // Get target users based on audience selection
      let targetUserIds: string[] = [];
      
      if (notificationForm.target_audience === 'all') {
        const { data: users, error } = await supabase
          .from('profiles')
          .select('id');
        
        if (error) throw error;
        targetUserIds = users.map(u => u.id);
      } else if (notificationForm.target_audience === 'admins') {
        const { data: admins, error } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');
        
        if (error) throw error;
        targetUserIds = admins.map(a => a.user_id);
      } else if (notificationForm.target_audience === 'recent_users') {
        const { data: users, error } = await supabase
          .from('profiles')
          .select('id')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(100);
        
        if (error) throw error;
        targetUserIds = users.map(u => u.id);
      }

      // Create notifications for all target users
      const notifications = targetUserIds.map(userId => ({
        user_id: userId,
        title: notificationForm.title,
        content: notificationForm.content,
        type: notificationForm.type,
        data: { sent_by_admin: user?.id }
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_text: 'notification_sent',
        target_type_text: 'notification',
        target_id_param: null,
        details_param: { 
          title: notificationForm.title, 
          target_count: targetUserIds.length,
          audience: notificationForm.target_audience
        }
      });

      toast({
        title: 'Success',
        description: `Notification sent to ${targetUserIds.length} users`,
      });

      setShowSendNotificationDialog(false);
      setNotificationForm({
        title: '',
        content: '',
        type: 'general',
        template_id: '',
        target_audience: 'all'
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send notification',
        variant: 'destructive',
      });
    }
  };

  const toggleTemplateStatus = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .update({ is_active: !isActive })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Template ${!isActive ? 'activated' : 'deactivated'}`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update template',
        variant: 'destructive',
      });
    }
  };

  const useTemplate = (template: NotificationTemplate) => {
    setNotificationForm(prev => ({
      ...prev,
      title: template.title,
      content: template.content,
      type: template.type,
      template_id: template.id
    }));
    setShowSendNotificationDialog(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'general':
        return 'secondary';
      case 'event':
        return 'default';
      case 'challenge':
        return 'outline';
      case 'system':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || template.type === filterType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Management</h2>
          <p className="text-muted-foreground">Manage notification templates and send messages</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showCreateTemplateDialog} onOpenChange={setShowCreateTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Create Notification Template</DialogTitle>
                <DialogDescription>
                  Create a reusable notification template
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Template name..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-title">Notification Title</Label>
                  <Input
                    id="template-title"
                    value={templateForm.title}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notification title..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-type">Type</Label>
                  <Select 
                    value={templateForm.type} 
                    onValueChange={(value) => setTemplateForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="challenge">Challenge</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="template-content">Content</Label>
                  <Textarea
                    id="template-content"
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Notification content..."
                    rows={4}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={createTemplate} className="flex-1">
                    Create Template
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateTemplateDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showSendNotificationDialog} onOpenChange={setShowSendNotificationDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Send Notification</DialogTitle>
                <DialogDescription>
                  Send a notification to users
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notification-title">Title</Label>
                  <Input
                    id="notification-title"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notification title..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="notification-content">Content</Label>
                  <Textarea
                    id="notification-content"
                    value={notificationForm.content}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Notification content..."
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notification-type">Type</Label>
                  <Select 
                    value={notificationForm.type} 
                    onValueChange={(value) => setNotificationForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="challenge">Challenge</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="target-audience">Target Audience</Label>
                  <Select 
                    value={notificationForm.target_audience} 
                    onValueChange={(value) => setNotificationForm(prev => ({ ...prev, target_audience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                      <SelectItem value="recent_users">Recent Users (7 days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={sendNotification} className="flex-1">
                    Send Notification
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSendNotificationDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Templates</p>
                <p className="text-2xl font-bold">
                  {templates.filter(t => t.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Sent Today</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => 
                    new Date(n.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
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
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="challenge">Challenge</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Notification Templates</h3>
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{template.name}</h4>
                    <Badge variant={getTypeColor(template.type)}>
                      {template.type}
                    </Badge>
                    {template.is_active ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                  
                  <p className="font-medium text-sm mb-1">{template.title}</p>
                  <p className="text-muted-foreground text-sm">{template.content}</p>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Created {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => useTemplate(template)}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Use
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTemplateStatus(template.id, template.is_active)}
                  >
                    {template.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'Create your first notification template to get started.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;