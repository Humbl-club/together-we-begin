import React, { memo, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Bell, Search, MessageCircle } from 'lucide-react';
import { useMobileFirst } from '@/hooks/useMobileFirst';
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
  const { isMobile } = useMobileFirst();
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
      <div className="card-primary p-4 mb-4 mx-1 rounded-2xl">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground mb-1 leading-tight">
              {greeting}!
            </h1>
            <p className="text-base font-medium text-primary mb-3 leading-tight">
              Welcome back, {firstName}
            </p>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-1">
              Your wellness journey continues
            </Badge>
          </div>
          
          <div className="flex items-start gap-2 flex-shrink-0">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => {
                haptics.tap();
                setShowMessaging(true);
              }}
              className="w-10 h-10 rounded-full button-glass relative touch-feedback"
            >
              <MessageCircle className="w-5 h-5" />
              {totalUnreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 min-w-4 text-xs font-bold border border-background text-[10px] px-1"
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
              className="w-10 h-10 rounded-full card-accent text-primary hover:scale-105 touch-feedback"
            >
              <Plus className="w-5 h-5" />
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

  // Desktop version - unified design
  return (
    <div className="card-primary p-6 mb-6 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {greeting}, {firstName}
            </h1>
            <p className="text-muted-foreground mt-1">
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
              className="button-glass hover:card-secondary relative"
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
              className="card-accent text-primary hover:scale-105 transition-all"
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