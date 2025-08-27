import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { 
  Plus, 
  Calendar, 
  Users, 
  MessageCircle, 
  Trophy, 
  Gift, 
  Settings, 
  Bell,
  MapPin,
  Camera,
  QrCode,
  Heart,
  Star,
  Share2,
  Edit3
} from 'lucide-react';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { useMobileFirst } from '../../../hooks/useMobileFirst';

interface QuickActionsWidgetProps {
  configuration: {
    actions?: string[];
    showLabels?: boolean;
    iconSize?: 'small' | 'medium' | 'large';
    layout?: 'grid' | 'list' | 'compact';
  };
  size: 'small' | 'medium' | 'large' | 'full';
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description?: string;
  isNew?: boolean;
  onClick: () => void;
}

const ALL_ACTIONS: Record<string, Omit<QuickAction, 'onClick'>> = {
  create_event: {
    id: 'create_event',
    label: 'Create Event',
    icon: <Calendar className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Schedule a new event'
  },
  create_post: {
    id: 'create_post',
    label: 'New Post',
    icon: <Edit3 className="w-5 h-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Share with the community'
  },
  invite_members: {
    id: 'invite_members',
    label: 'Invite Friends',
    icon: <Users className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Add new members'
  },
  start_challenge: {
    id: 'start_challenge',
    label: 'New Challenge',
    icon: <Trophy className="w-5 h-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Create wellness challenge'
  },
  scan_qr: {
    id: 'scan_qr',
    label: 'Scan QR',
    icon: <QrCode className="w-5 h-5" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    description: 'Check-in or join'
  },
  take_photo: {
    id: 'take_photo',
    label: 'Take Photo',
    icon: <Camera className="w-5 h-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    description: 'Capture moment'
  },
  send_message: {
    id: 'send_message',
    label: 'Message',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    description: 'Start conversation'
  },
  check_rewards: {
    id: 'check_rewards',
    label: 'Rewards',
    icon: <Gift className="w-5 h-5" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: 'View available rewards'
  },
  find_location: {
    id: 'find_location',
    label: 'Find Events',
    icon: <MapPin className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Events near you'
  },
  share_app: {
    id: 'share_app',
    label: 'Share App',
    icon: <Share2 className="w-5 h-5" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Tell friends about us'
  },
  notifications: {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Check updates'
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'App preferences'
  }
};

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ 
  configuration = {}, 
  size 
}) => {
  const { currentOrganization } = useOrganization();
  const { isMobile } = useMobileFirst();
  const [recentActions, setRecentActions] = useState<string[]>([]);

  const {
    actions = size === 'small' 
      ? ['create_post', 'scan_qr', 'invite_members', 'take_photo']
      : size === 'medium'
        ? ['create_event', 'create_post', 'invite_members', 'start_challenge', 'scan_qr', 'check_rewards']
        : ['create_event', 'create_post', 'invite_members', 'start_challenge', 'scan_qr', 'take_photo', 'check_rewards', 'find_location'],
    showLabels = size !== 'small',
    iconSize = 'medium',
    layout = size === 'small' ? 'compact' : 'grid'
  } = configuration;

  const handleAction = (actionId: string) => {
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10]);
    }

    // Track recent actions
    setRecentActions(prev => [
      actionId,
      ...prev.filter(id => id !== actionId).slice(0, 2)
    ]);

    // Handle different actions
    switch (actionId) {
      case 'create_event':
        // Navigate to event creation
        console.log('Creating event...');
        break;
      case 'create_post':
        // Open post composer
        console.log('Creating post...');
        break;
      case 'invite_members':
        // Open invite modal
        console.log('Inviting members...');
        break;
      case 'start_challenge':
        // Navigate to challenge creation
        console.log('Starting challenge...');
        break;
      case 'scan_qr':
        // Open QR scanner
        if ('mediaDevices' in navigator) {
          console.log('Opening QR scanner...');
        }
        break;
      case 'take_photo':
        // Open camera
        if ('mediaDevices' in navigator) {
          console.log('Opening camera...');
        }
        break;
      case 'send_message':
        // Open messaging
        console.log('Opening messages...');
        break;
      case 'check_rewards':
        // Navigate to rewards
        console.log('Checking rewards...');
        break;
      case 'find_location':
        // Open location finder
        console.log('Finding nearby events...');
        break;
      case 'share_app':
        // Web Share API
        if ('share' in navigator) {
          navigator.share({
            title: `${currentOrganization?.name || 'Girls Club'}`,
            text: 'Join our amazing community!',
            url: window.location.origin
          });
        }
        break;
      case 'notifications':
        // Open notifications
        console.log('Opening notifications...');
        break;
      case 'settings':
        // Navigate to settings
        console.log('Opening settings...');
        break;
      default:
        console.log(`Action ${actionId} not implemented`);
    }
  };

  const getIconSize = () => {
    switch (iconSize) {
      case 'small': return 'w-4 h-4';
      case 'large': return 'w-6 h-6';
      default: return 'w-5 h-5';
    }
  };

  const getButtonSize = () => {
    if (layout === 'compact') return 'p-2';
    return size === 'small' ? 'p-3' : 'p-4';
  };

  const renderCompactLayout = () => (
    <div className="grid grid-cols-4 gap-2">
      {actions.slice(0, 8).map((actionId) => {
        const action = ALL_ACTIONS[actionId];
        if (!action) return null;

        const isRecent = recentActions.includes(actionId);

        return (
          <Button
            key={actionId}
            variant="ghost"
            size="sm"
            className={`${getButtonSize()} ${action.bgColor} ${action.color} hover:opacity-80 flex-col gap-1 h-auto relative`}
            onClick={() => handleAction(actionId)}
          >
            {isRecent && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
            
            <div className={getIconSize()}>
              {React.cloneElement(action.icon as React.ReactElement, {
                className: getIconSize()
              })}
            </div>
            
            {showLabels && (
              <span className="text-xs font-medium leading-tight">
                {action.label}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );

  const renderGridLayout = () => (
    <div className={`grid gap-3 ${
      size === 'large' || size === 'full' 
        ? 'grid-cols-3 lg:grid-cols-4' 
        : size === 'medium' 
          ? 'grid-cols-3' 
          : 'grid-cols-2'
    }`}>
      {actions.map((actionId) => {
        const action = ALL_ACTIONS[actionId];
        if (!action) return null;

        const isRecent = recentActions.includes(actionId);

        return (
          <Button
            key={actionId}
            variant="outline"
            className={`${getButtonSize()} h-auto flex-col gap-2 relative hover:shadow-md transition-all border-gray-200`}
            onClick={() => handleAction(actionId)}
          >
            {isRecent && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 w-5 h-5 p-0 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <div className="w-2 h-2 rounded-full bg-white" />
              </Badge>
            )}
            
            <div className={`${action.bgColor} ${action.color} p-3 rounded-lg`}>
              {React.cloneElement(action.icon as React.ReactElement, {
                className: getIconSize()
              })}
            </div>
            
            {showLabels && (
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  {action.label}
                </div>
                {action.description && size === 'large' && (
                  <div className="text-xs text-gray-500 mt-1">
                    {action.description}
                  </div>
                )}
              </div>
            )}
          </Button>
        );
      })}
    </div>
  );

  const renderListLayout = () => (
    <div className="space-y-2">
      {actions.map((actionId) => {
        const action = ALL_ACTIONS[actionId];
        if (!action) return null;

        const isRecent = recentActions.includes(actionId);

        return (
          <Button
            key={actionId}
            variant="ghost"
            className="w-full justify-start p-3 h-auto hover:bg-gray-50"
            onClick={() => handleAction(actionId)}
          >
            <div className="flex items-center gap-3 w-full">
              <div className={`${action.bgColor} ${action.color} p-2 rounded-lg shrink-0`}>
                {React.cloneElement(action.icon as React.ReactElement, {
                  className: 'w-4 h-4'
                })}
              </div>
              
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{action.label}</div>
                {action.description && (
                  <div className="text-xs text-gray-500">{action.description}</div>
                )}
              </div>

              {isRecent && (
                <Badge variant="secondary" className="text-xs">
                  Recent
                </Badge>
              )}
            </div>
          </Button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Quick Actions</h3>
        {recentActions.length > 0 && (
          <Badge variant="outline" className="text-xs">
            <Star className="w-3 h-3 mr-1" />
            {recentActions.length} recent
          </Badge>
        )}
      </div>

      {/* Actions */}
      {layout === 'compact' && renderCompactLayout()}
      {layout === 'grid' && renderGridLayout()}
      {layout === 'list' && renderListLayout()}

      {/* Popular Actions Hint */}
      {size === 'large' && (
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          💡 Most used: Create Event, New Post, Invite Friends
        </div>
      )}
    </div>
  );
};