# Detailed Modular Multi-Tenant Architecture

## Table of Contents
1. [Core Architecture Philosophy](#core-architecture-philosophy)
2. [Plugin-Based Feature System](#plugin-based-feature-system)
3. [Database Isolation Strategy](#database-isolation-strategy)
4. [Configuration Management](#configuration-management)
5. [UI Composition System](#ui-composition-system)
6. [API & Service Layer](#api--service-layer)
7. [Security & Isolation](#security--isolation)
8. [Implementation Roadmap](#implementation-roadmap)

## Core Architecture Philosophy

### Principles
1. **Complete Modularity**: Every feature is a self-contained plugin
2. **Zero Dependencies**: Features work independently (unless explicitly dependent)
3. **Configuration Over Code**: Behavior controlled through configuration
4. **Tenant Isolation**: Complete data and feature separation
5. **Progressive Enhancement**: Core functionality with optional additions

### Architecture Layers
```
┌─────────────────────────────────────────────┐
│           iOS Native Shell (Capacitor)      │
├─────────────────────────────────────────────┤
│          Multi-Tenant Application Layer     │
├─────────────────────────────────────────────┤
│              Feature Plugin System          │
├─────────────────────────────────────────────┤
│             Core Platform Services          │
├─────────────────────────────────────────────┤
│          Supabase Backend Services          │
└─────────────────────────────────────────────┘
```

## Plugin-Based Feature System

### Feature Plugin Structure
```typescript
// types/FeaturePlugin.ts
export interface FeaturePlugin {
  // Metadata
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  category: 'social' | 'events' | 'wellness' | 'commerce' | 'admin';
  
  // Dependencies
  dependencies: {
    required: string[];  // Must have these features
    optional: string[];  // Enhanced if these exist
    conflicts: string[]; // Cannot coexist with these
  };
  
  // Pricing & Limits
  pricing: {
    tier: 'free' | 'starter' | 'pro' | 'enterprise';
    usage: {
      metric: string;      // 'events', 'members', 'storage'
      included: number;    // Included in base
      overage: number;     // Cost per additional unit
    };
  };
  
  // Database Requirements
  database: {
    tables: TableDefinition[];
    migrations: Migration[];
    seedData?: SeedData[];
  };
  
  // UI Components
  components: {
    // Page components
    pages: Map<string, LazyComponent>;
    
    // Dashboard widgets
    widgets: Map<string, WidgetComponent>;
    
    // Settings panels
    settings: Map<string, SettingsComponent>;
    
    // Mobile specific
    mobile: Map<string, MobileComponent>;
  };
  
  // Routes
  routes: RouteDefinition[];
  
  // Navigation items
  navigation: {
    main: NavItem[];
    mobile: NavItem[];
    admin: NavItem[];
  };
  
  // API endpoints
  api: {
    endpoints: ApiEndpoint[];
    webhooks: WebhookHandler[];
  };
  
  // Permissions
  permissions: Permission[];
  
  // Lifecycle hooks
  hooks: {
    onInstall: (tenant: Tenant) => Promise<void>;
    onUninstall: (tenant: Tenant) => Promise<void>;
    onEnable: (tenant: Tenant) => Promise<void>;
    onDisable: (tenant: Tenant) => Promise<void>;
    onUpgrade: (tenant: Tenant, fromVersion: string) => Promise<void>;
  };
  
  // Configuration schema
  configSchema: JSONSchema;
  
  // Event handlers
  events: {
    emit: string[];     // Events this plugin emits
    listen: string[];   // Events this plugin listens to
  };
}
```

### Core Feature Plugins

#### 1. Events Plugin
```typescript
// plugins/events/index.ts
export const EventsPlugin: FeaturePlugin = {
  id: 'events',
  name: 'Event Management',
  version: '1.0.0',
  category: 'events',
  
  dependencies: {
    required: [],
    optional: ['payments', 'loyalty', 'messaging'],
    conflicts: []
  },
  
  database: {
    tables: [
      {
        name: 'events',
        columns: {
          id: 'UUID PRIMARY KEY',
          organization_id: 'UUID REFERENCES organizations(id)',
          title: 'TEXT NOT NULL',
          description: 'TEXT',
          start_date: 'TIMESTAMP',
          end_date: 'TIMESTAMP',
          location: 'JSONB',
          capacity: 'INTEGER',
          price_cents: 'INTEGER',
          loyalty_points_price: 'INTEGER',
          registration_required: 'BOOLEAN DEFAULT true',
          status: 'event_status DEFAULT "draft"'
        }
      },
      {
        name: 'event_registrations',
        columns: {
          id: 'UUID PRIMARY KEY',
          event_id: 'UUID REFERENCES events(id)',
          user_id: 'UUID REFERENCES users(id)',
          organization_id: 'UUID REFERENCES organizations(id)',
          status: 'registration_status',
          payment_method: 'TEXT',
          created_at: 'TIMESTAMP DEFAULT NOW()'
        }
      }
    ]
  },
  
  components: {
    pages: new Map([
      ['events-list', lazy(() => import('./pages/EventsList'))],
      ['event-details', lazy(() => import('./pages/EventDetails'))],
      ['create-event', lazy(() => import('./pages/CreateEvent'))]
    ]),
    
    widgets: new Map([
      ['upcoming-events', lazy(() => import('./widgets/UpcomingEvents'))],
      ['event-calendar', lazy(() => import('./widgets/EventCalendar'))]
    ]),
    
    settings: new Map([
      ['event-settings', lazy(() => import('./settings/EventSettings'))]
    ])
  },
  
  routes: [
    { path: '/events', component: 'events-list' },
    { path: '/events/:id', component: 'event-details' },
    { path: '/events/create', component: 'create-event', requiresRole: 'admin' }
  ],
  
  navigation: {
    main: [
      { label: 'Events', icon: Calendar, path: '/events', order: 20 }
    ],
    mobile: [
      { label: 'Events', icon: Calendar, path: '/events', order: 20 }
    ],
    admin: [
      { label: 'Manage Events', path: '/admin/events', order: 30 }
    ]
  },
  
  permissions: [
    { key: 'events.view', name: 'View Events', default: 'member' },
    { key: 'events.create', name: 'Create Events', default: 'admin' },
    { key: 'events.edit', name: 'Edit Events', default: 'admin' },
    { key: 'events.delete', name: 'Delete Events', default: 'owner' }
  ],
  
  configSchema: {
    type: 'object',
    properties: {
      requireApproval: { type: 'boolean', default: false },
      allowGuestRegistration: { type: 'boolean', default: false },
      defaultCapacity: { type: 'number', default: 50 },
      cancellationPolicy: {
        type: 'object',
        properties: {
          allowCancellation: { type: 'boolean', default: true },
          refundWindow: { type: 'number', default: 24 }
        }
      }
    }
  },
  
  hooks: {
    onInstall: async (tenant) => {
      // Create default event categories
      await createDefaultCategories(tenant.id);
    },
    onEnable: async (tenant) => {
      // Check if payments plugin is enabled for enhanced features
      if (tenant.hasFeature('payments')) {
        await enablePaymentIntegration(tenant.id);
      }
    }
  }
};
```

#### 2. Social Plugin
```typescript
// plugins/social/index.ts
export const SocialPlugin: FeaturePlugin = {
  id: 'social',
  name: 'Social Feed',
  version: '1.0.0',
  category: 'social',
  
  dependencies: {
    required: [],
    optional: ['messaging', 'media-storage'],
    conflicts: []
  },
  
  database: {
    tables: [
      {
        name: 'posts',
        columns: {
          id: 'UUID PRIMARY KEY',
          organization_id: 'UUID REFERENCES organizations(id)',
          user_id: 'UUID REFERENCES users(id)',
          content: 'TEXT',
          media: 'JSONB',
          visibility: 'post_visibility DEFAULT "organization"',
          created_at: 'TIMESTAMP DEFAULT NOW()'
        }
      },
      {
        name: 'post_reactions',
        columns: {
          id: 'UUID PRIMARY KEY',
          post_id: 'UUID REFERENCES posts(id)',
          user_id: 'UUID REFERENCES users(id)',
          reaction_type: 'TEXT',
          created_at: 'TIMESTAMP DEFAULT NOW()'
        }
      }
    ]
  },
  
  components: {
    pages: new Map([
      ['feed', lazy(() => import('./pages/Feed'))],
      ['post-detail', lazy(() => import('./pages/PostDetail'))]
    ]),
    widgets: new Map([
      ['recent-posts', lazy(() => import('./widgets/RecentPosts'))],
      ['trending-topics', lazy(() => import('./widgets/TrendingTopics'))]
    ])
  }
};
```

### Feature Registry System
```typescript
// services/FeatureRegistry.ts
export class FeatureRegistry {
  private plugins: Map<string, FeaturePlugin> = new Map();
  private enabledFeatures: Map<string, Set<string>> = new Map(); // org_id -> features
  
  // Register a plugin
  registerPlugin(plugin: FeaturePlugin): void {
    this.validatePlugin(plugin);
    this.plugins.set(plugin.id, plugin);
  }
  
  // Get all available plugins
  getAvailablePlugins(): FeaturePlugin[] {
    return Array.from(this.plugins.values());
  }
  
  // Get plugins by category
  getPluginsByCategory(category: string): FeaturePlugin[] {
    return this.getAvailablePlugins()
      .filter(p => p.category === category);
  }
  
  // Check dependencies
  canEnablePlugin(pluginId: string, enabledPlugins: string[]): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    
    // Check required dependencies
    const hasRequired = plugin.dependencies.required
      .every(dep => enabledPlugins.includes(dep));
    
    // Check conflicts
    const hasConflicts = plugin.dependencies.conflicts
      .some(conf => enabledPlugins.includes(conf));
    
    return hasRequired && !hasConflicts;
  }
  
  // Get plugin with dependencies
  getPluginWithDependencies(pluginId: string): string[] {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return [];
    
    const deps = new Set<string>([pluginId]);
    
    // Recursively add required dependencies
    plugin.dependencies.required.forEach(depId => {
      this.getPluginWithDependencies(depId)
        .forEach(d => deps.add(d));
    });
    
    return Array.from(deps);
  }
  
  // Calculate pricing for selected plugins
  calculatePricing(pluginIds: string[]): PricingBreakdown {
    let total = 0;
    const breakdown: PricingItem[] = [];
    
    pluginIds.forEach(id => {
      const plugin = this.plugins.get(id);
      if (plugin) {
        const price = this.getPluginPrice(plugin);
        total += price;
        breakdown.push({
          plugin: plugin.name,
          price
        });
      }
    });
    
    return { total, breakdown };
  }
}
```

## Database Isolation Strategy

### Three-Tier Isolation Model

#### Tier 1: Shared Tables (Platform Level)
```sql
-- Global platform data
CREATE SCHEMA platform;

-- User accounts (can belong to multiple orgs)
CREATE TABLE platform.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Organizations
CREATE TABLE platform.organizations (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES platform.users(id),
  subscription_tier TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Organization memberships
CREATE TABLE platform.organization_members (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES platform.organizations(id),
  user_id UUID REFERENCES platform.users(id),
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Feature enablement
CREATE TABLE platform.organization_features (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES platform.organizations(id),
  feature_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  enabled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, feature_id)
);
```

#### Tier 2: Tenant-Scoped Tables (Shared Schema)
```sql
-- All feature tables include organization_id
CREATE SCHEMA tenant;

-- Example: Events (scoped to organization)
CREATE TABLE tenant.events (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES platform.organizations(id),
  title TEXT NOT NULL,
  -- ... other columns
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy for tenant isolation
CREATE POLICY tenant_isolation ON tenant.events
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM platform.organization_members 
      WHERE user_id = auth.uid()
    )
  );
```

#### Tier 3: Dedicated Schemas (Enterprise Tenants)
```sql
-- For enterprise customers with strict isolation requirements
CREATE SCHEMA org_${organization_slug};

-- Clone all tenant tables into dedicated schema
CREATE TABLE org_acme.events AS TABLE tenant.events WITH NO DATA;
-- Add constraints and indexes
```

### Dynamic Schema Management
```typescript
// services/SchemaManager.ts
export class SchemaManager {
  async provisionOrganization(org: Organization): Promise<void> {
    // Determine isolation level based on subscription
    const isolationLevel = this.getIsolationLevel(org.subscription_tier);
    
    switch (isolationLevel) {
      case 'shared':
        // No schema creation needed, uses shared tables
        await this.grantSharedAccess(org.id);
        break;
        
      case 'isolated':
        // Create dedicated schema
        await this.createDedicatedSchema(org.slug);
        await this.cloneTables(org.slug);
        await this.setupRLS(org.slug);
        break;
        
      case 'custom':
        // Enterprise custom setup
        await this.customProvisioning(org);
        break;
    }
  }
  
  async enableFeature(orgId: string, plugin: FeaturePlugin): Promise<void> {
    const org = await this.getOrganization(orgId);
    
    // Create plugin tables
    for (const table of plugin.database.tables) {
      await this.createTable(org, table);
    }
    
    // Run migrations
    for (const migration of plugin.database.migrations) {
      await this.runMigration(org, migration);
    }
    
    // Seed initial data
    if (plugin.database.seedData) {
      await this.seedData(org, plugin.database.seedData);
    }
  }
  
  private async createTable(org: Organization, table: TableDefinition): Promise<void> {
    const schema = this.getSchemaForOrg(org);
    
    const sql = `
      CREATE TABLE IF NOT EXISTS ${schema}.${table.name} (
        ${this.buildColumnDefinitions(table.columns)}
      );
    `;
    
    await this.executeSQL(sql);
    
    // Add RLS policies
    await this.addRLSPolicies(schema, table.name, org.id);
  }
}
```

## Configuration Management

### Multi-Level Configuration System

#### Level 1: Platform Configuration
```typescript
// config/platform.config.ts
export interface PlatformConfig {
  // Global limits
  limits: {
    maxOrganizationsPerUser: number;
    maxMembersPerOrganization: number;
    maxStoragePerOrganization: number; // GB
    maxApiRequestsPerMinute: number;
  };
  
  // Feature availability
  availableFeatures: string[];
  
  // Subscription tiers
  subscriptionTiers: {
    [key: string]: {
      name: string;
      price: number;
      features: string[];
      limits: Record<string, number>;
    };
  };
  
  // Security settings
  security: {
    passwordPolicy: PasswordPolicy;
    sessionTimeout: number;
    mfaRequired: boolean;
    ipWhitelisting: boolean;
  };
}
```

#### Level 2: Organization Configuration
```typescript
// config/organization.config.ts
export interface OrganizationConfig {
  // Basic settings
  general: {
    name: string;
    slug: string;
    logo: string;
    timezone: string;
    language: string;
  };
  
  // Branding
  branding: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    customCss?: string;
    emailTemplates?: Record<string, string>;
  };
  
  // Feature configurations
  features: {
    [featureId: string]: {
      enabled: boolean;
      config: any; // Feature-specific config
    };
  };
  
  // Member settings
  members: {
    allowSelfSignup: boolean;
    requireApproval: boolean;
    defaultRole: string;
    customRoles: Role[];
  };
  
  // Integrations
  integrations: {
    stripe?: {
      publicKey: string;
      webhookSecret: string;
    };
    smtp?: {
      host: string;
      port: number;
      user: string;
      from: string;
    };
  };
}
```

#### Level 3: User Preferences
```typescript
// config/user.preferences.ts
export interface UserPreferences {
  // UI preferences
  ui: {
    theme: 'light' | 'dark' | 'auto';
    density: 'compact' | 'comfortable' | 'spacious';
    sidebarCollapsed: boolean;
    language: string;
  };
  
  // Notification preferences
  notifications: {
    email: {
      enabled: boolean;
      frequency: 'instant' | 'daily' | 'weekly';
      categories: string[];
    };
    push: {
      enabled: boolean;
      categories: string[];
    };
    inApp: {
      enabled: boolean;
      sound: boolean;
    };
  };
  
  // Feature preferences
  features: {
    [featureId: string]: any;
  };
}
```

### Configuration Service
```typescript
// services/ConfigurationService.ts
export class ConfigurationService {
  private platformConfig: PlatformConfig;
  private orgConfigs: Map<string, OrganizationConfig> = new Map();
  private userPrefs: Map<string, UserPreferences> = new Map();
  
  // Get merged configuration for current context
  getConfiguration(context: AppContext): MergedConfig {
    const platform = this.platformConfig;
    const org = this.orgConfigs.get(context.organizationId);
    const user = this.userPrefs.get(context.userId);
    
    // Merge with precedence: User > Org > Platform
    return this.mergeConfigs(platform, org, user);
  }
  
  // Update organization configuration
  async updateOrgConfig(
    orgId: string,
    updates: Partial<OrganizationConfig>
  ): Promise<void> {
    const current = this.orgConfigs.get(orgId);
    const updated = { ...current, ...updates };
    
    // Validate against platform limits
    this.validateOrgConfig(updated);
    
    // Save to database
    await supabase
      .from('organization_configs')
      .upsert({ 
        organization_id: orgId,
        config: updated 
      });
    
    // Update cache
    this.orgConfigs.set(orgId, updated);
    
    // Broadcast update to all org members
    this.broadcastConfigUpdate(orgId, updated);
  }
  
  // Get feature configuration
  getFeatureConfig(featureId: string, context: AppContext): any {
    const config = this.getConfiguration(context);
    return config.features[featureId]?.config || {};
  }
  
  // Check feature availability
  isFeatureEnabled(featureId: string, context: AppContext): boolean {
    const org = this.orgConfigs.get(context.organizationId);
    
    // Check if feature is enabled for organization
    if (!org?.features[featureId]?.enabled) {
      return false;
    }
    
    // Check if user has permission
    return this.checkFeaturePermission(featureId, context.userId);
  }
}
```

## UI Composition System

### Dynamic Component Registry
```typescript
// ui/ComponentRegistry.ts
export class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map();
  private layouts: Map<string, LayoutDefinition> = new Map();
  
  // Register a component
  registerComponent(definition: ComponentDefinition): void {
    this.components.set(definition.id, definition);
  }
  
  // Get component for current context
  getComponent(
    componentId: string, 
    context: AppContext
  ): React.ComponentType | null {
    const def = this.components.get(componentId);
    if (!def) return null;
    
    // Check if component's feature is enabled
    if (def.featureId && !context.hasFeature(def.featureId)) {
      return null;
    }
    
    // Return appropriate variant
    if (context.isMobile && def.mobileComponent) {
      return def.mobileComponent;
    }
    
    return def.component;
  }
  
  // Build layout for current context
  buildLayout(context: AppContext): LayoutStructure {
    const enabledFeatures = context.getEnabledFeatures();
    
    // Get base layout
    const baseLayout = this.layouts.get(context.layoutType) || this.getDefaultLayout();
    
    // Filter components based on enabled features
    const filteredSections = baseLayout.sections.map(section => ({
      ...section,
      components: section.components.filter(compId => {
        const comp = this.components.get(compId);
        return !comp?.featureId || enabledFeatures.includes(comp.featureId);
      })
    }));
    
    return {
      ...baseLayout,
      sections: filteredSections
    };
  }
}
```

### Adaptive Dashboard System
```typescript
// ui/AdaptiveDashboard.tsx
export const AdaptiveDashboard: React.FC = () => {
  const context = useAppContext();
  const registry = useComponentRegistry();
  
  // Get dashboard configuration for current org
  const dashboardConfig = context.getConfig('dashboard');
  
  // Get enabled widgets based on features
  const widgets = useMemo(() => {
    return registry.getWidgetsForContext(context);
  }, [context.organizationId, context.enabledFeatures]);
  
  // Build layout
  const layout = useMemo(() => {
    if (context.isMobile) {
      return <MobileDashboardLayout widgets={widgets} />;
    }
    
    if (context.isTablet) {
      return <TabletDashboardLayout widgets={widgets} />;
    }
    
    return <DesktopDashboardLayout widgets={widgets} config={dashboardConfig} />;
  }, [context.device, widgets, dashboardConfig]);
  
  return (
    <DashboardProvider config={dashboardConfig}>
      <ErrorBoundary fallback={<DashboardError />}>
        <Suspense fallback={<DashboardSkeleton />}>
          {layout}
        </Suspense>
      </ErrorBoundary>
    </DashboardProvider>
  );
};

// Desktop layout with drag-and-drop
const DesktopDashboardLayout: React.FC<{widgets: Widget[], config: DashboardConfig}> = ({
  widgets,
  config
}) => {
  const [layout, setLayout] = useState(config.layout || generateDefaultLayout(widgets));
  
  return (
    <GridLayout
      layout={layout}
      onLayoutChange={setLayout}
      cols={12}
      rowHeight={60}
      draggableHandle=".widget-handle"
    >
      {widgets.map(widget => (
        <div key={widget.id} className="dashboard-widget">
          <WidgetWrapper widget={widget} />
        </div>
      ))}
    </GridLayout>
  );
};
```

### Dynamic Navigation System
```typescript
// ui/DynamicNavigation.tsx
export const DynamicNavigation: React.FC = () => {
  const context = useAppContext();
  const registry = useFeatureRegistry();
  
  // Build navigation items based on enabled features
  const navItems = useMemo(() => {
    const items: NavItem[] = [];
    
    // Add core navigation
    items.push(
      { path: '/dashboard', label: 'Dashboard', icon: Home, order: 0 }
    );
    
    // Add feature navigation
    context.enabledFeatures.forEach(featureId => {
      const feature = registry.getPlugin(featureId);
      if (feature?.navigation.main) {
        items.push(...feature.navigation.main);
      }
    });
    
    // Add admin navigation if user is admin
    if (context.isAdmin) {
      items.push(
        { path: '/admin', label: 'Admin', icon: Settings, order: 100 }
      );
    }
    
    // Sort by order
    return items.sort((a, b) => a.order - b.order);
  }, [context.enabledFeatures, context.isAdmin]);
  
  if (context.isMobile) {
    return <MobileBottomNav items={navItems} />;
  }
  
  return <DesktopSidebar items={navItems} />;
};
```

## API & Service Layer

### Multi-Tenant API Gateway
```typescript
// api/MultiTenantGateway.ts
export class MultiTenantGateway {
  private middleware: Middleware[] = [];
  
  constructor() {
    // Core middleware
    this.use(this.extractTenantContext);
    this.use(this.validateAuthentication);
    this.use(this.checkFeatureAccess);
    this.use(this.applyRateLimiting);
    this.use(this.logRequest);
  }
  
  // Extract tenant context from request
  private extractTenantContext: Middleware = async (req, res, next) => {
    // Get from subdomain: acme.app.com
    const subdomain = req.hostname.split('.')[0];
    
    // Or from header: X-Organization-Id
    const headerOrgId = req.headers['x-organization-id'];
    
    // Or from JWT token
    const tokenOrgId = req.user?.organizationId;
    
    const orgId = subdomain || headerOrgId || tokenOrgId;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }
    
    // Load organization
    const org = await this.loadOrganization(orgId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Set context
    req.context = {
      organizationId: org.id,
      organization: org,
      enabledFeatures: await this.getEnabledFeatures(org.id),
      config: await this.getOrgConfig(org.id)
    };
    
    next();
  };
  
  // Check feature access
  private checkFeatureAccess: Middleware = async (req, res, next) => {
    const feature = this.getFeatureFromRoute(req.path);
    
    if (feature && !req.context.enabledFeatures.includes(feature)) {
      return res.status(403).json({ 
        error: 'Feature not enabled',
        feature,
        upgrade_url: '/upgrade'
      });
    }
    
    next();
  };
  
  // Apply rate limiting per organization
  private applyRateLimiting: Middleware = async (req, res, next) => {
    const limit = this.getRateLimit(req.context.organization.subscription_tier);
    
    const key = `rate_limit:${req.context.organizationId}:${req.ip}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, 60); // 1 minute window
    }
    
    if (count > limit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        limit,
        window: '1 minute'
      });
    }
    
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - count);
    
    next();
  };
}
```

### Service Layer with Tenant Context
```typescript
// services/TenantAwareService.ts
export abstract class TenantAwareService {
  protected context: AppContext;
  
  constructor(context: AppContext) {
    this.context = context;
  }
  
  // Get scoped Supabase client
  protected getSupabase() {
    // Return client with RLS context set
    return createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        global: {
          headers: {
            'x-organization-id': this.context.organizationId
          }
        }
      }
    );
  }
  
  // Query with automatic org filtering
  protected async query<T>(
    table: string,
    query: QueryBuilder<T>
  ): Promise<T[]> {
    const supabase = this.getSupabase();
    
    // Automatically add organization filter
    const result = await supabase
      .from(table)
      .select(query.select || '*')
      .eq('organization_id', this.context.organizationId)
      .filter(query.filters || {});
    
    if (result.error) {
      throw new ServiceError(result.error.message);
    }
    
    return result.data;
  }
  
  // Check feature availability
  protected requireFeature(featureId: string): void {
    if (!this.context.hasFeature(featureId)) {
      throw new FeatureNotEnabledError(featureId);
    }
  }
  
  // Get feature configuration
  protected getFeatureConfig<T>(featureId: string): T {
    return this.context.getFeatureConfig(featureId);
  }
}

