import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Eye,
  Check,
  X,
  Flag,
  MessageSquare,
  Image,
  Calendar,
  User,
  Building2,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { Input } from '../../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../ui/dropdown-menu';

interface ModerationItem {
  id: string;
  organization_id: string;
  organization_name: string;
  content_type: 'post' | 'comment' | 'message' | 'profile' | 'event' | 'challenge';
  content_id: string;
  reported_by: string;
  reporter_name: string;
  report_reason: string;
  report_details: string;
  content_snapshot: any;
  ai_moderation_score?: number;
  ai_moderation_flags: string[];
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  moderator_id?: string;
  moderator_notes?: string;
  created_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const CONTENT_TYPE_ICONS = {
  post: <MessageSquare className="w-4 h-4" />,
  comment: <MessageSquare className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
  profile: <User className="w-4 h-4" />,
  event: <Calendar className="w-4 h-4" />,
  challenge: <Flag className="w-4 h-4" />
};

const SEVERITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  escalated: 'bg-purple-100 text-purple-800'
};

export const ContentModerationQueue: React.FC = () => {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);

  useEffect(() => {
    loadModerationQueue();
  }, [filter]);

  const loadModerationQueue = async () => {
    try {
      setLoading(true);

      // Use the real data RPC function from migration 008
      const { data, error } = await supabase.rpc(
        'get_moderation_queue_real',
        { 
          admin_user_id: (await supabase.auth.getUser()).data.user?.id,
          status_filter: filter === 'all' ? 'all' : filter
        }
      );

      if (error) throw error;

      const formattedItems: ModerationItem[] = data?.map(item => ({
        id: item.id,
        organization_id: item.organization_id,
        organization_name: item.organization_name,
        content_type: item.content_type,
        content_id: item.content_id,
        reported_by: item.reported_by,
        reporter_name: item.reporter_name,
        report_reason: item.report_reason,
        report_details: item.report_details,
        content_snapshot: item.content_snapshot,
        ai_moderation_score: item.ai_moderation_score,
        ai_moderation_flags: item.ai_moderation_flags || [],
        status: item.status,
        created_at: item.created_at,
        severity: item.severity
      })) || [];

      setItems(formattedItems);

    } catch (error) {
      console.error('Error loading moderation queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async (
    itemId: string, 
    action: 'approve' | 'reject' | 'escalate',
    notes?: string
  ) => {
    try {
      // In production, this would call the moderation API
      console.log(`Moderating item ${itemId} with action ${action}`, { notes });

      // Update local state
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'escalated',
              moderator_notes: notes,
              moderator_id: 'current-admin-id' // Would be actual admin ID
            }
          : item
      ));

      // Close detail view if it was the selected item
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }

    } catch (error) {
      console.error('Error moderating content:', error);
    }
  };

  const getSeverityFromAIScore = (score?: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (!score) return 'low';
    if (score >= 0.9) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredItems = items.filter(item =>
    item.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.report_reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reporter_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Content Moderation
          </h2>
          <p className="text-gray-600">Review and moderate reported content across all organizations</p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="touch-manipulation">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg min-h-[44px] touch-manipulation"
              >
                <option value="pending">Pending Review</option>
                <option value="escalated">Escalated</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All Items</option>
              </select>

              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64 min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredItems.length} items
              </Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {filteredItems.filter(i => i.severity === 'critical' || i.severity === 'high').length} high priority
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moderation Queue */}
      <div className="space-y-4">
        {filteredItems.map(item => (
          <Card key={item.id} className={`hover:shadow-md transition-shadow touch-manipulation ${
            item.severity === 'critical' ? 'border-red-300' : 
            item.severity === 'high' ? 'border-orange-300' : ''
          }`}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {CONTENT_TYPE_ICONS[item.content_type]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg capitalize">
                        {item.content_type} Report
                      </h3>
                      
                      <Badge className={STATUS_COLORS[item.status]}>
                        {item.status}
                      </Badge>
                      
                      <Badge className={SEVERITY_COLORS[item.severity]}>
                        {item.severity} priority
                      </Badge>

                      {item.ai_moderation_score && (
                        <Badge variant="outline">
                          AI Score: {Math.round(item.ai_moderation_score * 100)}%
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-600">Organization:</span>
                        <div className="font-medium flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {item.organization_name}
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-600">Reported by:</span>
                        <div className="font-medium">{item.reporter_name}</div>
                      </div>

                      <div>
                        <span className="text-gray-600">Reason:</span>
                        <div className="font-medium">{item.report_reason}</div>
                      </div>

                      <div>
                        <span className="text-gray-600">Reported:</span>
                        <div className="font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-gray-600 text-sm">Report Details:</span>
                      <p className="text-gray-900 mt-1">{item.report_details}</p>
                    </div>

                    {item.ai_moderation_flags.length > 0 && (
                      <div className="mb-4">
                        <span className="text-gray-600 text-sm">AI Detected Issues:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.ai_moderation_flags.map(flag => (
                            <Badge key={flag} variant="outline" className="text-xs">
                              {flag.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-600 text-sm">Content Preview:</span>
                      <div className="mt-2">
                        {item.content_snapshot.content && (
                          <p className="text-gray-900 line-clamp-2">
                            "{item.content_snapshot.content}"
                          </p>
                        )}
                        {item.content_snapshot.author && (
                          <p className="text-sm text-gray-600 mt-1">
                            — {item.content_snapshot.author}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 mt-4 sm:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedItem(item)}
                    className="min-h-[44px] touch-manipulation"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Review</span>
                    <span className="sm:hidden">View</span>
                  </Button>

                  {item.status === 'pending' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleModerationAction(item.id, 'approve')}
                        className="bg-green-600 hover:bg-green-700 min-h-[44px] touch-manipulation"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Approve</span>
                        <span className="sm:hidden">✓</span>
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleModerationAction(item.id, 'reject')}
                        className="min-h-[44px] touch-manipulation"
                      >
                        <X className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Reject</span>
                        <span className="sm:hidden">✗</span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="min-h-[44px] touch-manipulation">
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleModerationAction(item.id, 'escalate')}
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Escalate to Senior
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No items to moderate
              </h3>
              <p className="text-gray-600">
                {filter === 'pending' 
                  ? "All caught up! No pending reports to review." 
                  : `No ${filter} items found.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Review Modal would go here */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Content Review</h3>
              <Button variant="ghost" onClick={() => setSelectedItem(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Full Content</h4>
                <p className="whitespace-pre-wrap">{selectedItem.content_snapshot.content}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleModerationAction(selectedItem.id, 'approve', 'Approved after review')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleModerationAction(selectedItem.id, 'reject', 'Rejected - violates community guidelines')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleModerationAction(selectedItem.id, 'escalate', 'Escalated for senior review')}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Escalate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};