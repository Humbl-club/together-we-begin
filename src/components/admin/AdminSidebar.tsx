import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  BarChart3,
  Users,
  Shield,
  MessageSquare,
  Calendar,
  Trophy,
  Settings,
  Activity,
  Mail,
  Flag,
  Key,
  Bell
} from 'lucide-react';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const adminSections = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'analytics', label: 'Analytics', icon: Activity },
    ]
  },
  {
    group: 'Community Management',
    items: [
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'moderation', label: 'Content Moderation', icon: Flag },
      { id: 'invites', label: 'Invite System', icon: Key },
    ]
  },
  {
    group: 'Content Management',
    items: [
      { id: 'events', label: 'Events', icon: Calendar },
      { id: 'challenges', label: 'Challenges', icon: Trophy },
      { id: 'posts', label: 'Posts', icon: MessageSquare },
    ]
  },
  {
    group: 'System',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'settings', label: 'System Settings', icon: Settings },
    ]
  }
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  activeSection, 
  onSectionChange 
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      className={isCollapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent>
        {adminSections.map((section) => (
          <SidebarGroup key={section.group}>
            <SidebarGroupLabel>{!isCollapsed && section.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => onSectionChange(item.id)}
                      className={activeSection === item.id ? 
                        "bg-primary text-primary-foreground" : 
                        "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};