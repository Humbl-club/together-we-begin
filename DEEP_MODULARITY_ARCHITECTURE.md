# Deep Modularity Architecture: Everything is Customizable

## Overview: True Modularity at Every Level

This architecture makes **EVERYTHING** modular and customizable:
- Features have multiple style variants
- Sub-features can be added as plugins
- UI components have multiple display modes
- Dashboard is fully composable with drag-drop
- Navigation can be top/bottom/side/floating
- Every visual element is themeable
- Container sizes, typography, spacing - all customizable

## 1. Feature Variant System

### Core Concept: Features Have Multiple Implementations

Instead of just "Events" feature, clubs can choose:
- **Event Display Style**: Calendar view, List view, Card grid, Timeline
- **Calendar Style**: Google-like, Outlook-like, Minimal, Visual
- **Event Card Style**: Compact, Detailed, Image-focused, Text-only

### Feature Variant Architecture

```typescript
// types/FeatureVariant.ts
export interface FeatureVariant {
  featureKey: string;        // 'events'
  variantKey: string;        // 'calendar-google-style'
  name: string;              // 'Google Calendar Style'
  preview: string;           // Preview image URL
  category: string;          // 'display-style'
  
  // The actual component implementation
  component: React.LazyExoticComponent<React.ComponentType>;
  
  // Mobile-specific variant
  mobileComponent?: React.LazyExoticComponent<React.ComponentType>;
  
  // Configuration options specific to this variant
  configSchema: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'color' | 'select';
      label: string;
      default: any;
      options?: any[];
    };
  };
  
  // CSS variables this variant supports
  styleVariables: {
    [key: string]: string;  // '--event-card-radius': '8px'
  };
}

// Example: Multiple Calendar Variants
export const calendarVariants: FeatureVariant[] = [
  {
    featureKey: 'events',
    variantKey: 'calendar-google',
    name: 'Google Calendar Style',
    preview: '/previews/calendar-google.png',
    category: 'calendar-style',
    
    component: lazy(() => import('./variants/GoogleCalendarStyle')),
    mobileComponent: lazy(() => import('./variants/GoogleCalendarMobile')),
    
    configSchema: {
      weekStartsOn: {
        type: 'select',
        label: 'Week Starts On',
        default: 'monday',
        options: ['sunday', 'monday']
      },
      showWeekNumbers: {
        type: 'boolean',
        label: 'Show Week Numbers',
        default: false
      },
      defaultView: {
        type: 'select',
        label: 'Default View',
        default: 'month',
        options: ['day', 'week', 'month', 'year']
      }
    },
    
    styleVariables: {
      '--calendar-header-height': '48px',
      '--calendar-day-height': '100px',
      '--calendar-border-color': 'var(--border)',
      '--calendar-today-bg': 'var(--primary)',
      '--calendar-event-radius': '4px'
    }
  },
  
  {
    featureKey: 'events',
    variantKey: 'calendar-minimal',
    name: 'Minimal Calendar',
    preview: '/previews/calendar-minimal.png',
    category: 'calendar-style',
    
    component: lazy(() => import('./variants/MinimalCalendar')),
    
    configSchema: {
      showOnlyThisMonth: {
        type: 'boolean',
        label: 'Hide Other Month Days',
        default: true
      },
      compactMode: {
        type: 'boolean',
        label: 'Compact Mode',
        default: false
      }
    },
    
    styleVariables: {
      '--calendar-padding': '0',
      '--calendar-gap': '1px',
      '--calendar-day-padding': '8px'
    }
  },
  
  {
    featureKey: 'events',
    variantKey: 'calendar-visual',
    name: 'Visual Calendar with Images',
    preview: '/previews/calendar-visual.png',
    category: 'calendar-style',
    
    component: lazy(() => import('./variants/VisualCalendar')),
    
    configSchema: {
      imagePosition: {
        type: 'select',
        label: 'Image Position',
        default: 'background',
        options: ['background', 'top', 'left']
      },
      imageOpacity: {
        type: 'number',
        label: 'Image Opacity',
        default: 0.3
      }
    }
  }
];

// Event Display Variants
export const eventDisplayVariants: FeatureVariant[] = [
  {
    featureKey: 'events',
    variantKey: 'event-cards-grid',
    name: 'Card Grid Layout',
    preview: '/previews/events-grid.png',
    category: 'event-display',
    
    component: lazy(() => import('./variants/EventCardGrid')),
    
    configSchema: {
      columns: {
        type: 'select',
        label: 'Grid Columns',
        default: '3',
        options: ['2', '3', '4', 'auto']
      },
      cardStyle: {
        type: 'select',
        label: 'Card Style',
        default: 'elevated',
        options: ['flat', 'elevated', 'outlined', 'glassmorphic']
      },
      imageRatio: {
        type: 'select',
        label: 'Image Aspect Ratio',
        default: '16:9',
        options: ['16:9', '4:3', '1:1', 'auto']
      }
    }
  },
  
  {
    featureKey: 'events',
    variantKey: 'event-timeline',
    name: 'Timeline View',
    preview: '/previews/events-timeline.png',
    category: 'event-display',
    
    component: lazy(() => import('./variants/EventTimeline')),
    
    configSchema: {
      timelineStyle: {
        type: 'select',
        label: 'Timeline Style',
        default: 'centered',
        options: ['centered', 'left', 'alternating']
      },
      showConnectors: {
        type: 'boolean',
        label: 'Show Connecting Lines',
        default: true
      }
    }
  },
  
  {
    featureKey: 'events',
    variantKey: 'event-list-compact',
    name: 'Compact List',
    preview: '/previews/events-list.png',
    category: 'event-display',
    
    component: lazy(() => import('./variants/EventListCompact')),
    
    configSchema: {
      showImages: {
        type: 'boolean',
        label: 'Show Thumbnails',
        default: true
      },
      dateFormat: {
        type: 'select',
        label: 'Date Display',
        default: 'relative',
        options: ['relative', 'absolute', 'both']
      }
    }
  }
];
```

