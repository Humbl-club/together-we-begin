import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Settings, 
  GripVertical, 
  X, 
  Save,
  RotateCcw,
  Maximize2,
  Minimize2,
  Edit,
  LayoutGrid
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from '../ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Widget Components (imported from dashboard/widgets)
import { StatsWidget } from '../dashboard/widgets/StatsWidget';
import { EventsWidget } from '../dashboard/widgets/EventsWidget';
import { SocialWidget } from '../dashboard/widgets/SocialWidget';
import { MembersWidget } from '../dashboard/widgets/MembersWidget';
import { ChallengesWidget } from '../dashboard/widgets/ChallengesWidget';
import { LoyaltyWidget } from '../dashboard/widgets/LoyaltyWidget';
import { QuickActionsWidget } from '../dashboard/widgets/QuickActionsWidget';
import { CalendarWidget } from '../dashboard/widgets/CalendarWidget';
import { MessagesWidget } from '../dashboard/widgets/MessagesWidget';
import { WeatherWidget } from '../dashboard/widgets/WeatherWidget';
import { AnnouncementsWidget } from '../dashboard/widgets/AnnouncementsWidget';
import { LeaderboardWidget } from '../dashboard/widgets/LeaderboardWidget';

// Widget type to component mapping
const WIDGET_COMPONENTS: Record<string, React.FC<any>> = {
  stats_overview: StatsWidget,
  recent_events: EventsWidget,
  social_feed: SocialWidget,
  member_activity: MembersWidget,
  challenges_progress: ChallengesWidget,
  loyalty_points: LoyaltyWidget,
  quick_actions: QuickActionsWidget,
  calendar: CalendarWidget,
  messages_preview: MessagesWidget,
  weather: WeatherWidget,
  announcements: AnnouncementsWidget,
  leaderboard: LeaderboardWidget,
};

// Widget metadata
const WIDGET_INFO: Record<string, { name: string; icon: string; defaultSize: string }> = {
  stats_overview: { name: 'Statistics', icon: '📊', defaultSize: 'large' },
  recent_events: { name: 'Events', icon: '📅', defaultSize: 'medium' },
  social_feed: { name: 'Social Feed', icon: '💬', defaultSize: 'medium' },
  member_activity: { name: 'Members', icon: '👥', defaultSize: 'small' },
  challenges_progress: { name: 'Challenges', icon: '🏆', defaultSize: 'medium' },
  loyalty_points: { name: 'Points', icon: '🎁', defaultSize: 'small' },
  quick_actions: { name: 'Quick Actions', icon: '⚡', defaultSize: 'medium' },
  calendar: { name: 'Calendar', icon: '📆', defaultSize: 'large' },
  messages_preview: { name: 'Messages', icon: '💌', defaultSize: 'medium' },
  weather: { name: 'Weather', icon: '🌤️', defaultSize: 'small' },
  announcements: { name: 'Announcements', icon: '📢', defaultSize: 'medium' },
  leaderboard: { name: 'Leaderboard', icon: '🏅', defaultSize: 'medium' },
};

interface DraggableWidgetProps {
  widget: any;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  onResize: (id: string, size: string) => void;
}

const DraggableWidget: React.FC<DraggableWidgetProps> = ({ widget, isEditMode, onRemove, onResize }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const WidgetComponent = WIDGET_COMPONENTS[widget.widget_type];
  const widgetInfo = WIDGET_INFO[widget.widget_type];

  if (!WidgetComponent) {
    return null;
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1 row-span-1';
      case 'medium': return 'col-span-2 row-span-1';
      case 'large': return 'col-span-2 row-span-2';
      case 'full': return 'col-span-4 row-span-2';
      default: return 'col-span-2 row-span-1';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        getSizeClasses(widget.size_preset),
        isEditMode && "cursor-move"
      )}
      {...(isEditMode ? attributes : {})}
    >
      {isEditMode && (
        <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-lg z-10 pointer-events-none group-hover:border-primary" />
      )}
      
      <Card className="h-full overflow-hidden">
        {isEditMode && (
          <div className="absolute top-2 right-2 z-20 flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                const sizes = ['small', 'medium', 'large', 'full'];
                const currentIndex = sizes.indexOf(widget.size_preset);
                const nextSize = sizes[(currentIndex + 1) % sizes.length];
                onResize(widget.id, nextSize);
              }}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(widget.id)}
            >
              <X className="h-3 w-3" />
            </Button>
            <div
              {...listeners}
              className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
            >
              <GripVertical className="h-3 w-3 text-gray-400" />
            </div>
          </div>
        )}
        
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <span>{widgetInfo.icon}</span>
            {widget.title || widgetInfo.name}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pb-3">
          <WidgetComponent configuration={widget.configuration} />
        </CardContent>
      </Card>
    </div>
  );
};

