import React, { useEffect, useState } from 'react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useMobileFirst } from '../../hooks/useMobileFirst';
import { DraggableWidget } from './DraggableWidget';
import { WidgetSelector } from './WidgetSelector';
import { Plus, Edit3, Grid3X3, Layout, Settings } from 'lucide-react';

interface DraggableDashboardProps {
  isEditMode?: boolean;
  onEditModeChange?: (editing: boolean) => void;
  className?: string;
}

export const DraggableDashboard: React.FC<DraggableDashboardProps> = ({
  isEditMode = false,
  onEditModeChange,
  className = ''
}) => {
  const { isMobile, isTablet } = useMobileFirst();
  const {
    widgets,
    isDragging,
    draggedWidget,
    loadWidgets,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleWidgetResize,
    addWidget,
    removeWidget,
    handleLongPress,
    triggerHaptic
  } = useDragAndDrop();

  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [editingWidget, setEditingWidget] = useState<string | null>(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadWidgets();
  }, [loadWidgets]);

  // Grid configuration based on device
  const gridConfig = {
    columns: isMobile ? 2 : isTablet ? 3 : 4,
    gap: isMobile ? 12 : 16,
    minHeight: isMobile ? 120 : 140
  };

  // Handle edit mode toggle
  const toggleEditMode = () => {
    const newEditMode = !isEditMode;
    onEditModeChange?.(newEditMode);
    triggerHaptic('light');
  };

  // Handle widget long press (iOS-style)
  const handleWidgetLongPress = (widgetId: string) => {
    if (!isEditMode) {
      onEditModeChange?.(true);
    }
    setEditingWidget(widgetId);
    handleLongPress(widgetId);
  };

  // Handle widget size change
  const handleSizeChange = (widgetId: string, size: 'small' | 'medium' | 'large' | 'full') => {
    handleWidgetResize(widgetId, size);
    setEditingWidget(null);
  };

  // Get grid classes for different sizes
  const getGridClasses = (widget: any) => {
    const baseClasses = 'transition-all duration-200 ease-in-out';
    
    if (isMobile) {
      // Mobile: simpler grid system
      switch (widget.size_preset) {
        case 'small': return `${baseClasses} col-span-1`;
        case 'full': return `${baseClasses} col-span-2`;
        default: return `${baseClasses} col-span-2`;
      }
    }
    
    if (isTablet) {
      // Tablet: 3-column grid
      switch (widget.size_preset) {
        case 'small': return `${baseClasses} col-span-1`;
        case 'large': return `${baseClasses} col-span-2 row-span-2`;
        case 'full': return `${baseClasses} col-span-3`;
        default: return `${baseClasses} col-span-2`;
      }
    }
    
    // Desktop: full 4-column grid
    switch (widget.size_preset) {
      case 'small': return `${baseClasses} col-span-1`;
      case 'large': return `${baseClasses} col-span-2 row-span-2`;
      case 'full': return `${baseClasses} col-span-4`;
      default: return `${baseClasses} col-span-2`;
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Edit Mode Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          {isEditMode && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Edit3 className="w-3 h-3 mr-1" />
              Editing
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWidgetSelector(true)}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Widget
            </Button>
          )}
          
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={toggleEditMode}
            className="flex items-center gap-1"
          >
            {isEditMode ? (
              <>
                <Settings className="w-4 h-4" />
                Done
              </>
            ) : (
              <>
                <Grid3X3 className="w-4 h-4" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Drag and Drop Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
          {/* Dashboard Grid */}
          <div
            className={`grid gap-${gridConfig.gap / 4} auto-rows-min`}
            style={{
              gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
              minHeight: gridConfig.minHeight
            }}
          >
            <AnimatePresence>
              {widgets.map((widget) => (
                <motion.div
                  key={widget.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className={getGridClasses(widget)}
                >
                  <DraggableWidget
                    widget={widget}
                    isEditMode={isEditMode}
                    isEditing={editingWidget === widget.id}
                    isDragging={isDragging && draggedWidget?.id === widget.id}
                    onLongPress={() => handleWidgetLongPress(widget.id)}
                    onSizeChange={(size) => handleSizeChange(widget.id, size)}
                    onRemove={() => removeWidget(widget.id)}
                    onEdit={() => setEditingWidget(widget.id === editingWidget ? null : widget.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty State */}
            {widgets.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-16 text-center"
              >
                <Layout className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Customize Your Dashboard
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  Add widgets to create your personalized dashboard experience. 
                  Long press on widgets to enter edit mode.
                </p>
                <Button onClick={() => setShowWidgetSelector(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Widget
                </Button>
              </motion.div>
            )}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedWidget && (
            <div className="transform rotate-3 opacity-90">
              <Card className="p-4 shadow-xl border-2 border-blue-500">
                <h3 className="font-semibold">{draggedWidget.title}</h3>
                <p className="text-sm text-gray-600 capitalize">
                  {draggedWidget.widget_type.replace('_', ' ')}
                </p>
              </Card>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Widget Selector Modal */}
      {showWidgetSelector && (
        <WidgetSelector
          isOpen={showWidgetSelector}
          onClose={() => setShowWidgetSelector(false)}
          onAddWidget={(type, title) => {
            addWidget(type, title);
            setShowWidgetSelector(false);
          }}
        />
      )}

      {/* Edit Mode Instructions */}
      {isEditMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Grid3X3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Edit Mode Active</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Drag</strong> widgets to rearrange</p>
                <p>• <strong>Long press</strong> for size options</p>
                <p>• <strong>Tap edit icon</strong> to configure</p>
                <p>• <strong>Tap "Done"</strong> to save changes</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};