## 2. Sub-Feature Plugin System

### Messaging Feature with Sub-Plugins

```typescript
// features/messaging/subfeatures.ts
export interface SubFeature {
  parentFeature: string;
  key: string;
  name: string;
  description: string;
  
  // Can be enabled/disabled independently
  independent: boolean;
  
  // Additional UI components
  components: {
    main?: React.LazyExoticComponent<React.ComponentType>;
    settings?: React.LazyExoticComponent<React.ComponentType>;
    widget?: React.LazyExoticComponent<React.ComponentType>;
  };
  
  // Additional permissions needed
  permissions?: string[];
  
  // Database extensions
  dbExtensions?: {
    tables?: TableDefinition[];
    columns?: ColumnAddition[];
  };
}

// Messaging Sub-Features
export const messagingSubFeatures: SubFeature[] = [
  {
    parentFeature: 'messaging',
    key: 'group-chats',
    name: 'Group Chats',
    description: 'Create group conversations',
    independent: true,
    
    components: {
      main: lazy(() => import('./GroupChats')),
      settings: lazy(() => import('./GroupChatSettings')),
      widget: lazy(() => import('./ActiveGroupsWidget'))
    },
    
    dbExtensions: {
      tables: [
        {
          name: 'message_groups',
          columns: {
            id: 'UUID PRIMARY KEY',
            organization_id: 'UUID',
            name: 'TEXT',
            description: 'TEXT',
            avatar_url: 'TEXT',
            created_by: 'UUID',
            max_members: 'INTEGER DEFAULT 50',
            is_public: 'BOOLEAN DEFAULT false'
          }
        },
        {
          name: 'group_members',
          columns: {
            group_id: 'UUID',
            user_id: 'UUID',
            role: 'TEXT',
            joined_at: 'TIMESTAMP'
          }
        }
      ]
    }
  },
  
  {
    parentFeature: 'messaging',
    key: 'voice-notes',
    name: 'Voice Messages',
    description: 'Send audio messages',
    independent: true,
    
    components: {
      main: lazy(() => import('./VoiceNotes')),
      settings: lazy(() => import('./VoiceNoteSettings'))
    },
    
    dbExtensions: {
      columns: [
        {
          table: 'direct_messages',
          column: 'audio_url',
          type: 'TEXT'
        },
        {
          table: 'direct_messages',
          column: 'audio_duration',
          type: 'INTEGER'
        }
      ]
    }
  },
  
  {
    parentFeature: 'messaging',
    key: 'message-reactions',
    name: 'Message Reactions',
    description: 'React to messages with emojis',
    independent: true,
    
    components: {
      main: lazy(() => import('./MessageReactions'))
    },
    
    dbExtensions: {
      tables: [
        {
          name: 'message_reactions',
          columns: {
            message_id: 'UUID',
            user_id: 'UUID',
            reaction: 'TEXT',
            created_at: 'TIMESTAMP'
          }
        }
      ]
    }
  },
  
  {
    parentFeature: 'messaging',
    key: 'message-threads',
    name: 'Threaded Replies',
    description: 'Reply to messages in threads',
    independent: true,
    
    components: {
      main: lazy(() => import('./MessageThreads'))
    }
  },
  
  {
    parentFeature: 'messaging',
    key: 'message-translation',
    name: 'Auto-Translation',
    description: 'Automatically translate messages',
    independent: true,
    
    components: {
      settings: lazy(() => import('./TranslationSettings'))
    }
  }
];

// Social Feature Sub-Plugins
export const socialSubFeatures: SubFeature[] = [
  {
    parentFeature: 'social',
    key: 'stories',
    name: 'Stories (24hr)',
    description: 'Temporary posts that disappear',
    independent: true,
    
    components: {
      main: lazy(() => import('./Stories')),
      widget: lazy(() => import('./StoriesBar'))
    }
  },
  
  {
    parentFeature: 'social',
    key: 'polls',
    name: 'Polls & Surveys',
    description: 'Create polls in posts',
    independent: true,
    
    components: {
      main: lazy(() => import('./Polls')),
      widget: lazy(() => import('./ActivePollsWidget'))
    }
  },
  
  {
    parentFeature: 'social',
    key: 'live-streaming',
    name: 'Live Streaming',
    description: 'Stream live video to members',
    independent: true,
    
    components: {
      main: lazy(() => import('./LiveStreaming')),
      widget: lazy(() => import('./LiveNowWidget'))
    }
  }
];
```