export const DraggableDashboard: React.FC = () => {
  const {
    currentOrganization,
    dashboardWidgets,
    addWidget,
    updateWidget,
    removeWidget,
    refreshWidgets,
    isAdmin
  } = useOrganization();

  const [isEditMode, setIsEditMode] = useState(false);
  const [localWidgets, setLocalWidgets] = useState(dashboardWidgets);
  const [hasChanges, setHasChanges] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setLocalWidgets(dashboardWidgets);
  }, [dashboardWidgets]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setLocalWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        return newItems;
      });
    }
  };

  const handleAddWidget = async (widgetType: string) => {
    const widgetInfo = WIDGET_INFO[widgetType];
    if (!widgetInfo) return;

    try {
      await addWidget({
        widget_type: widgetType,
        title: widgetInfo.name,
        size_preset: widgetInfo.defaultSize,
        position_x: 0,
        position_y: 0,
        width: widgetInfo.defaultSize === 'small' ? 1 : 2,
        height: widgetInfo.defaultSize === 'large' || widgetInfo.defaultSize === 'full' ? 2 : 1,
      });
      
      await refreshWidgets();
      setIsAddWidgetOpen(false);
      
      toast({
        title: "Widget Added",
        description: `${widgetInfo.name} has been added to your dashboard.`,
      });
    } catch (error) {
      toast({
        title: "Failed to Add Widget",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    setLocalWidgets((items) => items.filter((item) => item.id !== widgetId));
    setHasChanges(true);
  };

  const handleResizeWidget = async (widgetId: string, newSize: string) => {
    setLocalWidgets((items) => 
      items.map((item) => 
        item.id === widgetId 
          ? { ...item, size_preset: newSize }
          : item
      )
    );
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      // Update positions and sizes
      for (let i = 0; i < localWidgets.length; i++) {
        const widget = localWidgets[i];
        await updateWidget(widget.id, {
          position_x: i % 4,
          position_y: Math.floor(i / 4),
          size_preset: widget.size_preset,
        });
      }
      
      // Remove deleted widgets
      const localIds = localWidgets.map(w => w.id);
      const toDelete = dashboardWidgets.filter(w => !localIds.includes(w.id));
      for (const widget of toDelete) {
        await removeWidget(widget.id);
      }
      
      await refreshWidgets();
      setHasChanges(false);
      setIsEditMode(false);
      
      toast({
        title: "Dashboard Saved",
        description: "Your dashboard layout has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save dashboard changes. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelChanges = () => {
    setLocalWidgets(dashboardWidgets);
    setHasChanges(false);
    setIsEditMode(false);
  };

  const availableWidgets = Object.entries(WIDGET_INFO).filter(
    ([type]) => !localWidgets.some((w) => w.widget_type === type)
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {isAdmin && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Dashboard Layout</span>
                {isEditMode && (
                  <Badge variant="secondary">Edit Mode</Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                {isEditMode ? (
                  <>
                    <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Widget
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Widget</DialogTitle>
                          <DialogDescription>
                            Choose a widget to add to your dashboard
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          {availableWidgets.map(([type, info]) => (
                            <Button
                              key={type}
                              variant="outline"
                              className="h-auto p-4 justify-start"
                              onClick={() => handleAddWidget(type)}
                            >
                              <div className="text-left">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl">{info.icon}</span>
                                  <span className="font-medium">{info.name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Size: {info.defaultSize}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCancelChanges}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    
                    <Button 
                      size="sm"
                      onClick={handleSaveChanges}
                      disabled={!hasChanges}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Layout
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Customize Dashboard
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localWidgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]">
            {localWidgets.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-12 text-center">
                  <LayoutGrid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No widgets added yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add widgets to customize your dashboard
                  </p>
                  {isAdmin && !isEditMode && (
                    <Button onClick={() => setIsEditMode(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Get Started
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              localWidgets.map((widget) => (
                <DraggableWidget
                  key={widget.id}
                  widget={widget}
                  isEditMode={isEditMode}
                  onRemove={handleRemoveWidget}
                  onResize={handleResizeWidget}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};