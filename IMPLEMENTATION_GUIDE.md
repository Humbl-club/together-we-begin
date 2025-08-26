# Practical Implementation Guide: From Single to Multi-Tenant

## Starting Point: Your Current Architecture

### Current State Analysis
Based on your codebase, you have:
- **43 Supabase tables** - All currently sharing the same data space
- **54 custom hooks** - Directly accessing shared data
- **150+ components** - Hardcoded to single organization
- **4 Edge Functions** - Processing payments for single club
- **Dual messaging services** - No org isolation

## Step-by-Step Transformation

### Step 1: Database Foundation (Do This First!)

#### 1.1 Create Organization Tables
```sql
-- Run this migration in Supabase SQL editor
BEGIN;

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  settings JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization members
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, user_id)
);

-- Create feature management
CREATE TABLE IF NOT EXISTS organization_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  configuration JSONB DEFAULT '{}',
  enabled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enabled_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, feature_key)
);

-- Create feature catalog
CREATE TABLE IF NOT EXISTS feature_catalog (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  base_price DECIMAL(10,2) DEFAULT 0,
  dependencies TEXT[] DEFAULT '{}',
  conflicts TEXT[] DEFAULT '{}',
  configuration_schema JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert available features
INSERT INTO feature_catalog (key, name, description, category, base_price) VALUES
  ('events', 'Event Management', 'Create and manage events with registration', 'core', 0),
  ('challenges', 'Wellness Challenges', 'Step tracking and competitions', 'wellness', 10),
  ('social', 'Social Feed', 'Posts and community interaction', 'social', 0),
  ('messaging', 'Direct Messaging', 'Member-to-member messaging', 'social', 5),
  ('loyalty', 'Points & Rewards', 'Loyalty points system', 'commerce', 15),
  ('payments', 'Payment Processing', 'Stripe payment integration', 'commerce', 20);

-- Create indexes
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_features_org ON organization_features(organization_id);

COMMIT;
```

#### 1.2 Add Organization Context to Existing Tables
```sql
-- Add organization_id to all existing tables
BEGIN;

-- Add to profiles (extend existing)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES organizations(id);

-- Add to events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add to challenges  
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add to social_posts
ALTER TABLE social_posts
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add to direct_messages (for intra-org messaging)
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Continue for all 43 tables...

COMMIT;
```

#### 1.3 Create RLS Policies for Multi-Tenancy
```sql
-- Example RLS for events table
BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON events;

-- Create new multi-tenant policies
CREATE POLICY "Users see only their org events" ON events
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert events" ON events
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can update events" ON events
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Apply similar policies to all tables
COMMIT;
```

### Step 2: Create Organization Context Provider

