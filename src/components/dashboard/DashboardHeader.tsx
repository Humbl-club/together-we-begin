import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Profile {
  full_name?: string;
  avatar_url?: string;
}

interface DashboardHeaderProps {
  profile: Profile;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ profile }) => {
  const isMobile = useIsMobile();
  
  const getInitials = (name?: string) => {
    return name?.split(' ').map(n => n[0]).join('') || 'AC';
  };

  const getFirstName = (name?: string) => {
    return name?.split(' ')[0] || 'Alexandra';
  };

  return (
    <div className="relative">
      <div className={`flex items-center ${isMobile ? 'flex-col space-y-4' : 'justify-between'}`}>
        <div className={`flex items-center ${isMobile ? 'flex-col space-y-3 text-center' : 'space-x-4'}`}>
          <Avatar className={`${isMobile ? 'h-12 w-12' : 'h-16 w-16'} border-2 border-primary/20`}>
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
            <AvatarFallback className={`bg-gradient-to-br from-primary/20 to-secondary/20 ${isMobile ? 'text-base' : 'text-lg'} font-medium`}>
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-light tracking-tight text-foreground`}>
              Good morning, {getFirstName(profile?.full_name)}
            </h1>
            <p className={`text-muted-foreground mt-1 font-light ${isMobile ? 'text-sm' : ''}`}>
              Your wellness journey continues
            </p>
          </div>
        </div>
        <Button className={`bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 ${isMobile ? 'w-full' : ''}`} size={isMobile ? "sm" : "default"}>
          <Plus className="w-4 h-4 mr-2" />
          Share Update
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;