## 3. Modular Dashboard System

### Fully Composable Dashboard with Drag & Drop

```typescript
// types/DashboardComposition.ts
export interface DashboardLayout {
  id: string;
  name: string;
  
  // Grid configuration
  grid: {
    columns: number;        // 12, 16, 24
    rowHeight: number;      // pixels
    gap: number;           // pixels
    containerPadding: [number, number];
    breakpoints: {
      lg: number;
      md: number;
      sm: number;
      xs: number;
    };
    cols: {
      lg: number;
      md: number;
      sm: number;
      xs: number;
    };
  };
  
  // Widget placements
  widgets: WidgetPlacement[];
  
  // Layout presets
  mobileLayout?: MobileLayout;
  tabletLayout?: TabletLayout;
}

export interface WidgetPlacement {
  id: string;
  widgetKey: string;
  
  // Grid position
  grid: {
    x: number;
    y: number;
    w: number;  // width in grid units
    h: number;  // height in grid units
    
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
  };
  
  // Widget-specific config
  config: any;
  
  // Style overrides
  style?: {
    backgroundColor?: string;
    borderRadius?: string;
    padding?: string;
    border?: string;
    boxShadow?: string;
  };
  
  // Responsive behavior
  responsive: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    mobileGrid?: GridPosition;
    tabletGrid?: GridPosition;
  };
}

// Dashboard Widget Registry
export interface DashboardWidget {
  key: string;
  name: string;
  description: string;
  category: string;
  
  // Multiple size variants
  sizes: {
    small: { w: 2, h: 2 };
    medium: { w: 4, h: 3 };
    large: { w: 6, h: 4 };
    full: { w: 12, h: 4 };
  };
  
  // The component
  component: React.LazyExoticComponent<React.ComponentType<WidgetProps>>;
  
  // Configuration schema
  configSchema: ConfigSchema;
  
  // Data requirements
  dataSource?: {
    feature: string;        // Required feature
    endpoint?: string;      // API endpoint
    refreshInterval?: number; // ms
  };
}

// Example Dashboard Widgets
export const dashboardWidgets: DashboardWidget[] = [
  {
    key: 'stats-overview',
    name: 'Statistics Overview',
    category: 'analytics',
    
    sizes: {
      small: { w: 3, h: 2 },
      medium: { w: 6, h: 2 },
      large: { w: 9, h: 3 },
      full: { w: 12, h: 3 }
    },
    
    component: lazy(() => import('./widgets/StatsOverview')),
    
    configSchema: {
      metrics: {
        type: 'multiselect',
        label: 'Metrics to Show',
        default: ['members', 'events', 'engagement'],
        options: ['members', 'events', 'posts', 'messages', 'revenue', 'engagement']
      },
      period: {
        type: 'select',
        label: 'Time Period',
        default: '7days',
        options: ['today', '7days', '30days', 'year']
      },
      chartType: {
        type: 'select',
        label: 'Chart Type',
        default: 'line',
        options: ['line', 'bar', 'area', 'number']
      }
    }
  },
  
  {
    key: 'upcoming-events-widget',
    name: 'Upcoming Events',
    category: 'events',
    
    sizes: {
      small: { w: 3, h: 3 },
      medium: { w: 6, h: 4 },
      large: { w: 9, h: 5 },
      full: { w: 12, h: 4 }
    },
    
    component: lazy(() => import('./widgets/UpcomingEvents')),
    
    configSchema: {
      displayStyle: {
        type: 'select',
        label: 'Display Style',
        default: 'cards',
        options: ['cards', 'list', 'calendar', 'timeline']
      },
      maxEvents: {
        type: 'number',
        label: 'Maximum Events',
        default: 5
      },
      showImages: {
        type: 'boolean',
        label: 'Show Event Images',
        default: true
      }
    },
    
    dataSource: {
      feature: 'events',
      endpoint: '/api/events/upcoming',
      refreshInterval: 60000
    }
  },
  
  {
    key: 'activity-feed-widget',
    name: 'Activity Feed',
    category: 'social',
    
    sizes: {
      small: { w: 4, h: 4 },
      medium: { w: 6, h: 6 },
      large: { w: 8, h: 8 },
      full: { w: 12, h: 6 }
    },
    
    component: lazy(() => import('./widgets/ActivityFeed')),
    
    configSchema: {
      feedType: {
        type: 'select',
        label: 'Feed Type',
        default: 'all',
        options: ['all', 'posts', 'events', 'achievements']
      },
      autoRefresh: {
        type: 'boolean',
        label: 'Auto Refresh',
        default: true
      },
      showReactions: {
        type: 'boolean',
        label: 'Show Reactions',
        default: true
      }
    }
  },
  
  {
    key: 'custom-html-widget',
    name: 'Custom Content',
    category: 'custom',
    
    sizes: {
      small: { w: 2, h: 2 },
      medium: { w: 4, h: 4 },
      large: { w: 8, h: 6 },
      full: { w: 12, h: 8 }
    },
    
    component: lazy(() => import('./widgets/CustomHtml')),
    
    configSchema: {
      content: {
        type: 'html',
        label: 'HTML Content',
        default: ''
      },
      allowScripts: {
        type: 'boolean',
        label: 'Allow JavaScript',
        default: false
      }
    }
  }
];

// Dashboard Builder Component
export const DashboardBuilder: React.FC = () => {
  const [layout, setLayout] = useState<DashboardLayout>(defaultLayout);
  const [editMode, setEditMode] = useState(false);
  const [availableWidgets] = useState(dashboardWidgets);
  
  const handleLayoutChange = (newLayout: any) => {
    setLayout({
      ...layout,
      widgets: newLayout.map((item: any) => ({
        ...layout.widgets.find(w => w.id === item.i),
        grid: {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h
        }
      }))
    });
  };
  
  const addWidget = (widget: DashboardWidget, size: 'small' | 'medium' | 'large') => {
    const newWidget: WidgetPlacement = {
      id: generateId(),
      widgetKey: widget.key,
      grid: {
        x: 0,
        y: 0,
        ...widget.sizes[size]
      },
      config: {}
    };
    
    setLayout({
      ...layout,
      widgets: [...layout.widgets, newWidget]
    });
  };
  
  return (
    <div className="dashboard-builder">
      <DashboardHeader>
        <Button onClick={() => setEditMode(!editMode)}>
          {editMode ? 'Save Layout' : 'Edit Dashboard'}
        </Button>
      </DashboardHeader>
      
      {editMode && (
        <WidgetPalette>
          {availableWidgets.map(widget => (
            <WidgetOption
              key={widget.key}
              widget={widget}
              onAdd={(size) => addWidget(widget, size)}
            />
          ))}
        </WidgetPalette>
      )}
      
      <ResponsiveGridLayout
        className="dashboard-grid"
        layouts={{ lg: layout.widgets }}
        onLayoutChange={handleLayoutChange}
        isDraggable={editMode}
        isResizable={editMode}
        cols={layout.grid.cols}
        rowHeight={layout.grid.rowHeight}
        containerPadding={layout.grid.containerPadding}
      >
        {layout.widgets.map(widget => (
          <div key={widget.id} className="dashboard-widget" style={widget.style}>
            <WidgetContainer
              widget={widget}
              editMode={editMode}
              onRemove={() => removeWidget(widget.id)}
              onConfigure={() => configureWidget(widget.id)}
            />
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};
```