#### 2.1 Transform Your AuthProvider
```typescript
// client/src/contexts/OrganizationContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface Organization {
  id: string;
  slug: string;
  name: string;
  settings: any;
  branding: any;
  features: string[];
}

interface OrganizationContextType {
  currentOrg: Organization | null;
  userOrgs: Organization[];
  switchOrg: (orgId: string) => Promise<void>;
  createOrg: (data: CreateOrgData) => Promise<Organization>;
  hasFeature: (feature: string) => boolean;
  getFeatureConfig: (feature: string) => any;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [userOrgs, setUserOrgs] = useState<Organization[]>([]);
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadUserOrganizations();
    }
  }, [user]);

  const loadUserOrganizations = async () => {
    // Get user's organizations
    const { data: memberships } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        organizations (
          id,
          slug,
          name,
          settings,
          branding
        )
      `)
      .eq('user_id', user!.id);

    if (memberships && memberships.length > 0) {
      const orgs = memberships.map(m => m.organizations).filter(Boolean);
      setUserOrgs(orgs);

      // Get saved preference or use first org
      const savedOrgId = localStorage.getItem(`preferred_org_${user!.id}`);
      const preferredOrg = orgs.find(o => o.id === savedOrgId) || orgs[0];
      
      await selectOrganization(preferredOrg);
    } else {
      // No organizations - show onboarding
      setCurrentOrg(null);
    }
  };

  const selectOrganization = async (org: Organization) => {
    // Load enabled features for this org
    const { data: features } = await supabase
      .from('organization_features')
      .select('feature_key, configuration')
      .eq('organization_id', org.id)
      .eq('enabled', true);

    const enabledFeatureKeys = features?.map(f => f.feature_key) || [];
    
    setCurrentOrg({
      ...org,
      features: enabledFeatureKeys
    });
    setEnabledFeatures(enabledFeatureKeys);

    // Save preference
    localStorage.setItem(`preferred_org_${user!.id}`, org.id);

    // Set organization context for all subsequent queries
    await supabase.rpc('set_current_organization', { org_id: org.id });
  };

  const switchOrg = async (orgId: string) => {
    const org = userOrgs.find(o => o.id === orgId);
    if (org) {
      await selectOrganization(org);
    }
  };

  const hasFeature = (feature: string): boolean => {
    return enabledFeatures.includes(feature);
  };

  const getFeatureConfig = (feature: string): any => {
    // Implementation to get feature-specific config
    return {};
  };

  const createOrg = async (data: CreateOrgData): Promise<Organization> => {
    // Create new organization
    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert({
        name: data.name,
        slug: data.slug,
        owner_id: user!.id,
        settings: data.settings || {}
      })
      .select()
      .single();

    if (error) throw error;

    // Add owner as member
    await supabase
      .from('organization_members')
      .insert({
        organization_id: newOrg.id,
        user_id: user!.id,
        role: 'owner'
      });

    // Enable default features
    const defaultFeatures = ['social', 'events'];
    for (const feature of defaultFeatures) {
      await supabase
        .from('organization_features')
        .insert({
          organization_id: newOrg.id,
          feature_key: feature,
          enabled: true
        });
    }

    await loadUserOrganizations();
    return newOrg;
  };

  return (
    <OrganizationContext.Provider value={{
      currentOrg,
      userOrgs,
      switchOrg,
      createOrg,
      hasFeature,
      getFeatureConfig
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};
```

#### 2.2 Update App.tsx to Include Organization Context
```typescript
// client/src/App.tsx
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { OrgSelector } from '@/components/organization/OrgSelector';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <OrgAwareRouter />
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Organization-aware router
const OrgAwareRouter: React.FC = () => {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();

  if (user && !currentOrg) {
    // User has no organization - show onboarding
    return <OrganizationOnboarding />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Your existing routes */}
      </Routes>
    </BrowserRouter>
  );
};
```

### Step 3: Transform Existing Hooks to be Org-Aware

#### 3.1 Update useDashboardData Hook
```typescript
// Before: client/src/hooks/useDashboardData.ts
const { data: events } = await supabase
  .from('events')
  .select('*')
  .order('start_date');

// After: Organization-aware version
import { useOrganization } from '@/contexts/OrganizationContext';

export const useDashboardData = (userId?: string) => {
  const { currentOrg } = useOrganization();
  
  const fetchDashboardData = async () => {
    if (!currentOrg) return null;

    // All queries now filtered by organization
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', currentOrg.id)  // ADD THIS
      .order('start_date');

    const { data: challenges } = await supabase
      .from('challenges')
      .select('*')
      .eq('organization_id', currentOrg.id)  // ADD THIS
      .eq('status', 'active');

    return { events, challenges };
  };
};
```

#### 3.2 Update useMessaging Hook
```typescript
// client/src/hooks/useMessaging.ts - Make org-aware
export const useMessaging = () => {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();

  const sendMessage = async (recipientId: string, content: string) => {
    if (!currentOrg) throw new Error('No organization context');

    // Messages are now scoped to organization
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        organization_id: currentOrg.id,  // ADD THIS
        content: encryptedContent,
        created_at: new Date().toISOString()
      });
  };

  const getMessages = async () => {
    // Only get messages within current organization
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('organization_id', currentOrg.id)  // ADD THIS
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
  };
};
```

### Step 4: Create Feature Plugin System

#### 4.1 Define Feature Plugin Structure
```typescript
// client/src/features/types.ts
export interface FeaturePlugin {
  key: string;
  name: string;
  description: string;
  icon: React.ComponentType;
  category: 'social' | 'events' | 'wellness' | 'commerce' | 'admin';
  
