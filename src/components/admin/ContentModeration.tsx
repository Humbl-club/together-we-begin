import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  ImageIcon,
  Calendar,
  Flag
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

const ContentModeration: React.FC = () => {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('content_reports')
        .select(`
          *,
          reporter_profile:profiles!content_reports_reporter_id_fkey(full_name, avatar_url),
          reported_user_profile:profiles!content_reports_reported_user_id_fkey(full_name, avatar_url)
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

  const reviewReport = async (reportId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('content_reports')
        .update({
          status: action,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_text: `content_report_${action}`,
        target_type_text: 'content_report',
        target_id_param: reportId,
        details_param: { notes: reviewNotes }
      });

      toast({
        title: 'Success',
        description: `Report ${action} successfully`,
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

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
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