import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  Building2, 
  Users, 
  Activity, 
  DollarSign,
  AlertTriangle,
  Calendar,
  MapPin,
  Globe,
  Mail,
  Phone,
  Settings,
  Ban,
  CheckCircle,
  Eye,
  BarChart3,
  MessageSquare,
  Trophy,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
  subscription_tier: string;
  health_score: number;
  risk_level: string;
  member_count: number;
  owner_name: string;
  owner_email: string;
  created_at: string;
  last_activity_at: string;
  total_revenue_cents: number;
  custom_domain?: string;
  location?: string;
}

interface OrganizationDetails {
  organization: any;
  member_count: number;
  admin_count: number;
  recent_activity: any[];
  billing_info: any;
  health_score: any;
}

interface OrganizationDetailModalProps {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orgId: string, newStatus: string) => Promise<void>;
}

export const OrganizationDetailModal: React.FC<OrganizationDetailModalProps> = ({
  organization,
  isOpen,
  onClose,
  onStatusChange
}) => {
  const [details, setDetails] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && organization) {
      loadOrganizationDetails();
    }
  }, [isOpen, organization?.id]);

  const loadOrganizationDetails = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('get_organization_admin_details', {
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        org_id: organization.id
      });

      if (error) throw error;
      setDetails(data);

    } catch (error) {
      console.error('Error loading organization details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <div>{organization.name}</div>
              <div className="text-sm font-normal text-gray-600">
                Organization Details & Management
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                {/* Organization Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Organization Information</span>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(organization.status)}>
                          {organization.status}
                        </Badge>
                        <Badge className={getRiskColor(organization.risk_level)}>
                          Risk: {organization.risk_level}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Organization Name</label>
                          <div className="font-semibold">{organization.name}</div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Slug</label>
                          <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {organization.slug}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Owner</label>
                          <div>
                            <div className="font-semibold">{organization.owner_name}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {organization.owner_email}
                            </div>
                          </div>
                        </div>

                        {organization.location && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Location</label>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              {organization.location}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Subscription Tier</label>
                          <Badge className="capitalize">{organization.subscription_tier}</Badge>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Created</label>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(organization.created_at)}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Last Activity</label>
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4 text-gray-400" />
                            {formatDate(organization.last_activity_at)}
                          </div>
                        </div>

                        {organization.custom_domain && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Custom Domain</label>
                            <div className="flex items-center gap-1">
                              <Globe className="w-4 h-4 text-gray-400" />
                              <a 
                                href={`https://${organization.custom_domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {organization.custom_domain}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div>
                          <div className="text-2xl font-bold">{details?.member_count || 0}</div>
                          <div className="text-sm text-gray-600">Total Members</div>
                          <div className="text-xs text-gray-500">
                            {details?.admin_count || 0} admins
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-green-600" />
                        <div>
                          <div className="text-2xl font-bold">
                            {formatCurrency(organization.total_revenue_cents)}
                          </div>
                          <div className="text-sm text-gray-600">Total Revenue</div>
                          <div className="text-xs text-gray-500">Lifetime</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-purple-600" />
                        <div>
                          <div className="text-2xl font-bold">{organization.health_score}/100</div>
                          <div className="text-sm text-gray-600">Health Score</div>
                          <div className="text-xs text-gray-500 capitalize">
                            {organization.risk_level} risk
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      {organization.status === 'active' ? (
                        <Button
                          variant="destructive"
                          onClick={() => onStatusChange(organization.id, 'suspended')}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Suspend Organization
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          onClick={() => onStatusChange(organization.id, 'active')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Activate Organization
                        </Button>
                      )}

                      <Button variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Settings
                      </Button>

                      <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View as Member
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Member Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{details?.member_count || 0}</div>
                        <div className="text-gray-600">Total Members</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{details?.admin_count || 0}</div>
                        <div className="text-gray-600">Administrators</div>
                      </div>
                    </div>
                    
                    <Button>
                      <Users className="w-4 h-4 mr-2" />
                      View All Members
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {details?.recent_activity?.length ? (
                      details.recent_activity.map((activity: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{activity.title}</div>
                            <div className="text-sm text-gray-600">{formatDate(activity.date)}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="text-gray-600">No recent activity</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Billing Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {details?.billing_info ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Subscription</label>
                          <div className="capitalize font-semibold">
                            {details.billing_info.subscription_tier} - {details.billing_info.billing_cycle}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Status</label>
                          <Badge className={getStatusColor(details.billing_info.status)}>
                            {details.billing_info.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Current Period</label>
                          <div>
                            {formatDate(details.billing_info.current_period_start)} - {formatDate(details.billing_info.current_period_end)}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Amount</label>
                          <div className="font-semibold">
                            {formatCurrency(details.billing_info.amount_cents)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <div className="text-gray-600">No billing information available</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">{organization.health_score}/100</div>
                      <div className="text-gray-600">Overall Health Score</div>
                    </div>

                    {details?.health_score && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Engagement</label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${details.health_score.engagement_score}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{details.health_score.engagement_score}/100</span>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-600">Growth</label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${details.health_score.growth_score}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{details.health_score.growth_score}/100</span>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-600">Retention</label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-500 h-2 rounded-full"
                                  style={{ width: `${details.health_score.retention_score}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{details.health_score.retention_score}/100</span>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-600">Content Quality</label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-orange-500 h-2 rounded-full"
                                  style={{ width: `${details.health_score.content_quality_score}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{details.health_score.content_quality_score}/100</span>
                            </div>
                          </div>
                        </div>

                        {details.health_score.recommendations?.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Recommendations</h4>
                            <ul className="space-y-1">
                              {details.health_score.recommendations.map((rec: string, index: number) => (
                                <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                                  <TrendingUp className="w-3 h-3 text-blue-500" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};