  // Component registration
  components: {
    pages?: Record<string, React.LazyExoticComponent<React.ComponentType>>;
    widgets?: Record<string, React.LazyExoticComponent<React.ComponentType>>;
    settings?: Record<string, React.LazyExoticComponent<React.ComponentType>>;
  };
  
  // Route registration
  routes?: RouteConfig[];
  
  // Navigation items
  navigation?: {
    main?: NavItem[];
    mobile?: NavItem[];
  };
  
  // Required permissions
  permissions?: string[];
  
  // Configuration schema
  configSchema?: any;
}
```

#### 4.2 Convert Events to Plugin
```typescript
// client/src/features/events/plugin.ts
import { lazy } from 'react';
import { Calendar } from 'lucide-react';
import type { FeaturePlugin } from '../types';

export const eventsPlugin: FeaturePlugin = {
  key: 'events',
  name: 'Event Management',
  description: 'Create and manage club events',
  icon: Calendar,
  category: 'events',
  
  components: {
    pages: {
      'events-list': lazy(() => import('@/pages/Events')),
      'event-create': lazy(() => import('@/components/events/CreateEvent')),
    },
    widgets: {
      'upcoming-events': lazy(() => import('@/components/dashboard/UpcomingEvents')),
    },
    settings: {
      'event-settings': lazy(() => import('@/components/settings/EventSettings')),
    }
  },
  
  routes: [
    {
      path: '/events',
      component: 'events-list',
      requiresAuth: true,
    },
    {
      path: '/events/create',
      component: 'event-create',
      requiresAuth: true,
      requiresRole: 'admin',
    }
  ],
  
  navigation: {
    main: [
      {
        label: 'Events',
        path: '/events',
        icon: Calendar,
      }
    ]
  },
  
  configSchema: {
    requireApproval: {
      type: 'boolean',
      default: false,
      label: 'Require approval for event creation'
    },
    defaultCapacity: {
      type: 'number',
      default: 50,
      label: 'Default event capacity'
    }
  }
};
```

#### 4.3 Create Feature Registry
```typescript
// client/src/features/registry.ts
import { eventsPlugin } from './events/plugin';
import { socialPlugin } from './social/plugin';
import { challengesPlugin } from './challenges/plugin';
import { messagingPlugin } from './messaging/plugin';
import { loyaltyPlugin } from './loyalty/plugin';

class FeatureRegistry {
  private plugins = new Map<string, FeaturePlugin>();
  
  constructor() {
    // Register all available plugins
    this.register(eventsPlugin);
    this.register(socialPlugin);
    this.register(challengesPlugin);
    this.register(messagingPlugin);
    this.register(loyaltyPlugin);
  }
  
  register(plugin: FeaturePlugin) {
    this.plugins.set(plugin.key, plugin);
  }
  
  get(key: string): FeaturePlugin | undefined {
    return this.plugins.get(key);
  }
  
  getAll(): FeaturePlugin[] {
    return Array.from(this.plugins.values());
  }
  
  getByCategory(category: string): FeaturePlugin[] {
    return this.getAll().filter(p => p.category === category);
  }
}

export const featureRegistry = new FeatureRegistry();
```

### Step 5: Create Dynamic Dashboard

#### 5.1 Transform Dashboard to Use Features
```typescript
// client/src/pages/Dashboard.tsx
import { useOrganization } from '@/contexts/OrganizationContext';
import { featureRegistry } from '@/features/registry';
import { Suspense } from 'react';