// Example service implementation
export class EventService extends TenantAwareService {
  async getEvents(filters?: EventFilters): Promise<Event[]> {
    // Check if events feature is enabled
    this.requireFeature('events');
    
    // Get feature configuration
    const config = this.getFeatureConfig<EventConfig>('events');
    
    // Query with automatic org filtering
    return this.query('events', {
      select: '*',
      filters: {
        ...filters,
        status: config.showDraftEvents ? undefined : 'published'
      }
    });
  }
  
  async createEvent(data: CreateEventData): Promise<Event> {
    this.requireFeature('events');
    
    // Check permissions
    if (!this.context.hasPermission('events.create')) {
      throw new PermissionDeniedError('events.create');
    }
    
    // Get configuration
    const config = this.getFeatureConfig<EventConfig>('events');
    
    // Apply defaults from config
    const eventData = {
      ...data,
      organization_id: this.context.organizationId,
      requires_approval: config.requireApproval,
      capacity: data.capacity || config.defaultCapacity
    };
    
    // Create event
    const supabase = this.getSupabase();
    const result = await supabase
      .from('events')
      .insert(eventData)
      .single();
    
    if (result.error) {
      throw new ServiceError(result.error.message);
    }
    
    // Send notifications if enabled
    if (config.notifyOnNewEvent) {
      await this.notifyNewEvent(result.data);
    }
    
    return result.data;
  }
}
```

## Security & Isolation

### Complete Tenant Isolation
```typescript
// security/TenantIsolation.ts
export class TenantIsolation {
  // Validate all queries include organization context
  static validateQuery(query: any, context: AppContext): void {
    if (!query.organization_id) {
      throw new SecurityError('Query must include organization_id');
    }
    
    if (query.organization_id !== context.organizationId) {
      throw new SecurityError('Cross-organization access denied');
    }
  }
  
