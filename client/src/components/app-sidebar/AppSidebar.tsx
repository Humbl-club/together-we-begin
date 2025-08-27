import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Home, CalendarDays, MessageCircle, Trophy, Users, TrendingUp, Settings, Shield, ChevronDown, Building2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { OrganizationAdminDropdown } from '@/components/admin/OrganizationAdminDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const items = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Insights', url: '/insights', icon: TrendingUp },
  { title: 'Social', url: '/social', icon: Users },
  { title: 'Events', url: '/events', icon: CalendarDays },
  { title: 'Messages', url: '/messages', icon: MessageCircle },
  { title: 'Challenges', url: '/challenges', icon: Trophy },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { isOrganizationAdmin, isSuperAdmin } = useAuth();
  const [showOrgAdmin, setShowOrgAdmin] = useState(false);
  const collapsed = state === 'collapsed';
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    cn(isActive ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50');

  return (
    <Sidebar variant="floating" collapsible="icon" className="glass-nav bg-card/80 text-card-foreground border-r border-border/40">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs tracking-wide uppercase text-muted-foreground">Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url} className="rounded-lg">
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Admin Section */}
        {(isOrganizationAdmin || isSuperAdmin) && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs tracking-wide uppercase text-muted-foreground">Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Organization Admin Dropdown */}
                  {isOrganizationAdmin && (
                    <SidebarMenuItem>
                      <DropdownMenu open={showOrgAdmin} onOpenChange={setShowOrgAdmin}>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton className="rounded-lg">
                            <Building2 className="mr-2 h-4 w-4" />
                            {!collapsed && (
                              <>
                                <span>Manage Club</span>
                                <ChevronDown className="ml-auto h-4 w-4" />
                              </>
                            )}
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side={collapsed ? "right" : "bottom"} align="start" className="w-auto">
                          <OrganizationAdminDropdown />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  )}

                  {/* Super Admin Link (YOU - Platform Owner) */}
                  {isSuperAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location.pathname === '/super-admin'} className="rounded-lg">
                        <NavLink to="/super-admin" className={getNavCls}>
                          <Shield className="mr-2 h-4 w-4" />
                          {!collapsed && <span>Platform Admin</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
        
        <SidebarSeparator />
        
        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/settings'} className="rounded-lg">
                  <NavLink to="/settings" className={getNavCls}>
                    <Settings className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
