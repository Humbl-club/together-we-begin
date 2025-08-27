import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { 
  Building2, 
  Users, 
  Activity, 
  DollarSign,
  Settings,
  Eye,
  UserPlus,
  BarChart3,
  Shield,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../auth/AuthProvider';

interface OrganizationAdminData {
  organization: {
    id: string;
    name: string;
    slug: string;
    status: string;
    subscription_tier: string;
    created_at: string;
    owner_name: string;
  };
  stats: {
    member_count: number;
    recent_activity: number;
    total_revenue_cents: number;
  };
  permissions: {
    can_manage_members: boolean;
    can_moderate_content: boolean;
    can_manage_events: boolean;
    can_view_analytics: boolean;
    can_manage_billing: boolean;
  };
}

interface OrganizationMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  joined_at: string;
  last_seen: string;
  is_active: boolean;
}

export const OrganizationAdminDropdown: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [adminData, setAdminData] = useState<OrganizationAdminData | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings'>('overview');

  useEffect(() => {
    if (user && isAdmin) {
      loadAdminData();
    }
  }, [user, isAdmin]);

  const loadAdminData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Get organization admin data
      const { data: orgData, error: orgError } = await supabase.rpc(
        'get_organization_admin_data',
        { user_id: user.id }
      );

      if (orgError) throw orgError;
      setAdminData(orgData);

      // Get organization members
      const { data: membersData, error: membersError } = await supabase.rpc(
        'get_organization_members_for_admin',
        { user_id: user.id }
      );

      if (membersError) throw membersError;
      setMembers(membersData || []);

    } catch (error) {
      console.error('Error loading admin data:', error);
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
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return null; // Don't show anything if user is not an admin
  }

  if (loading) {
    return (
      <div className="w-96 max-w-full">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="w-96 max-w-full">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">No organization found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-96 max-w-full max-h-[80vh] overflow-y-auto">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">{adminData.organization.name}</CardTitle>
              <p className="text-sm text-gray-600">Organization Admin Panel</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(adminData.organization.status)}>
              {adminData.organization.status}
            </Badge>
            <Badge className={getTierColor(adminData.organization.subscription_tier)}>
              {adminData.organization.subscription_tier}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {/* Tab Navigation */}
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Members</p>
                      <p className="text-2xl font-bold text-blue-900">{adminData.stats.member_count}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Recent Activity</p>
                      <p className="text-2xl font-bold text-green-900">{adminData.stats.recent_activity}</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Total Revenue</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatCurrency(adminData.stats.total_revenue_cents)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="justify-start">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Post Update
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Organization Members</p>
                <Button size="sm" variant="outline">
                  <UserPlus className="w-4 h-4 mr-1" />
                  Invite
                </Button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={undefined} />
                        <AvatarFallback className="text-xs">
                          {member.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{member.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                      {!member.is_active && (
                        <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {members.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No members found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Organization Settings</p>
                
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    General Settings
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Privacy & Moderation
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Billing & Subscription
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    Advanced Analytics
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2 text-xs text-gray-600">
                  <p><span className="font-medium">Created:</span> {formatDate(adminData.organization.created_at)}</p>
                  <p><span className="font-medium">Owner:</span> {adminData.organization.owner_name}</p>
                  <p><span className="font-medium">Slug:</span> /{adminData.organization.slug}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};