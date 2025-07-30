import React, { memo, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Bell, Search, MessageCircle } from 'lucide-react';
import { useViewport } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useNavigate } from 'react-router-dom';
import { MessagingOverlay } from '@/components/messaging/MessagingOverlay';
import { useMessaging } from '@/hooks/useMessaging';

interface Profile {
  full_name?: string;
  avatar_url?: string;
}

interface DashboardHeaderProps {
  profile: Profile;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = memo(({ profile }) => {
  const { isMobile } = useViewport();
  const navigate = useNavigate();
  const haptics = useHapticFeedback();
  const [showMessaging, setShowMessaging] = useState(false);
  const { totalUnreadCount } = useMessaging();
  
  const { initials, firstName, greeting } = useMemo(() => {
    const getInitials = (name?: string) => {
      return name?.split(' ').map(n => n[0]).join('') || 'AC';
    };

    const getFirstName = (name?: string) => {
      return name?.split(' ')[0] || 'Alexandra';
    };

    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      return 'Good evening';
    };

    return {
      initials: getInitials(profile?.full_name),
      firstName: getFirstName(profile?.full_name),
      greeting: getGreeting()
    };
  }, [profile?.full_name]);

  if (isMobile) {
    return (
      <div className="glass-card-enhanced p-6 mb-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate mb-2">
              {greeting}!
            </h1>
            <p className="text-lg text-primary font-semibold truncate mb-2">
              Welcome back, {firstName}
            </p>
            <Badge variant="secondary" className="text-sm bg-primary/10 text-primary">
              Your wellness journey continues
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => {
                haptics.tap();
                setShowMessaging(true);
              }}
              className="w-12 h-12 rounded-full glass-button relative"
            >
              <MessageCircle className="w-5 h-5" />
              {totalUnreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 min-w-5 text-xs font-bold border-2 border-background"
                >
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </Badge>
              )}
            </Button>
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => {
                haptics.tap();
                navigate('/search');
              }}
              className="w-12 h-12 rounded-full glass-button"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => {
                haptics.tap();
                navigate('/notifications');
              }}
              className="w-12 h-12 rounded-full glass-button relative"
            >
              <Bell className="w-5 h-5" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
            </Button>
            <Button 
              onClick={() => {
                haptics.impact('medium');
                navigate('/social');
              }}
              className="w-12 h-12 rounded-full glass-button bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-all shadow-lg"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
        
        <MessagingOverlay 
          isOpen={showMessaging} 
          onClose={() => setShowMessaging(false)} 
        />
      </div>
    );
  }

  // Desktop version - without redundant avatar
  return (
    <div className="glass-card-enhanced p-6 mb-6 relative">
        <div className="cluster justify-between">
          <div>
            <h1 className="fluid-heading font-medium">
              {greeting}, {firstName}
            </h1>
            <p className="fluid-body text-muted-foreground">
              Your wellness journey continues
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => {
                haptics.tap();
                setShowMessaging(true);
              }}
              className="glass-button bg-background/60 border-border/40 hover:bg-background/80 relative"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Messages
              {totalUnreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-2 h-4 min-w-4 text-xs"
                >
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </Badge>
              )}
            </Button>
            
            <Button 
              onClick={() => {
                haptics.impact('medium');
                navigate('/social');
              }}
              className="modern-button glass-button bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Share Update
            </Button>
          </div>
        </div>
        
        <MessagingOverlay 
          isOpen={showMessaging} 
          onClose={() => setShowMessaging(false)} 
        />
    </div>
  );
});

export default DashboardHeader;