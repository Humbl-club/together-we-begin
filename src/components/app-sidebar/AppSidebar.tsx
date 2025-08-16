import React from 'react';
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
import { Home, CalendarDays, MessageCircle, Trophy, Users, TrendingUp } from 'lucide-react';

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
  const collapsed = state === 'collapsed';
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    cn(isActive ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50');

  const isExpanded = items.some((i) => i.url === location.pathname);

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
        <SidebarSeparator />
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
