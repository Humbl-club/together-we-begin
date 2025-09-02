import React, { useEffect, useState } from 'react';
import { 
  ChevronDown, 
  Users, 
  Settings, 
  Plus, 
  Building,
  Shield,
  Palette,
  Zap,
  CreditCard,
  UserPlus,
  LayoutGrid,
  Type
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useMobileFirst } from '../../hooks/useMobileFirst';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationSwitcherProps {
  showCreateButton?: boolean;
  className?: string;
}

export const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  showCreateButton = true,
  className = ''
}) => {
  const { isMobile } = useMobileFirst();
  const navigate = useNavigate();
  const {
    currentOrganization,
    userMemberships,
    switchOrganization,
    userRole,
    isAdmin,
    isOwner,
    isSuperAdmin,
    organizationBranding,
    organizationTheme,
    loading,
    error
  } = useOrganization();

  const [switching, setSwitching] = useState<string | null>(null);
  const [activeTrialCount, setActiveTrialCount] = useState<number>(0);

  useEffect(() => {
    if (!isSuperAdmin) return;
    (async () => {
      const { count } = await supabase
        .from('platform_billing')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'trialing');
      setActiveTrialCount(count || 0);
    })();
  }, [isSuperAdmin]);

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrganization?.id) return;
    
    setSwitching(orgId);
    try {
      await switchOrganization(orgId);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to switch organization:', error);
    } finally {
      setSwitching(null);
    }
  };
  
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'moderator': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return '👑';
      case 'admin': return '⚡';
      case 'moderator': return '🛡️';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`w-full border-red-200 ${className}`}>
        <CardContent className="p-4">
          <div className="text-red-600 text-sm">
            Failed to load organizations: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentOrganization) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-4 text-center">
          <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm mb-3">No organization found</p>
          {showCreateButton && (
            <Button onClick={() => navigate('/organization/new')} size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`w-full justify-start p-0 h-auto ${className}`}
        >
          <Card className="w-full border-0 shadow-none hover:bg-gray-50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={organizationBranding?.logo_light_url || currentOrganization.logo_url} />
                    <AvatarFallback 
                      className="text-white"
                      style={{
                        backgroundColor: organizationTheme?.primary_color || '#8B5CF6'
                      }}
                    >
                      {currentOrganization.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {currentOrganization.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getRoleColor(userRole || 'member')}`}
                      >
                        {getRoleIcon(userRole || 'member')} {userRole}
                      </Badge>
                      {isSuperAdmin && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-purple-100 text-purple-800"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          Platform Admin
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {userMemberships.length} org{userMemberships.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className={`w-80 ${isMobile ? 'w-screen max-w-sm' : ''}`}
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-xs font-medium text-gray-500">
          Your Organizations
        </DropdownMenuLabel>
        
        {userMemberships.map((membership) => {
          const org = membership.organizations as any;
          const isCurrentOrg = org.id === currentOrganization.id;
          const isSwitching = switching === org.id;
          
          return (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSwitch(org.id)}
              className={`p-3 cursor-pointer ${isCurrentOrg ? 'bg-gray-50' : ''}`}
              disabled={isSwitching}
            >
              <div className="flex items-center space-x-3 w-full">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={org.logo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm">
                    {org.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium text-sm truncate ${isCurrentOrg ? 'text-gray-900' : 'text-gray-700'}`}>
                      {org.name}
                    </span>
                    {isCurrentOrg && (
                      <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getRoleColor(membership.role)}`}
                    >
                      {getRoleIcon(membership.role)} {membership.role}
                    </Badge>
                    <span className="text-xs text-gray-500 capitalize">
                      {org.subscription_tier}
                    </span>
                  </div>
                </div>
                {isSwitching && (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin shrink-0" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
        
        {showCreateButton && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => navigate('/organization/new')}
              className="p-3 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-3" />
              Create New Organization
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Admin Settings */}
        {isAdmin && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="p-3">
              <Settings className="w-4 h-4 mr-3" />
              Organization Settings
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              <DropdownMenuItem 
                onClick={() => handleNavigate('/admin/organization')}
                className="p-2 cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                General Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleNavigate('/admin/organization/branding')}
                className="p-2 cursor-pointer"
              >
                <Palette className="w-4 h-4 mr-2" />
                Branding & Logo
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleNavigate('/admin/organization/theme')}
                className="p-2 cursor-pointer"
              >
                <Palette className="w-4 h-4 mr-2" />
                Theme & Colors
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleNavigate('/admin/organization/typography')}
                className="p-2 cursor-pointer"
              >
                <Type className="w-4 h-4 mr-2" />
                Typography
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleNavigate('/admin/organization/features')}
                className="p-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 mr-2" />
                Features & Modules
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleNavigate('/admin/organization/dashboard')}
                className="p-2 cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Dashboard Layout
              </DropdownMenuItem>
              {isOwner && (
                <DropdownMenuItem 
                  onClick={() => handleNavigate('/admin/organization/billing')}
                  className="p-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing & Subscription
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        
        {/* Invite Members */}
        {isAdmin && (
          <DropdownMenuItem 
            onClick={() => handleNavigate('/admin/organization/invites')}
            className="p-3 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-3" />
            Invite Members
          </DropdownMenuItem>
        )}
        
        {/* Platform Admin Dashboard */}
        {isSuperAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleNavigate('/super-admin')}
              className="p-3 cursor-pointer text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <Shield className="w-4 h-4 mr-3" />
              <span className="flex items-center gap-2">
                Platform Admin Dashboard
                {activeTrialCount > 0 && (
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                    Trials {activeTrialCount}
                  </Badge>
                )}
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