export const Dashboard: React.FC = () => {
  const { currentOrg, hasFeature } = useOrganization();
  const { isMobile } = useMobileOptimization();

  if (!currentOrg) {
    return <NoOrganizationView />;
  }

  // Build dashboard based on enabled features
  const widgets = currentOrg.features
    .map(featureKey => {
      const plugin = featureRegistry.get(featureKey);
      return plugin?.components.widgets;
    })
    .filter(Boolean)
    .flat();

  if (isMobile) {
    return <MobileDashboard widgets={widgets} org={currentOrg} />;
  }

  return (
    <div className="dashboard-container">
      <DashboardHeader org={currentOrg} />
      
      <div className="dashboard-grid">
        {widgets.map((Widget, index) => (
          <Suspense key={index} fallback={<WidgetSkeleton />}>
            <Widget />
          </Suspense>
        ))}
      </div>
      
      {/* Only show features that are enabled */}
      {hasFeature('challenges') && <WalkingChallengeWidget />}
      {hasFeature('events') && <UpcomingEvents />}
      {hasFeature('social') && <CommunityFeed />}
    </div>
  );
};
```

### Step 6: Create Organization Onboarding

#### 6.1 Organization Creation Wizard
```typescript
// client/src/components/organization/CreateOrgWizard.tsx
import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { featureRegistry } from '@/features/registry';