## 4. Modular Navigation System

### Multiple Navigation Styles & Positions

```typescript
// types/NavigationStyles.ts
export interface NavigationStyle {
  key: string;
  name: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'floating';
  variant: string;
  
  // Component implementation
  component: React.ComponentType<NavigationProps>;
  
  // Mobile-specific variant
  mobileComponent?: React.ComponentType<NavigationProps>;
  
  // Configuration
  config: {
    collapsible?: boolean;
    showLabels?: boolean;
    showIcons?: boolean;
    iconSize?: number;
    maxItems?: number;
    moreMenuStyle?: 'dropdown' | 'drawer' | 'modal';
  };
  
  // Style variables
  styleVars: Record<string, string>;
}

// Navigation Style Implementations
export const navigationStyles: NavigationStyle[] = [
  {
    key: 'ios-tab-bar',
    name: 'iOS Tab Bar',
    position: 'bottom',
    variant: 'ios',
    
    component: IOSTabBar,
    
    config: {
      showLabels: true,
      showIcons: true,
      iconSize: 24,
      maxItems: 5
    },
    
    styleVars: {
      '--nav-height': '49px',
      '--nav-bg': 'var(--background)',
      '--nav-border': '1px solid var(--border)',
      '--nav-active-color': 'var(--primary)',
      '--nav-inactive-color': 'var(--muted-foreground)'
    }
  },
  
  {
    key: 'android-bottom-nav',
    name: 'Material Bottom Navigation',
    position: 'bottom',
    variant: 'material',
    
    component: MaterialBottomNav,
    
    config: {
      showLabels: true,
      showIcons: true,
      iconSize: 24,
      maxItems: 5
    },
    
    styleVars: {
      '--nav-height': '56px',
      '--nav-bg': 'var(--background)',
      '--nav-elevation': '8px'
    }
  },
  
  {
    key: 'sidebar-minimal',
    name: 'Minimal Sidebar',
    position: 'left',
    variant: 'minimal',
    
    component: MinimalSidebar,
    mobileComponent: MobileDrawer,
    
    config: {
      collapsible: true,
      showLabels: true,
      showIcons: true,
      iconSize: 20
    },
    
    styleVars: {
      '--sidebar-width': '240px',
      '--sidebar-collapsed-width': '60px',
      '--sidebar-bg': 'var(--background)',
      '--sidebar-border': '1px solid var(--border)'
    }
  },
  
  {
    key: 'floating-action-menu',
    name: 'Floating Action Menu',
    position: 'floating',
    variant: 'fab',
    
    component: FloatingActionMenu,
    
    config: {
      showLabels: false,
      showIcons: true,
      iconSize: 24
    },
    
    styleVars: {
      '--fab-size': '56px',
      '--fab-position-bottom': '24px',
      '--fab-position-right': '24px',
      '--fab-bg': 'var(--primary)',
      '--fab-color': 'var(--primary-foreground)'
    }
  },
  
  {
    key: 'top-nav-centered',
    name: 'Centered Top Navigation',
    position: 'top',
    variant: 'centered',
    
    component: CenteredTopNav,
    mobileComponent: MobileTopNav,
    
    config: {
      showLabels: true,
      showIcons: false,
      maxItems: 8,
      moreMenuStyle: 'dropdown'
    },
    
    styleVars: {
      '--nav-height': '64px',
      '--nav-bg': 'var(--background)',
      '--nav-max-width': '1200px'
    }
  }
];

// Dynamic Navigation Component
export const DynamicNavigation: React.FC = () => {
  const { currentOrg } = useOrganization();
  const { isMobile } = useMobileOptimization();
  
  // Get navigation style from org config
  const navStyle = navigationStyles.find(
    s => s.key === currentOrg?.settings.navigationStyle
  ) || navigationStyles[0];
  
  // Get navigation items based on enabled features
  const navItems = useNavigationItems();
  
  // Use mobile component if available and on mobile
  const NavComponent = isMobile && navStyle.mobileComponent
    ? navStyle.mobileComponent
    : navStyle.component;
  
  // Apply style variables
  useEffect(() => {
    Object.entries(navStyle.styleVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [navStyle]);
  
  return (
    <NavComponent
      items={navItems}
      config={navStyle.config}
      position={navStyle.position}
    />
  );
};
```

