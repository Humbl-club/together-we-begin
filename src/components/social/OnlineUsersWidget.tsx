import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserPresence } from '@/hooks/useUserPresence';
import { Users, Wifi, Activity } from 'lucide-react';

interface OnlineUsersWidgetProps {
  className?: string;
  maxUsers?: number;
  showActivity?: boolean;
}

export const OnlineUsersWidget: React.FC<OnlineUsersWidgetProps> = ({
  className,
  maxUsers = 8,
  showActivity = true
}) => {
  const { onlineUsers, getOnlineCount } = useUserPresence();

  const displayUsers = onlineUsers.slice(0, maxUsers);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500 text-white">Online</Badge>;
      case 'away':
        return <Badge className="bg-yellow-500 text-white">Away</Badge>;
      default:
        return <Badge variant="secondary">Offline</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wifi className="w-4 h-4 text-green-500" />
          Online Users
          <Badge variant="secondary" className="ml-auto">
            {getOnlineCount()}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {displayUsers.length === 0 ? (
          <div className="text-center py-4">
            <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No users online</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {displayUsers.map((user) => (
                <div key={user.user_id} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.profile?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {user.profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.profile?.full_name || 'Anonymous User'}
                    </p>
                    
                    {showActivity && user.activity && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Activity className="w-3 h-3" />
                        <span className="truncate">{user.activity}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(user.status)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.online_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {onlineUsers.length > maxUsers && (
          <div className="mt-3 pt-3 border-t text-center">
            <p className="text-xs text-muted-foreground">
              +{onlineUsers.length - maxUsers} more users online
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};