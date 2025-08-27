import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { 
  GripVertical, 
  Settings, 
  Trash2, 
  Maximize2, 
  Minimize2,
  Square,
  RectangleHorizontal,
  BarChart3,
  Calendar,
  Users,
  Trophy,
  Gift,
  Zap,
  MessageSquare,
  MapPin,
  Cloud,
  Megaphone,
  Medal
} from 'lucide-react';
import { StatsWidget } from './widgets/StatsWidget';
import { EventsWidget } from './widgets/EventsWidget';
import { SocialWidget } from './widgets/SocialWidget';
import { ChallengesWidget } from './widgets/ChallengesWidget';
import { MembersWidget } from './widgets/MembersWidget';
import { LoyaltyWidget } from './widgets/LoyaltyWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { CalendarWidget } from './widgets/CalendarWidget';
import { MessagesWidget } from './widgets/MessagesWidget';
import { WeatherWidget } from './widgets/WeatherWidget';
import { AnnouncementsWidget } from './widgets/AnnouncementsWidget';
import { LeaderboardWidget } from './widgets/LeaderboardWidget';

interface DraggableWidgetProps {
  widget: {
    id: string;
    widget_type: string;
    title: string;
    size_preset: 'small' | 'medium' | 'large' | 'full';
    configuration: Record<string, any>;
  };
  isEditMode: boolean;
  isEditing: boolean;
  isDragging?: boolean;
  onLongPress: () => void;
  onSizeChange: (size: 'small' | 'medium' | 'large' | 'full') => void;
  onRemove: () => void;
  onEdit: () => void;
}

const WIDGET_ICONS: Record<string, React.ReactNode> = {
  stats_overview: <BarChart3 className="w-5 h-5" />,
  recent_events: <Calendar className="w-5 h-5" />,
  social_feed: <Users className="w-5 h-5" />,
  member_activity: <Users className="w-5 h-5" />,
  challenges_progress: <Trophy className="w-5 h-5" />,
  loyalty_points: <Gift className="w-5 h-5" />,
  quick_actions: <Zap className="w-5 h-5" />,
  calendar: <Calendar className="w-5 h-5" />,
  messages_preview: <MessageSquare className="w-5 h-5" />,
  weather: <Cloud className="w-5 h-5" />,
  announcements: <Megaphone className="w-5 h-5" />,
  leaderboard: <Medal className="w-5 h-5" />
};

const SIZE_OPTIONS = [
  { key: 'small', label: 'Small', icon: <Minimize2 className="w-4 h-4" />, description: '1x1 grid' },
  { key: 'medium', label: 'Medium', icon: <Square className="w-4 h-4" />, description: '2x1 grid' },
  { key: 'large', label: 'Large', icon: <Maximize2 className="w-4 h-4" />, description: '2x2 grid' },
  { key: 'full', label: 'Full Width', icon: <RectangleHorizontal className="w-4 h-4" />, description: 'Full row' }
] as const;

export const DraggableWidget: React.FC<DraggableWidgetProps> = ({
  widget,
  isEditMode,
  isEditing,
  isDragging = false,
  onLongPress,
  onSizeChange,
  onRemove,
  onEdit
}) => {
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handle long press for iOS-style editing
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isEditMode) {
      setIsPressed(true);
      const timeout = setTimeout(() => {
        onLongPress();
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 50, 50]);
        }
      }, 500); // 500ms long press
      setLongPressTimeout(timeout);
    }
  };

  const handlePointerUp = () => {
    setIsPressed(false);
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };

  // Render widget content based on type
  const renderWidgetContent = () => {
    const commonProps = {
      configuration: widget.configuration,
      size: widget.size_preset
    };

    switch (widget.widget_type) {
      case 'stats_overview':
        return <StatsWidget {...commonProps} />;
      case 'recent_events':
        return <EventsWidget {...commonProps} />;
      case 'social_feed':
        return <SocialWidget {...commonProps} />;
      case 'member_activity':
        return <MembersWidget {...commonProps} />;
      case 'challenges_progress':
        return <ChallengesWidget {...commonProps} />;
      case 'loyalty_points':
        return <LoyaltyWidget {...commonProps} />;
      case 'quick_actions':
        return <QuickActionsWidget {...commonProps} />;
      case 'calendar':
        return <CalendarWidget {...commonProps} />;
      case 'messages_preview':
        return <MessagesWidget {...commonProps} />;
      case 'weather':
        return <WeatherWidget {...commonProps} />;
      case 'announcements':
        return <AnnouncementsWidget {...commonProps} />;
      case 'leaderboard':
        return <LeaderboardWidget {...commonProps} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            {WIDGET_ICONS[widget.widget_type] || <Square className="w-8 h-8" />}
            <p className="text-sm mt-2 capitalize">
              {widget.widget_type.replace('_', ' ')}
            </p>
          </div>
        );
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative group"
      initial={{ scale: 1 }}
      animate={{ 
        scale: isPressed ? 0.98 : sortableIsDragging || isDragging ? 1.05 : 1,
        rotate: sortableIsDragging || isDragging ? 2 : 0
      }}
      transition={{ duration: 0.1 }}
    >
      <Card className={`
        relative overflow-hidden transition-all duration-200 h-full
        ${isEditMode ? 'ring-2 ring-blue-200 ring-offset-2' : ''}
        ${isEditing ? 'ring-blue-500 shadow-lg' : ''}
        ${sortableIsDragging || isDragging ? 'shadow-xl z-50 cursor-grabbing' : 'cursor-pointer'}
        ${isPressed ? 'shadow-lg' : 'hover:shadow-md'}
      `}>
        {/* Edit Mode Overlay */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-50/80 backdrop-blur-sm z-10 flex items-center justify-center"
            >
              {/* Drag Handle */}
              <div
                {...listeners}
                className="absolute top-2 left-2 p-1 bg-white rounded shadow-sm cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-gray-600" />
              </div>

              {/* Edit Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onEdit}
                  className="bg-white shadow-sm"
                >
                  <Settings className="w-4 h-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white shadow-sm"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    {SIZE_OPTIONS.map(option => (
                      <DropdownMenuItem
                        key={option.key}
                        onClick={() => onSizeChange(option.key as any)}
                        className={`flex items-center gap-3 ${
                          widget.size_preset === option.key ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                      >
                        {option.icon}
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                        {widget.size_preset === option.key && (
                          <Badge variant="secondary" className="ml-auto">Current</Badge>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onRemove}
                  className="shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Widget Header */}
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {WIDGET_ICONS[widget.widget_type] || <Square className="w-4 h-4" />}
            {widget.title}
            {widget.size_preset === 'large' && (
              <Badge variant="outline" className="ml-auto text-xs">
                Extended
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        {/* Widget Content */}
        <CardContent className="pt-0">
          {renderWidgetContent()}
        </CardContent>

        {/* Size Indicator */}
        {isEditMode && (
          <div className="absolute bottom-2 right-2 z-20">
            <Badge variant="secondary" className="text-xs bg-white/90">
              {SIZE_OPTIONS.find(s => s.key === widget.size_preset)?.label}
            </Badge>
          </div>
        )}

        {/* Drag Indicator */}
        {(sortableIsDragging || isDragging) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-blue-100/50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center z-30"
          >
            <div className="text-blue-600 font-medium">Moving...</div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};