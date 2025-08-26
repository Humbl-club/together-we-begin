import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OptimizedSearch } from '@/components/ui/optimized-search';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  ImageIcon,
  Calendar,
  Flag,
  Trash2,
  Archive,
  MoreHorizontal,
  Clock,
  UserCheck
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
import { Textarea } from '@/components/ui/textarea';

interface ContentReport {
  id: string;
  reporter_id: string;
  reported_content_id: string;
  reported_content_type: string;
  reported_user_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reporter_profile?: {
    full_name: string;
    avatar_url: string;
  } | null;
  reported_user_profile?: {
    full_name: string;
    avatar_url: string;
  } | null;
  content_preview?: string;
}

interface ContentItem {
  content_id: string;
  content_type: 'post' | 'comment';
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
  status: string;
  reports_count: number;
  latest_report_reason: string;
}

interface ModerationAction {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
  admin_profile?: {
    full_name: string;
    avatar_url: string;
  };
}

const ContentModeration: React.FC = () => {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterContentType, setFilterContentType] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [moderationHistory, setModerationHistory] = useState<ModerationAction[]>([]);
  const [activeTab, setActiveTab] = useState('reports');
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
    if (activeTab === 'history') {
      loadModerationHistory();
    } else if (activeTab === 'content') {
      loadContent();
    }
  }, [activeTab, filterContentType, filterStatus, searchTerm]);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('content_reports')
        .select(`
          *,
          reporter_profile:reporter_id(full_name, avatar_url),
          reported_user_profile:reported_user_id(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch content previews for posts
      const reportsWithPreviews = await Promise.all(
        (data || []).map(async (report) => {
          if (report.reported_content_type === 'post') {
            const { data: postData } = await supabase
              .from('social_posts')
              .select('content')
              .eq('id', report.reported_content_id)
              .single();
            
            return {
              ...report,
              content_preview: postData?.content ? 
                postData.content.substring(0, 100) + (postData.content.length > 100 ? '...' : '') 
                : 'Content not found'
            };
          }
          return report;
        })
      );
      
      setReports(reportsWithPreviews as unknown as ContentReport[]);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    try {
      const { data, error } = await supabase.rpc('get_content_for_moderation', {
        content_type_filter: filterContentType,
        status_filter: filterStatus === 'pending' ? 'active' : filterStatus,
        search_query: searchTerm || undefined,
        limit_param: 50,
        offset_param: 0
      });

      if (error) throw error;
      setContent((data || []).map(item => ({
        ...item,
        content_type: item.content_type as 'post' | 'comment'
      })));
    } catch (error) {
      console.error('Failed to load content:', error);
      toast({
        title: "Failed to load content",
        variant: "destructive"
      });
    }
  };

  const loadModerationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .select(`
          id,
          admin_id,
          action,
          target_type,
          target_id,
          details,
          created_at
        `)
        .ilike('action', '%content%')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Get admin profiles separately
      const adminIds = Array.from(new Set(data?.map(action => action.admin_id) || []));
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', adminIds);

      const historyWithProfiles = data?.map(action => ({
        ...action,
        admin_profile: adminProfiles?.find(profile => profile.id === action.admin_id)
      })) || [];

      setModerationHistory(historyWithProfiles as ModerationAction[]);
    } catch (error) {
      console.error('Error loading moderation history:', error);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedReports.length === 0) return;
    
    setBulkProcessing(true);
    try {
      const { error } = await supabase
        .from('content_reports')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .in('id', selectedReports);

      if (error) throw error;

      // Log bulk admin action
      await supabase.rpc('log_admin_action', {
        action_text: `bulk_content_report_${action}`,
        target_type_text: 'content_report_bulk',
        target_id_param: undefined,
        details_param: { report_ids: selectedReports, count: selectedReports.length }
      });

      toast({
        title: 'Success',
        description: `${selectedReports.length} reports ${action}d successfully`,
      });

      setSelectedReports([]);
      loadReports();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} reports`,
        variant: 'destructive',
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkContentAction = async (action: 'flagged' | 'removed') => {
    if (selectedContent.length === 0) return;
    
    setBulkProcessing(true);
    try {
      const { data, error } = await supabase.rpc('moderate_content', {
        content_type_param: 'post', // We'll handle mixed types later
        content_ids: selectedContent,
        new_status: action,
        moderator_id: user?.id || '',
        reason: `Bulk ${action} action`
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: (data as any)?.message || `${selectedContent.length} items ${action}`,
      });

      setSelectedContent([]);
      loadContent();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} content`,
        variant: 'destructive',
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const reviewReport = async (reportId: string, action: 'approved' | 'rejected') => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      // Use the new resolve function to handle both report and content
      const contentAction = action === 'approved' ? 'removed' : null;
      
      const { data, error } = await supabase.rpc('resolve_content_reports', {
        report_ids: [reportId],
        resolution: action,
        content_action: contentAction || undefined,
        moderator_notes: reviewNotes
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: (data as any)?.message || `Report ${action} successfully`,
      });

      setShowReviewDialog(false);
      setSelectedReport(null);
      setReviewNotes('');
      loadReports();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} report`,
        variant: 'destructive',
      });
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason.toLowerCase()) {
      case 'spam':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'harassment':
        return <Flag className="w-4 h-4 text-red-500" />;
      case 'inappropriate':
        return <XCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'destructive';
      case 'rejected':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <MessageSquare className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesType = filterType === 'all' || report.reported_content_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
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
          <h2 className="text-2xl font-bold">Content Moderation</h2>
          <p className="text-muted-foreground">Review and moderate reported content</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Flag className="w-4 h-4" />
          {reports.filter(r => r.status === 'pending').length} Pending
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Reports</p>
                <p className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">
                  {reports.filter(r => r.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Reports Queue
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Content Management
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Moderation History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="event">Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedReports.length > 0 && (
            <Card className="glass-card border-primary">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedReports.length} selected</Badge>
                    <span className="text-sm text-muted-foreground">
                      Bulk actions for selected reports
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkAction('approve')}
                      disabled={bulkProcessing}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('reject')}
                      disabled={bulkProcessing}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReports([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reports List */}
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {report.status === 'pending' && (
                        <Checkbox
                          checked={selectedReports.includes(report.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedReports([...selectedReports, report.id]);
                            } else {
                              setSelectedReports(selectedReports.filter(id => id !== report.id));
                            }
                          }}
                        />
                      )}
                      
                      <div className="flex items-center gap-2">
                        {getReasonIcon(report.reason)}
                        {getContentTypeIcon(report.reported_content_type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold capitalize">{report.reason}</h3>
                          <Badge variant={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        
                        {report.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {report.description}
                          </p>
                        )}
                        
                        {report.content_preview && (
                          <div className="bg-muted/50 p-3 rounded-lg mb-2">
                            <p className="text-sm italic">
                              "{report.content_preview}"
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>Reported by:</span>
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={report.reporter_profile?.avatar_url} />
                              <AvatarFallback>
                                {report.reporter_profile?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{report.reporter_profile?.full_name || 'Unknown'}</span>
                          </div>
                          
                          {report.reported_user_profile && (
                            <div className="flex items-center gap-1">
                              <span>Against:</span>
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={report.reported_user_profile?.avatar_url} />
                                <AvatarFallback>
                                  {report.reported_user_profile?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span>{report.reported_user_profile?.full_name || 'Unknown'}</span>
                            </div>
                          )}
                          
                          <span>{new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowReviewDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reports found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'No content reports match your filters.'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Content Management Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterContentType} onValueChange={setFilterContentType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="removed">Removed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Bulk Actions */}
          {selectedContent.length > 0 && (
            <Card className="glass-card border-orange-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedContent.length} selected</Badge>
                    <span className="text-sm text-muted-foreground">
                      Bulk actions for selected content
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkContentAction('flagged')}
                      disabled={bulkProcessing}
                    >
                      <Flag className="w-4 h-4 mr-1" />
                      Flag All
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkContentAction('removed')}
                      disabled={bulkProcessing}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedContent([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content List */}
          <div className="space-y-4">
            {content.map((item) => (
              <Card key={item.content_id} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Checkbox
                        checked={selectedContent.includes(item.content_id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedContent([...selectedContent, item.content_id]);
                          } else {
                            setSelectedContent(selectedContent.filter(id => id !== item.content_id));
                          }
                        }}
                      />
                      
                      <div className="flex items-center gap-2">
                        {getContentTypeIcon(item.content_type)}
                        {item.reports_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {item.reports_count} reports
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {item.content_type === 'post' ? 'Post' : 'Comment'}
                          </h3>
                          <Badge variant={
                            item.status === 'active' ? 'default' :
                            item.status === 'flagged' ? 'secondary' : 'destructive'
                          }>
                            {item.status}
                          </Badge>
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-lg mb-2">
                          <p className="text-sm">
                            {item.content.length > 200 
                              ? item.content.substring(0, 200) + "..." 
                              : item.content
                            }
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>By:</span>
                            <span>{item.author_name}</span>
                          </div>
                          
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          
                          {item.latest_report_reason && (
                            <div className="flex items-center gap-1">
                              <Flag className="w-3 h-3 text-red-500" />
                              <span className="text-red-600 text-xs">
                                Latest: {item.latest_report_reason}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {item.status === 'active' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkContentAction('flagged')}
                          >
                            <Flag className="w-4 h-4 mr-1" />
                            Flag
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBulkContentAction('removed')}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </>
                      )}
                      {item.status === 'flagged' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleBulkContentAction('removed')}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {content.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No content found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'No content matches your filters.'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="space-y-4">
            {moderationHistory.map((action) => (
              <Card key={action.id} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-blue-500" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold capitalize">
                          {action.action.replace(/_/g, ' ')}
                        </h3>
                        <Badge variant="outline">{action.target_type}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>By:</span>
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={action.admin_profile?.avatar_url} />
                            <AvatarFallback>
                              {action.admin_profile?.full_name?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{action.admin_profile?.full_name || 'Admin'}</span>
                        </div>
                        
                        <span>{new Date(action.created_at).toLocaleDateString()}</span>
                        
                        {action.details && action.details.count && (
                          <Badge variant="secondary">
                            {action.details.count} items
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {moderationHistory.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No moderation history</h3>
              <p className="text-muted-foreground">
                Moderation actions will appear here once you start reviewing content.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Review Content Report</DialogTitle>
            <DialogDescription>
              Review this report and decide whether to approve or reject it
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Report Details</h4>
                <p><strong>Reason:</strong> {selectedReport.reason}</p>
                {selectedReport.description && (
                  <p><strong>Description:</strong> {selectedReport.description}</p>
                )}
                <p><strong>Content Type:</strong> {selectedReport.reported_content_type}</p>
                {selectedReport.content_preview && (
                  <div className="mt-2">
                    <strong>Content Preview:</strong>
                    <div className="bg-background p-2 rounded mt-1">
                      <p className="text-sm italic">"{selectedReport.content_preview}"</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium">Review Notes (optional)</label>
                <Textarea
                  placeholder="Add any notes about your decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => reviewReport(selectedReport.id, 'approved')}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve (Remove Content)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => reviewReport(selectedReport.id, 'rejected')}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject (Keep Content)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentModeration;