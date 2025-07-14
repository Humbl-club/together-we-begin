import React, { memo, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useViewport } from '@/hooks/use-mobile';
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
    <div className="glass-card-enhanced p-6 mb-6 relative">
      <div className={`${isMobile ? 'flex flex-col space-y-4 text-center' : 'cluster justify-between'}`}>
        <div className={`${isMobile ? 'flex flex-col items-center space-y-3' : 'cluster'}`}>
          <Avatar className={`${isMobile ? 'w-16 h-16' : 'w-12 h-12 md:w-16 md:h-16'} border-2 border-primary/20 ring-2 ring-primary/10`}>
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-sm md:text-lg font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className={isMobile ? 'text-center' : ''}>
            <h1 className={`${isMobile ? 'text-xl' : 'fluid-heading'} font-medium`}>
              {greeting}, {firstName}
            </h1>
            <p className={`${isMobile ? 'text-sm' : 'fluid-body'} text-muted-foreground`}>
              Your wellness journey continues
            </p>
          </div>
        </div>
        
        <Button 
          onClick={() => navigate('/social')}
          className={`${isMobile ? 'w-full min-h-[48px]' : 'modern-button'} glass-button bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all`}
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className={isMobile ? 'text-base' : ''}>Share Update</span>
        </Button>
      </div>
    </div>
  );
});

export default DashboardHeader;