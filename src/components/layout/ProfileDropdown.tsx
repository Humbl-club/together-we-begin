import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { 
  User, 
  Settings, 
  LogOut,
  Shield,
  QrCode
} from 'lucide-react';

interface ProfileDropdownProps {
  profile: {
    full_name?: string;
    avatar_url?: string;
  };
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ profile }) => {
  const { signOut, isAdmin } = useAuth();
  const location = useLocation();
  const haptics = useHapticFeedback();

  const getInitials = (name?: string) => {
    return name?.split(' ').map(n => n[0]).join('') || 'AC';
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { href: '/profile', icon: User, label: 'Profile', description: 'View and edit your profile' },
    { href: '/qr-scanner', icon: QrCode, label: 'Scan QR Code', description: 'Mark event attendance' },
    { href: '/settings', icon: Settings, label: 'Settings', description: 'Customize your experience' },
  ];

  if (isAdmin) {
    menuItems.splice(2, 0, { 
      href: '/admin', 
      icon: Shield, 
      label: 'Admin', 
      description: 'Manage the community' 
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          onClick={() => haptics.impact('light')}
          className="fixed bottom-28 left-5 z-40 glass-button rounded-full flex items-center justify-center shadow-2xl border-2 transition-all duration-500 bg-background/90 hover:bg-primary/20 hover:scale-110 active:scale-95 hover:shadow-2xl ring-2 ring-primary/10 hover:ring-primary/30"
        >
          <Avatar className="w-14 h-14 ring-2 ring-primary/20 shadow-lg">
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-sm font-bold">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background shadow-sm"></div>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        side="top" 
        align="center"
        sideOffset={8}
        className="w-72 mb-2 ml-4 glass-modal border-2 bg-background/98 backdrop-blur-3xl shadow-2xl rounded-2xl p-2"
      >
        <DropdownMenuLabel className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-sm font-bold">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-base">{profile?.full_name || 'Alexandra'}</div>
              <div className="text-sm text-muted-foreground">Your wellness journey</div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-2" />
        
        {menuItems.map(({ href, icon: Icon, label, description }) => (
          <DropdownMenuItem key={href} asChild>
            <Link 
              to={href}
              onClick={() => haptics.tap()}
              className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer min-h-[56px] ${
                isActive(href) ? 'bg-primary/20 text-primary' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator className="my-2" />
        
        <DropdownMenuItem asChild>
          <button 
            onClick={() => {
              haptics.impact('medium');
              signOut();
            }}
            className="flex items-center gap-3 p-4 rounded-xl cursor-pointer w-full text-left text-destructive hover:bg-destructive/10 min-h-[56px]"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Sign Out</div>
              <div className="text-xs text-muted-foreground">Securely sign out</div>
            </div>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};