  // Create RLS policies for a table
  static async createRLSPolicies(
    table: string,
    orgColumn: string = 'organization_id'
  ): Promise<void> {
    const policies = [
      // SELECT policy
      `
      CREATE POLICY ${table}_select_policy ON ${table}
      FOR SELECT USING (
        ${orgColumn} IN (
          SELECT organization_id 
          FROM platform.organization_members 
          WHERE user_id = auth.uid()
        )
      )
      `,
      
      // INSERT policy
      `
      CREATE POLICY ${table}_insert_policy ON ${table}
      FOR INSERT WITH CHECK (
        ${orgColumn} IN (
          SELECT organization_id 
          FROM platform.organization_members 
          WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
        )
      )
      `,
      
      // UPDATE policy
      `
      CREATE POLICY ${table}_update_policy ON ${table}
      FOR UPDATE USING (
        ${orgColumn} IN (
          SELECT organization_id 
          FROM platform.organization_members 
          WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
        )
      )
      `,
      
      // DELETE policy
      `
      CREATE POLICY ${table}_delete_policy ON ${table}
      FOR DELETE USING (
        ${orgColumn} IN (
          SELECT organization_id 
          FROM platform.organization_members 
          WHERE user_id = auth.uid()
          AND role = 'owner'
        )
      )
      `
    ];
    
    for (const policy of policies) {
      await supabase.rpc('execute_sql', { sql: policy });
    }
  }
}
```

### Permission System
```typescript
// security/PermissionSystem.ts
export class PermissionSystem {
  private permissions: Map<string, Permission> = new Map();
  
