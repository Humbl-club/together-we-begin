import { useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { supabase } from '../integrations/supabase/client';
import { useOrganization } from '../contexts/OrganizationContext';

interface DraggableWidget {
  id: string;
  widget_type: string;
  title: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  size_preset: 'small' | 'medium' | 'large' | 'full';
  is_visible: boolean;
  configuration: Record<string, any>;
}

interface GridLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const useDragAndDrop = () => {
  const { currentOrganization } = useOrganization();
  const [widgets, setWidgets] = useState<DraggableWidget[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<DraggableWidget | null>(null);
  const [layout, setLayout] = useState<GridLayout[]>([]);

  // Haptic feedback for iOS devices
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30]
      };
      navigator.vibrate(patterns[type]);
    }
    
    // iOS haptic feedback via Capacitor (if available)
    if (window.Capacitor?.isNativePlatform()) {
      try {
        // @ts-ignore - Capacitor haptics
        window.Capacitor.Plugins.Haptics?.impact({ style: type });
      } catch (e) {
        console.log('Haptic feedback not available');
      }
    }
  }, []);

  // Load widgets from database
  const loadWidgets = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_visible', true)
        .order('position_y', { ascending: true })
        .order('position_x', { ascending: true });

      if (error) throw error;
      
      setWidgets(data || []);
      
      // Convert to grid layout format
      const gridLayout = (data || []).map(widget => ({
        id: widget.id,
        x: widget.position_x,
        y: widget.position_y,
        w: widget.width,
        h: widget.height
      }));
      setLayout(gridLayout);
    } catch (err) {
      console.error('Failed to load widgets:', err);
    }
  }, [currentOrganization?.id]);

  // Save widget positions to database
  const saveWidgetPositions = useCallback(async (updatedWidgets: DraggableWidget[]) => {
    if (!currentOrganization?.id) return;

    try {
      const updates = updatedWidgets.map(widget => ({
        id: widget.id,
        position_x: widget.position_x,
        position_y: widget.position_y,
        width: widget.width,
        height: widget.height,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('dashboard_widgets')
        .upsert(updates);

      if (error) throw error;
      
      triggerHaptic('light'); // Success feedback
    } catch (err) {
      console.error('Failed to save widget positions:', err);
      triggerHaptic('heavy'); // Error feedback
    }
  }, [currentOrganization?.id, triggerHaptic]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const widget = widgets.find(w => w.id === active.id);
    
    setIsDragging(true);
    setDraggedWidget(widget || null);
    triggerHaptic('light'); // Start drag feedback
  }, [widgets, triggerHaptic]);

  // Handle drag over (for real-time visual feedback)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Real-time position updates for smooth UX
    const { active, over } = event;
    if (!active || !over) return;

    // Update visual position immediately
    setWidgets(prev => prev.map(widget => {
      if (widget.id === active.id) {
        // Calculate new position based on drop zone
        return {
          ...widget,
          position_x: 0, // Will be calculated based on drop position
          position_y: 0
        };
      }
      return widget;
    }));
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over, delta } = event;
    
    setIsDragging(false);
    setDraggedWidget(null);

    if (!active || !over) {
      triggerHaptic('medium'); // Cancel feedback
      return;
    }

    // Calculate new grid position based on delta
    const gridSize = 100; // Adjust based on your grid size
    const newX = Math.max(0, Math.round(delta.x / gridSize));
    const newY = Math.max(0, Math.round(delta.y / gridSize));

    // Update widget position
    const updatedWidgets = widgets.map(widget => {
      if (widget.id === active.id) {
        return {
          ...widget,
          position_x: Math.max(0, widget.position_x + newX),
          position_y: Math.max(0, widget.position_y + newY)
        };
      }
      return widget;
    });

    setWidgets(updatedWidgets);
    
    // Save to database
    await saveWidgetPositions(updatedWidgets);
    
    triggerHaptic('medium'); // Drop success feedback
  }, [widgets, saveWidgetPositions, triggerHaptic]);

  // Handle widget resize
  const handleWidgetResize = useCallback(async (
    widgetId: string, 
    newSize: 'small' | 'medium' | 'large' | 'full'
  ) => {
    const sizeMap = {
      small: { width: 1, height: 1 },
      medium: { width: 2, height: 1 },
      large: { width: 2, height: 2 },
      full: { width: 4, height: 1 }
    };

    const updatedWidgets = widgets.map(widget => {
      if (widget.id === widgetId) {
        return {
          ...widget,
          size_preset: newSize,
          width: sizeMap[newSize].width,
          height: sizeMap[newSize].height
        };
      }
      return widget;
    });

    setWidgets(updatedWidgets);
    await saveWidgetPositions(updatedWidgets);
    triggerHaptic('light');
  }, [widgets, saveWidgetPositions, triggerHaptic]);

  // Add new widget
  const addWidget = useCallback(async (widgetType: string, title: string) => {
    if (!currentOrganization?.id) return;

    try {
      // Find empty position
      const maxY = Math.max(...widgets.map(w => w.position_y), -1);
      const newPosition = { x: 0, y: maxY + 1 };

      const { data, error } = await supabase
        .from('dashboard_widgets')
        .insert({
          organization_id: currentOrganization.id,
          widget_type: widgetType,
          title,
          position_x: newPosition.x,
          position_y: newPosition.y,
          width: 2,
          height: 1,
          size_preset: 'medium',
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setWidgets(prev => [...prev, data]);
      triggerHaptic('light');
    } catch (err) {
      console.error('Failed to add widget:', err);
      triggerHaptic('heavy');
    }
  }, [currentOrganization?.id, widgets, triggerHaptic]);

  // Remove widget
  const removeWidget = useCallback(async (widgetId: string) => {
    if (!currentOrganization?.id) return;

    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .update({ is_visible: false })
        .eq('id', widgetId);

      if (error) throw error;

      setWidgets(prev => prev.filter(w => w.id !== widgetId));
      triggerHaptic('medium');
    } catch (err) {
      console.error('Failed to remove widget:', err);
      triggerHaptic('heavy');
    }
  }, [currentOrganization?.id, triggerHaptic]);

  // Long press handler for iOS-style editing
  const handleLongPress = useCallback((widgetId: string) => {
    triggerHaptic('medium'); // Long press feedback
    
    // Enter edit mode
    setWidgets(prev => prev.map(widget => ({
      ...widget,
      // Add edit mode flag or trigger edit modal
    })));
  }, [triggerHaptic]);

  return {
    widgets,
    isDragging,
    draggedWidget,
    layout,
    loadWidgets,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleWidgetResize,
    addWidget,
    removeWidget,
    handleLongPress,
    triggerHaptic
  };
};