## 5. Deep Visual Customization System

### Every Visual Aspect is Customizable

```typescript
// types/ThemeSystem.ts
export interface DeepTheme {
  // Base colors
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    neutral: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    
    // Custom colors
    custom: Record<string, string>;
  };
  
  // Typography
  typography: {
    fontFamilies: {
      heading: string;
      body: string;
      mono: string;
      custom: Record<string, string>;
    };
    
    fontSizes: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
      custom: Record<string, string>;
    };
    
    fontWeights: {
      thin: number;
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
      extrabold: number;
    };
    
    lineHeights: Record<string, string>;
    letterSpacing: Record<string, string>;
  };
  
  // Spacing & Sizing
  spacing: {
    base: number;  // Base unit in pixels
    scale: number[]; // Multipliers [0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24]
    custom: Record<string, string>;
  };
  
  // Borders & Corners
  borders: {
    radius: {
      none: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      full: string;
      custom: Record<string, string>;
    };
    
    width: {
      none: string;
      thin: string;
      medium: string;
      thick: string;
      custom: Record<string, string>;
    };
    
    styles: string[];
  };
  
  // Shadows & Effects
  effects: {
    shadows: {
      none: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      inner: string;
      custom: Record<string, string>;
    };
    
    blurs: {
      none: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    
    transitions: {
      instant: string;
      fast: string;
      normal: string;
      slow: string;
      custom: Record<string, string>;
    };
  };
  
  // Container Styles
  containers: {
    maxWidths: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      full: string;
    };
    
    padding: {
      page: string;
      section: string;
      card: string;
      button: string;
      input: string;
    };
  };
  
  // Component-specific styles
  components: {
    card: {
      background: string;
      border: string;
      borderRadius: string;
      padding: string;
      shadow: string;
      
      variants: {
        flat: Partial<CardStyle>;
        elevated: Partial<CardStyle>;
        outlined: Partial<CardStyle>;
        glassmorphic: Partial<CardStyle>;
      };
    };
    
    button: {
      height: string;
      padding: string;
      borderRadius: string;
      fontSize: string;
      fontWeight: string;
      
      variants: {
        primary: ButtonStyle;
        secondary: ButtonStyle;
        ghost: ButtonStyle;
        outline: ButtonStyle;
        destructive: ButtonStyle;
      };
      
      sizes: {
        sm: Partial<ButtonStyle>;
        md: Partial<ButtonStyle>;
        lg: Partial<ButtonStyle>;
        xl: Partial<ButtonStyle>;
      };
    };
    
    input: {
      height: string;
      padding: string;
      borderRadius: string;
      border: string;
      background: string;
      fontSize: string;
      
      variants: {
        default: InputStyle;
        filled: InputStyle;
        outlined: InputStyle;
        underlined: InputStyle;
      };
    };
    
    // ... more components
  };
  
  // Background patterns & images
  backgrounds: {
    patterns: {
      none: string;
      dots: string;
      grid: string;
      lines: string;
      waves: string;
      custom: Record<string, string>;
    };
    
    images: {
      hero: string;
      page: string;
      section: string;
      card: string;
      custom: Record<string, string>;
    };
    
    gradients: {
      none: string;
      subtle: string;
      vibrant: string;
      dark: string;
      custom: Record<string, string>;
    };
  };
  
  // Layout preferences
  layout: {
    contentWidth: string;
    sidebarWidth: string;
    headerHeight: string;
    footerHeight: string;
    
    gridGap: string;
    sectionSpacing: string;
    componentSpacing: string;
  };
}

// Theme Builder Component
export const ThemeBuilder: React.FC = () => {
  const { currentOrg, updateOrgSettings } = useOrganization();
  const [theme, setTheme] = useState<DeepTheme>(currentOrg.theme || defaultTheme);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark' | 'custom'>('custom');
  
  return (
    <div className="theme-builder">
      <ThemeBuilderSidebar>
        <ColorPicker
          label="Primary Color"
          value={theme.colors.primary}
          onChange={(color) => updateThemeColor('primary', color)}
        />
        
        <FontPicker
          label="Heading Font"
          value={theme.typography.fontFamilies.heading}
          onChange={(font) => updateThemeFont('heading', font)}
        />
        
        <SpacingControl
          label="Base Spacing"
          value={theme.spacing.base}
          onChange={(spacing) => updateThemeSpacing(spacing)}
        />
        
        <BorderRadiusControl
          label="Corner Radius"
          value={theme.borders.radius}
          onChange={(radius) => updateThemeBorderRadius(radius)}
        />
        
        <BackgroundPicker
          label="Page Background"
          value={theme.backgrounds.images.page}
          onChange={(bg) => updateThemeBackground('page', bg)}
        />
        
        <PatternPicker
          label="Background Pattern"
          value={theme.backgrounds.patterns}
          onChange={(pattern) => updateThemePattern(pattern)}
        />
        
        <ComponentStyler
          component="card"
          styles={theme.components.card}
          onChange={(styles) => updateComponentStyle('card', styles)}
        />
        
        <ComponentStyler
          component="button"
          styles={theme.components.button}
          onChange={(styles) => updateComponentStyle('button', styles)}
        />
      </ThemeBuilderSidebar>
      
      <ThemePreview theme={theme} mode={previewMode}>
        <PreviewComponents />
      </ThemePreview>
      
      <ThemeBuilderActions>
        <Button onClick={saveTheme}>Save Theme</Button>
        <Button onClick={exportTheme}>Export CSS</Button>
        <Button onClick={shareTheme}>Share Theme</Button>
      </ThemeBuilderActions>
    </div>
  );
};

// Apply theme to application
export const ThemeProvider: React.FC = ({ children }) => {
  const { currentOrg } = useOrganization();
  const theme = currentOrg?.theme || defaultTheme;
  
  useEffect(() => {
    // Apply CSS variables
    const root = document.documentElement;
    
    // Colors
    Object.entries(theme.colors).forEach(([key, scale]) => {
      if (typeof scale === 'object') {
        Object.entries(scale).forEach(([shade, value]) => {
          root.style.setProperty(`--color-${key}-${shade}`, value);
        });
      }
    });
    
    // Typography
    root.style.setProperty('--font-heading', theme.typography.fontFamilies.heading);
    root.style.setProperty('--font-body', theme.typography.fontFamilies.body);
    
    Object.entries(theme.typography.fontSizes).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });
    
    // Spacing
    theme.spacing.scale.forEach((multiplier, index) => {
      const value = theme.spacing.base * multiplier;
      root.style.setProperty(`--spacing-${index}`, `${value}px`);
    });
    
    // Borders
    Object.entries(theme.borders.radius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
    
    // Shadows
    Object.entries(theme.effects.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
    
    // Backgrounds
    if (theme.backgrounds.images.page) {
      root.style.setProperty('--bg-page-image', `url(${theme.backgrounds.images.page})`);
    }
    
    if (theme.backgrounds.patterns.custom) {
      root.style.setProperty('--bg-pattern', theme.backgrounds.patterns.custom);
    }
    
    // Component styles
    Object.entries(theme.components).forEach(([component, styles]) => {
      Object.entries(styles).forEach(([prop, value]) => {
        if (typeof value === 'string') {
          root.style.setProperty(`--${component}-${prop}`, value);
        }
      });
    });
    
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## 6. Dynamic Container System

### Modular Container Sizes & Layouts

```typescript
// types/ContainerSystem.ts
export interface ContainerConfig {
  // Container types
  types: {
    full: ContainerStyle;
    wide: ContainerStyle;
    normal: ContainerStyle;
    narrow: ContainerStyle;
    compact: ContainerStyle;
    custom: Record<string, ContainerStyle>;
  };
  
