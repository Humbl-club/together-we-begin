import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useViewport } from '@/hooks/use-mobile';
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
  QrCode,
  MessageCircle
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
  const { isMobile, isTablet, isDesktop } = useViewport();

  const getInitials = (name?: string) => {
    return name?.split(' ').map(n => n[0]).join('') || 'AC';
  };

  const isActive = (path: string) => location.pathname === path;

  // Menu items with proper descriptions and grouping
  const menuItems = [
    { 
      href: '/profile', 
      icon: User, 
      label: 'Profile', 
      description: 'View and edit your profile',
      group: 'main'
    },
    { 
      href: '/messages', 
      icon: MessageCircle, 
      label: 'Messages', 
      description: 'Chat with community members',
      group: 'main'
    },
    { 
      href: '/qr-scanner', 
      icon: QrCode, 
      label: 'Scan QR Code', 
      description: 'Mark event attendance and earn points',
      group: 'tools'
    },
    { 
      href: '/settings', 
      icon: Settings, 
      label: 'Settings', 
      description: 'Customize your experience',
      group: 'tools'
    },
  ];

  if (isAdmin) {
    menuItems.splice(2, 0, { 
      href: '/admin', 
      icon: Shield, 
      label: 'Admin', 
      description: 'Manage the community',
      group: 'tools'
    });
  }

  // Responsive positioning and sizing
  const getDropdownProps = () => {
    if (isMobile) {
      return {
        side: "top" as const,
        align: "center" as const,
        sideOffset: 12,
        className: "w-80 mb-4 ml-2 mr-2 glass-modal-enhanced"
      };
    }
    return {
      side: "right" as const,
      align: "start" as const,
      sideOffset: 12,
      className: "w-72 glass-modal-enhanced"
    };
  };

  const dropdownProps = getDropdownProps();

  // Group menu items
  const mainItems = menuItems.filter(item => item.group === 'main');
  const toolItems = menuItems.filter(item => item.group === 'tools');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          onClick={() => haptics.impact('light')}
          className={`
            fixed z-50 glass-button-enhanced rounded-full flex items-center justify-center 
            shadow-2xl border-2 transition-all duration-500 
            bg-background/95 hover:bg-primary/15 hover:scale-110 active:scale-95 
            ring-2 ring-primary/20 hover:ring-primary/40 backdrop-blur-3xl
            ${isMobile ? 'bottom-28 left-5 w-16 h-16' : 'bottom-8 left-8 w-14 h-14'}
          `}
          aria-label="Open profile menu"
        >
          <Avatar className={`ring-2 ring-primary/30 shadow-lg ${isMobile ? 'w-14 h-14' : 'w-12 h-12'}`}>
            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/40 to-secondary/40 text-sm font-bold">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background shadow-sm animate-pulse"></div>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        {...dropdownProps}
        className={`
          ${dropdownProps.className}
          border-2 bg-background/98 backdrop-blur-3xl shadow-2xl 
          rounded-3xl p-3 border-border/40 animate-in fade-in-0 zoom-in-95 
          data-[state=closed]:animate-out data-[state=closed]:fade-out-0 
          data-[state=closed]:zoom-out-95 duration-300
        `}
      >
        {/* Profile Header */}
        <DropdownMenuLabel className="px-4 py-4 mb-2">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 ring-2 ring-primary/30 shadow-md">
              <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/40 to-secondary/40 text-sm font-bold">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base truncate">
                {profile?.full_name || 'Alexandra Collins'}
              </div>
              <div className="text-sm text-muted-foreground">
                Your wellness journey continues
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-2 bg-border/60" />
        
        {/* Main Items */}
        {mainItems.map(({ href, icon: Icon, label, description }) => (
          <DropdownMenuItem key={href} asChild>
            <Link 
              to={href}
              onClick={() => haptics.tap()}
              className={`
                flex items-center gap-4 p-4 rounded-2xl cursor-pointer 
                min-h-[60px] transition-all duration-300 hover:scale-[1.02]
                ${isActive(href) 
                  ? 'bg-primary/20 text-primary border border-primary/30 shadow-lg' 
                  : 'hover:bg-primary/10 active:bg-primary/15'
                }
              `}
            >
              <div className={`
                w-12 h-12 rounded-2xl flex items-center justify-center transition-all
                ${isActive(href) 
                  ? 'bg-primary/30 text-primary shadow-lg' 
                  : 'bg-muted/30 hover:bg-primary/20'
                }
              `}>
                <Icon className="w-6 h-6" strokeWidth={isActive(href) ? 2.5 : 2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{label}</div>
                <div className="text-xs text-muted-foreground truncate">{description}</div>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
        
        {toolItems.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-3 bg-border/60" />
            
            {/* Tool Items */}
            {toolItems.map(({ href, icon: Icon, label, description }) => (
              <DropdownMenuItem key={href} asChild>
                <Link 
                  to={href}
                  onClick={() => haptics.tap()}
                  className={`
                    flex items-center gap-4 p-4 rounded-2xl cursor-pointer 
                    min-h-[60px] transition-all duration-300 hover:scale-[1.02]
                    ${isActive(href) 
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-lg' 
                      : 'hover:bg-primary/10 active:bg-primary/15'
                    }
                  `}
                >
                  <div className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center transition-all
                    ${isActive(href) 
                      ? 'bg-primary/30 text-primary shadow-lg' 
                      : 'bg-muted/30 hover:bg-primary/20'
                    }
                  `}>
                    <Icon className="w-6 h-6" strokeWidth={isActive(href) ? 2.5 : 2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{label}</div>
                    <div className="text-xs text-muted-foreground truncate">{description}</div>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator className="my-3 bg-border/60" />
        
        {/* Sign Out */}
        <DropdownMenuItem asChild>
          <button 
            onClick={() => {
              haptics.impact('medium');
              signOut();
            }}
            className="
              flex items-center gap-4 p-4 rounded-2xl cursor-pointer w-full text-left 
              text-destructive hover:bg-destructive/10 active:bg-destructive/15 
              min-h-[60px] transition-all duration-300 hover:scale-[1.02]
              border border-transparent hover:border-destructive/20
            "
          >
            <div className="w-12 h-12 rounded-2xl bg-destructive/20 flex items-center justify-center hover:bg-destructive/30 transition-colors">
              <LogOut className="w-6 h-6" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">Sign Out</div>
              <div className="text-xs text-muted-foreground">Securely sign out of your account</div>
            </div>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};