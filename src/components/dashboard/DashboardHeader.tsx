import React, { memo, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Bell, Search } from 'lucide-react';
import { useViewport } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useNavigate } from 'react-router-dom';

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
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="w-16 h-16 ring-3 ring-primary/20 shadow-lg">
                <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-background shadow-sm animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight truncate mb-1">
                {greeting}!
              </h1>
              <p className="text-base text-primary font-semibold truncate">
                {firstName}
              </p>
              <Badge variant="secondary" className="text-xs mt-1 bg-primary/10 text-primary">
                Your wellness journey continues
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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
      </div>
    );
  }

  // Desktop version
  return (
    <div className="glass-card-enhanced p-6 mb-6 relative">
      <div className="cluster justify-between">
        <div className="cluster">
          <Avatar className="w-12 h-12 md:w-16 md:h-16 border-2 border-primary/20 ring-2 ring-primary/10">
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-sm md:text-lg font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="fluid-heading font-medium">
              {greeting}, {firstName}
            </h1>
            <p className="fluid-body text-muted-foreground">
              Your wellness journey continues
            </p>
          </div>
        </div>
        
        <Button 
          onClick={() => navigate('/social')}
          className="modern-button glass-button bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Share Update
        </Button>
      </div>
    </div>
  );
});

export default DashboardHeader;