  // Check if user has permission
  async hasPermission(
    userId: string,
    organizationId: string,
    permission: string
  ): Promise<boolean> {
    // Get user's role in organization
    const role = await this.getUserRole(userId, organizationId);
    
    // Get permission definition
    const perm = this.permissions.get(permission);
    if (!perm) return false;
    
    // Check if role has permission
    return perm.allowedRoles.includes(role);
  }
  
  // Get all permissions for a user
  async getUserPermissions(
    userId: string,
    organizationId: string
  ): Promise<string[]> {
    const role = await this.getUserRole(userId, organizationId);
    
    return Array.from(this.permissions.entries())
      .filter(([_, perm]) => perm.allowedRoles.includes(role))
      .map(([key, _]) => key);
  }
  
  // Create custom role
  async createCustomRole(
    organizationId: string,
    role: CustomRole
  ): Promise<void> {
    await supabase
      .from('custom_roles')
      .insert({
        organization_id: organizationId,
        name: role.name,
        permissions: role.permissions,
        created_by: this.getCurrentUserId()
      });
  }
}
```

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
```typescript
// Tasks:
const phase1Tasks = [
  // Database setup
  'Create platform schema',
  'Create organization tables',
  'Create feature registry tables',
  'Setup RLS policies',
  
  // Core services
  'Implement FeatureRegistry',
  'Implement ConfigurationService',
  'Implement TenantContext',
  'Implement SchemaManager',
  
  // Authentication
  'Update auth to support org context',
  'Implement org switching',
  'Add invitation system'
];
```

### Phase 2: Feature Plugin System (Week 3-4)
```typescript
// Tasks:
const phase2Tasks = [
  // Plugin architecture
  'Create plugin interface',
  'Implement plugin loader',
  'Create plugin manifest system',
  
  // Core plugins
  'Convert Events to plugin',
  'Convert Social to plugin',
  'Convert Challenges to plugin',
  'Convert Messaging to plugin',
  
  // Plugin management
  'Create plugin installation flow',
  'Implement dependency resolution',
  'Add plugin configuration UI'
];
```

### Phase 3: UI Composition (Week 5-6)
```typescript
// Tasks:
const phase3Tasks = [
  // Component registry
  'Implement ComponentRegistry',
  'Create dynamic layouts',
  'Add drag-and-drop dashboard',
  
  // Navigation
  'Implement dynamic navigation',
  'Add feature-based routing',
  'Create mobile navigation',
  
  // Theming
  'Implement per-org theming',
  'Add white-label support',
  'Create theme editor'
];
```

### Phase 4: Provisioning & Onboarding (Week 7-8)
```typescript
// Tasks:
const phase4Tasks = [
  // Provisioning
  'Create org provisioning flow',
  'Implement feature selection wizard',
  'Add payment integration',
  
  // Onboarding
  'Create welcome flow',
  'Add setup wizard',
  'Implement member invitation',
  
  // Migration
  'Migrate existing data',
  'Create migration tools',
  'Test rollback procedures'
];
```

### Phase 5: iOS Native App (Week 9-10)
```typescript
// Tasks:
const phase5Tasks = [
  // Capacitor setup
  'Configure Capacitor',
  'Setup iOS project',
  'Configure entitlements',
  
  // Native features
  'Implement push notifications',
  'Add biometric auth',
  'Setup deep linking',
  
  // App Store
  'Prepare submission',
  'Create screenshots',
  'Submit for review'
];
```

## Testing Strategy

### Multi-Tenant Testing
```typescript
// test/multi-tenant.test.ts
describe('Multi-Tenant Isolation', () => {
  it('should prevent cross-organization data access', async () => {
    // Create two organizations
    const org1 = await createOrganization('org1');
    const org2 = await createOrganization('org2');
    
    // Create users in each org
    const user1 = await createUser(org1);
    const user2 = await createUser(org2);
    
    // Create data in org1
    const event = await createEvent(org1, user1, { title: 'Org1 Event' });
    
    // Try to access from org2
    const result = await getEvent(event.id, user2);
    
    expect(result).toBeNull();
  });
  
  it('should isolate feature configurations', async () => {
    const org1 = await createOrganization('org1');
    const org2 = await createOrganization('org2');
    
    // Enable different features
    await enableFeature(org1, 'events', { requireApproval: true });
    await enableFeature(org2, 'events', { requireApproval: false });
    
    // Check configurations
    const config1 = await getFeatureConfig(org1, 'events');
    const config2 = await getFeatureConfig(org2, 'events');
    
    expect(config1.requireApproval).toBe(true);
    expect(config2.requireApproval).toBe(false);
  });
});
```

## Deployment Architecture

### Multi-Tenant Deployment
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Application instances
  app:
    image: girlsclub-platform:latest
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
      - MULTI_TENANT=true
    depends_on:
      - postgres
      - redis
  
  # Database with schemas
  postgres:
    image: postgres:15
    volumes:
      - ./init-schemas.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      - POSTGRES_DB=platform
      - POSTGRES_USER=platform
      - POSTGRES_PASSWORD=${DB_PASSWORD}
  
  # Cache for org configs
  redis:
    image: redis:7
    command: redis-server --appendonly yes
  
  # Load balancer
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"
```

This architecture provides:
- Complete modularity with plugin system
- Full tenant isolation at database level
- Dynamic UI composition based on features
- Flexible configuration at multiple levels
- Secure multi-tenant API layer
- Scalable deployment architecture

The key is treating each feature as a self-contained plugin that can be enabled/disabled per organization, with complete data isolation and configuration management.