export const CreateOrgWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [orgData, setOrgData] = useState({
    name: '',
    slug: '',
    features: [] as string[],
    settings: {}
  });
  const { createOrg } = useOrganization();

  const steps = [
    { title: 'Basic Info', component: BasicInfoStep },
    { title: 'Select Features', component: FeatureSelectionStep },
    { title: 'Configure', component: ConfigurationStep },
    { title: 'Invite Members', component: InviteMembersStep }
  ];

  const handleComplete = async () => {
    const org = await createOrg(orgData);
    
    // Enable selected features
    for (const feature of orgData.features) {
      await supabase
        .from('organization_features')
        .insert({
          organization_id: org.id,
          feature_key: feature,
          enabled: true
        });
    }
    
    // Navigate to dashboard
    window.location.href = '/dashboard';
  };

  return (
    <div className="wizard-container">
      <StepIndicator steps={steps} currentStep={step} />
      
      {step === 1 && (
        <BasicInfoStep
          data={orgData}
          onUpdate={setOrgData}
          onNext={() => setStep(2)}
        />
      )}
      
      {step === 2 && (
        <FeatureSelectionStep
          data={orgData}
          onUpdate={setOrgData}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      
      {/* Continue for other steps */}
    </div>
  );
};

// Feature Selection Step
const FeatureSelectionStep: React.FC<StepProps> = ({ data, onUpdate, onNext }) => {
  const features = featureRegistry.getAll();
  const [selected, setSelected] = useState<string[]>(data.features);

  const toggleFeature = (featureKey: string) => {
    setSelected(prev => 
      prev.includes(featureKey)
        ? prev.filter(k => k !== featureKey)
        : [...prev, featureKey]
    );
  };

  const calculatePrice = () => {
    // Calculate based on selected features
    return selected.length * 10; // Simplified pricing
  };

  return (
    <div className="feature-selection">
      <h2>Choose Your Features</h2>
      <p>Select the features your club needs</p>
      
      <div className="feature-grid">
        {features.map(feature => (
          <FeatureCard
            key={feature.key}
            feature={feature}
            selected={selected.includes(feature.key)}
            onToggle={() => toggleFeature(feature.key)}
          />
        ))}
      </div>
      
      <div className="pricing-summary">
        <h3>Monthly Cost: ${calculatePrice()}</h3>
        <ul>
          {selected.map(key => {
            const feature = featureRegistry.get(key);
            return (
              <li key={key}>{feature?.name}: $10/mo</li>
            );
          })}
        </ul>
      </div>
      
      <button 
        onClick={() => {
          onUpdate({ ...data, features: selected });
          onNext();
        }}
      >
        Continue
      </button>
    </div>
  );
};
```

### Step 7: Update Capacitor for iOS

#### 7.1 Configure Multi-Tenant iOS App
```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.platform.girlsclub',  // Generic app ID
  appName: 'Girls Club Platform',
  webDir: 'dist',
  
  ios: {
    // Support for Universal Links (org-specific URLs)
    associatedDomains: [
      'applinks:*.girlsclub.app',  // Wildcard for all subdomains
      'applinks:girlsclub.app'
    ],
    
    // Configuration for multi-tenant
    config: {
      'WKAppBoundDomains': [
        '*.girlsclub.app',
        'girlsclub.app'
      ]
    }
  },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
```

#### 7.2 Handle Deep Links for Organizations
```typescript
// client/src/services/DeepLinkService.ts
import { App } from '@capacitor/app';
import { useOrganization } from '@/contexts/OrganizationContext';

export class DeepLinkService {
  static init() {
    // Handle app URL opens
    App.addListener('appUrlOpen', async (data) => {
      // URL format: girlsclub://org/acme/events/123
      const url = new URL(data.url);
      const parts = url.pathname.split('/');
      
      if (parts[1] === 'org') {
        const orgSlug = parts[2];
        const resource = parts[3];
        const resourceId = parts[4];
        
        // Switch to organization
        await this.switchToOrg(orgSlug);
        
        // Navigate to resource
        if (resource === 'events') {
          window.location.href = `/events/${resourceId}`;
        }
      }
    });
  }
  
  static async switchToOrg(slug: string) {
    // Find org by slug and switch context
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (org) {
      const { switchOrg } = useOrganization();
      await switchOrg(org.id);
    }
  }
}
```

### Step 8: Migration Script for Existing Data

```typescript
// scripts/migrate-to-multi-tenant.ts
async function migrateToMultiTenant() {
  console.log('Starting multi-tenant migration...');
  
  // Step 1: Create default organization for existing data
  const { data: defaultOrg } = await supabase
    .from('organizations')
    .insert({
      name: 'Humbl Girls Club',
      slug: 'humbl-original',
      settings: {},
      subscription_tier: 'premium'
    })
    .select()
    .single();
  
  console.log('Created default organization:', defaultOrg.id);
  
  // Step 2: Assign all existing users to default org
  const { data: users } = await supabase
    .from('profiles')
    .select('id');
  
  for (const user of users) {
    await supabase
      .from('organization_members')
      .insert({
        organization_id: defaultOrg.id,
        user_id: user.id,
        role: 'member'
      });
  }
  
  console.log(`Migrated ${users.length} users`);
  
  // Step 3: Update all tables with organization_id
  const tables = [
    'events', 'challenges', 'social_posts', 'direct_messages',
    'loyalty_transactions', 'rewards_catalog', 'notifications'
    // ... all 43 tables
  ];
  
  for (const table of tables) {
    await supabase.rpc('execute_sql', {
      sql: `UPDATE ${table} SET organization_id = '${defaultOrg.id}' WHERE organization_id IS NULL`
    });
    console.log(`Updated ${table}`);
  }
  
  // Step 4: Enable all features for default org
  const features = ['events', 'challenges', 'social', 'messaging', 'loyalty', 'payments'];
  
  for (const feature of features) {
    await supabase
      .from('organization_features')
      .insert({
        organization_id: defaultOrg.id,
        feature_key: feature,
        enabled: true
      });
  }
  
  console.log('Migration complete!');
}

// Run migration
migrateToMultiTenant();
```

## Testing Multi-Tenancy

### Create Test Script
```typescript
// tests/multi-tenant.test.ts
describe('Multi-tenant isolation', () => {
  it('should isolate data between organizations', async () => {
    // Create two organizations
    const org1 = await createTestOrg('test-org-1');
    const org2 = await createTestOrg('test-org-2');
    
    // Create users in each
    const user1 = await createTestUser(org1);
    const user2 = await createTestUser(org2);
    
    // Create event in org1
    const event = await createEvent(org1, user1, {
      title: 'Org 1 Event'
    });
    
    // Try to access from org2
    const canAccess = await tryAccessEvent(event.id, user2);
    
    expect(canAccess).toBe(false);
  });
});
```

## Deployment Checklist

- [ ] Run database migrations to add organization tables
- [ ] Deploy updated edge functions with org context
- [ ] Update all RLS policies for multi-tenancy
- [ ] Test organization isolation
- [ ] Create organization onboarding flow
- [ ] Update iOS app configuration
- [ ] Submit updated app to App Store
- [ ] Monitor performance with multiple orgs
- [ ] Set up billing per organization