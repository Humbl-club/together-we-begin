import React, { memo, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useViewport } from '@/hooks/use-mobile';

interface Profile {
  full_name?: string;
  avatar_url?: string;
}

interface DashboardHeaderProps {
  profile: Profile;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = memo(({ profile }) => {
  const { isMobile } = useViewport();
  
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

  return (
    <div className="relative">
      <div className="cluster justify-between">
        <div className="cluster">
          <Avatar className={`w-12 h-12 md:w-16 md:h-16 border-2 border-primary/20 ring-2 ring-primary/10`}>
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-sm md:text-lg font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="fluid-heading">
              {greeting}, {firstName}
            </h1>
            <p className="fluid-body text-muted-foreground">
              Your wellness journey continues
            </p>
          </div>
        </div>
        
        <Button className="modern-button bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          <span>Share Update</span>
        </Button>
      </div>
    </div>
  );
});

export default DashboardHeader;