import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useViewport, useResponsiveValue } from '@/hooks/use-mobile';

interface Profile {
  full_name?: string;
  avatar_url?: string;
}

interface DashboardHeaderProps {
  profile: Profile;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ profile }) => {
  const { isMobile, isTablet } = useViewport();
  
  // Responsive values
  const avatarSize = useResponsiveValue({
    mobile: 'avatar-responsive-md',
    tablet: 'avatar-responsive-md',
    desktop: 'avatar-responsive-lg',
    default: 'h-16 w-16'
  });

  const headingSize = useResponsiveValue({
    mobile: 'text-xl',
    tablet: 'text-2xl',
    desktop: 'text-3xl',
    default: 'text-3xl'
  });
  
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

  return (
    <div className="relative">
      <div className="flex-responsive mobile:text-center mobile:space-y-4 sm:justify-between">
        <div className="flex-responsive mobile:text-center">
          <Avatar className={`${avatarSize} border-2 border-primary/20 ring-2 ring-primary/10`}>
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 mobile:text-base sm:text-lg font-medium">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="mobile:text-center sm:text-left">
            <h1 className={`${headingSize} font-light tracking-tight text-foreground leading-tight`}>
              {getGreeting()}, {getFirstName(profile?.full_name)}
            </h1>
            <p className="text-muted-foreground mt-1 font-light mobile:text-sm sm:text-base">
              Your wellness journey continues
            </p>
          </div>
        </div>
        
        <Button 
          className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all duration-200 mobile:w-full sm:w-auto btn-responsive" 
          size={isMobile ? "sm" : "default"}
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="mobile:text-sm sm:text-base">Share Update</span>
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;