  // Responsive behavior
  responsive: {
    breakpoints: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      '2xl': number;
    };
    
    containerQueries: boolean;
  };
}

export interface ContainerStyle {
  maxWidth: string;
  padding: {
    x: string;
    y: string;
  };
  margin: {
    x: string;
    y: string;
  };
  
  // Optional styling
  background?: string;
  border?: string;
  borderRadius?: string;
  shadow?: string;
  
  // Grid behavior
  grid?: {
    columns: number;
    gap: string;
    alignItems: string;
    justifyContent: string;
  };
  
  // Flex behavior
  flex?: {
    direction: 'row' | 'column';
    wrap: boolean;
    gap: string;
    alignItems: string;
    justifyContent: string;
  };
}

// Dynamic Container Component
export const DynamicContainer: React.FC<{
  type?: keyof ContainerConfig['types'];
  override?: Partial<ContainerStyle>;
  children: React.ReactNode;
}> = ({ type = 'normal', override, children }) => {
  const { currentOrg } = useOrganization();
  const containerConfig = currentOrg?.theme.containers || defaultContainers;
  
  const style = {
    ...containerConfig.types[type],
    ...override
  };
  
  return (
    <div 
      className="dynamic-container"
      style={{
        maxWidth: style.maxWidth,
        paddingLeft: style.padding.x,
        paddingRight: style.padding.x,
        paddingTop: style.padding.y,
        paddingBottom: style.padding.y,
        marginLeft: style.margin.x,
        marginRight: style.margin.x,
        marginTop: style.margin.y,
        marginBottom: style.margin.y,
        background: style.background,
        border: style.border,
        borderRadius: style.borderRadius,
        boxShadow: style.shadow
      }}
    >
      {children}
    </div>
  );
};
```

## 7. Feature Marketplace

### Allow Clubs to Browse and Install Features

```typescript
// types/FeatureMarketplace.ts
export interface MarketplaceItem {
  id: string;
  type: 'feature' | 'theme' | 'widget' | 'integration';
  
  // Metadata
  name: string;
  description: string;
  author: string;
  version: string;
  
  // Visuals
  icon: string;
  screenshots: string[];
  video?: string;
  
  // Pricing
  pricing: {
    model: 'free' | 'onetime' | 'subscription';
    price: number;
    currency: string;
    trial?: number; // days
  };
  
  // Stats
  stats: {
    installs: number;
    rating: number;
    reviews: number;
  };
  
  // Requirements
  requirements: {
    minVersion: string;
    dependencies: string[];
    conflicts: string[];
  };
  
  // Installation
  package: {
    url: string;
    size: number;
    checksum: string;
  };
}

// Marketplace Browser Component
export const FeatureMarketplace: React.FC = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filter, setFilter] = useState({
    type: 'all',
    category: 'all',
    pricing: 'all',
    search: ''
  });
  
  return (
    <MarketplaceContainer>
      <MarketplaceHeader>
        <SearchBar 
          value={filter.search}
          onChange={(search) => setFilter({...filter, search})}
        />
        
        <FilterBar>
          <Select
            value={filter.type}
            onChange={(type) => setFilter({...filter, type})}
            options={['all', 'feature', 'theme', 'widget', 'integration']}
          />
          
          <Select
            value={filter.pricing}
            onChange={(pricing) => setFilter({...filter, pricing})}
            options={['all', 'free', 'paid']}
          />
        </FilterBar>
      </MarketplaceHeader>
      
      <MarketplaceGrid>
        {items.map(item => (
          <MarketplaceCard
            key={item.id}
            item={item}
            onInstall={() => installFeature(item)}
            onPreview={() => previewFeature(item)}
          />
        ))}
      </MarketplaceGrid>
    </MarketplaceContainer>
  );
};
```

## 8. Implementation Strategy

### Phase 1: Core Modularity (Week 1-2)
1. Implement feature variant system
2. Create sub-feature plugin architecture
3. Build dynamic component registry

### Phase 2: UI Customization (Week 3-4)
1. Implement deep theme system
2. Create visual customization builder
3. Build container configuration system

### Phase 3: Dashboard & Navigation (Week 5-6)
1. Implement drag-drop dashboard builder
2. Create multiple navigation styles
3. Build widget marketplace

### Phase 4: Testing & Optimization (Week 7-8)
1. Test all variant combinations
2. Optimize bundle sizes with code splitting
3. Create migration tools for existing clubs

## Conclusion

This architecture provides:
- **Feature Variants**: Multiple styles for every feature
- **Sub-Features**: Granular plugin system within features
- **Visual Customization**: Every pixel can be themed
- **Dashboard Composition**: Full drag-drop customization
- **Navigation Flexibility**: Multiple positions and styles
- **Container Modularity**: Flexible layouts and sizes
- **Background Customization**: Patterns, images, gradients
- **Component Theming**: Deep customization of all UI elements

Each club becomes truly unique while sharing the same codebase.