# 🗺️ HUMBL GIRLS CLUB - MULTI-TENANT PLATFORM ARCHITECTURE

## 🎯 Complete User Journey & System Flow

```mermaid
graph TB
    Start([User Downloads PWA/iOS App]) --> Auth{Existing User?}
    
    Auth -->|No| SignUp[Sign Up Flow]
    Auth -->|Yes| SignIn[Sign In]
    
    SignUp --> EmailVerify[Email Verification]
    EmailVerify --> OrgChoice{Organization Choice}
    
    SignIn --> OrgContext[Load User's Organizations]
    OrgContext --> HasOrg{Has Organizations?}
    
    HasOrg -->|No| OrgChoice
    HasOrg -->|Yes| OrgSwitch[Organization Switcher]
    
    OrgChoice -->|Join Existing| InviteCode[Enter Invite Code]
    OrgChoice -->|Create New| CreateOrg[Create Organization]
    
    InviteCode --> ValidateCode{Valid Code?}
    ValidateCode -->|Yes| JoinOrg[Join Organization]
    ValidateCode -->|No| InviteCode
    
    CreateOrg --> OrgSetup[Organization Setup Wizard]
    JoinOrg --> Dashboard
    OrgSwitch --> Dashboard[Organization Dashboard]
    
    OrgSetup --> Step1[1. Basic Info]
    Step1 --> Step2[2. Choose Plan]
    Step2 --> Step3[3. Branding]
    Step3 --> Step4[4. Features]
    Step4 --> Step5[5. Theme]
    Step5 --> Dashboard
    
    Dashboard --> Features{Enabled Features}
    Features --> Events[Events]
    Features --> Challenges[Challenges]
    Features --> Social[Social]
    Features --> Loyalty[Loyalty]
    Features --> Messages[Messages]
```

## 🏢 THREE ORGANIZATIONS SCENARIO

### Organization A: "Wellness Warriors"
```mermaid
graph LR
    AdminA[Sarah - Owner] -->|Creates| OrgA[Wellness Warriors]
    OrgA -->|Chooses| PlanA[PRO Plan - $49]
    OrgA -->|Enables| FeaturesA[Events, Challenges, Loyalty]
    OrgA -->|Customizes| ThemeA[Green Theme, Roboto Font]
    OrgA -->|Invites| MembersA[500 Members Max]
    
    subgraph "Invitation Flow"
        InviteA1[Generate Code: WELLNESS2025]
        InviteA2[Share via Email/SMS]
        InviteA3[Members Join with Code]
    end
```

### Organization B: "Tech Sisters"
```mermaid
graph LR
    AdminB[Maria - Owner] -->|Creates| OrgB[Tech Sisters]
    OrgB -->|Chooses| PlanB[ENTERPRISE - $149]
    OrgB -->|Enables| FeaturesB[All Features]
    OrgB -->|Customizes| ThemeB[Purple Theme, Inter Font]
    OrgB -->|Invites| MembersB[Unlimited Members]
    
    subgraph "Custom Domain"
        DomainB[techsisters.app]
        WhiteLabel[Custom Branding]
    end
```

### Organization C: "Fitness First"
```mermaid
graph LR
    AdminC[Jessica - Owner] -->|Creates| OrgC[Fitness First]
    OrgC -->|Chooses| PlanC[BASIC - $19]
    OrgC -->|Enables| FeaturesC[Events, Messaging]
    OrgC -->|Customizes| ThemeC[Orange Theme, Poppins Font]
    OrgC -->|Invites| MembersC[100 Members Max]
    
    subgraph "Limited Features"
        NoLoyalty[❌ No Loyalty Program]
        NoChallenges[❌ No Challenges]
    end
```

## 📱 COMPLETE APPLICATION ARCHITECTURE

```mermaid
graph TB
    subgraph "Frontend Layer - PWA/iOS"
        UI[React + TypeScript]
        UI --> OrgContext[Organization Context Provider]
        OrgContext --> Components[Smart Components]
        Components --> Hooks[54 Organization-Aware Hooks]
    end
    
    subgraph "Authentication Layer"
        Auth[Supabase Auth]
        Auth --> JWT[JWT with Org Claims]
        JWT --> RLS[Row Level Security]
    end
    
    subgraph "Database Layer - PostgreSQL"
        Core[76 Tables Total]
        Core --> OrgTables[Organization Tables]
        Core --> AppTables[Application Tables]
        
        OrgTables --> OrgData[
            • organizations
            • organization_members
            • organization_features
            • organization_themes
        ]
        
        AppTables --> AllTables[
            • events
            • challenges
            • social_posts
            • messages
            • loyalty_transactions
            • 38 more tables...
        ]
        
        AllTables -->|All have| OrgID[organization_id column]
    end
    
    subgraph "Edge Functions - Deno"
        EdgeFn[4 Edge Functions]
        EdgeFn --> Payment[create-payment]
        EdgeFn --> Verify[verify-payment]
        EdgeFn --> Walking[process-walking-challenges]
        EdgeFn --> Email[send-email]
    end
    
    UI -.-> Auth
    Auth -.-> RLS
    RLS -.-> Core
    Components -.-> EdgeFn
```

## 🎨 ORGANIZATION CUSTOMIZATION FLOW

```mermaid
graph LR
    subgraph "Branding Options"
        Logo[Upload Logo]
        Colors[Brand Colors]
        Fonts[50+ Google Fonts]
    end
    
    subgraph "Feature Selection"
        Events[📅 Events - $5/mo]
        Challenges[🏃 Challenges - $10/mo]
        Social[💬 Social Feed - $5/mo]
        Loyalty[🎁 Loyalty Points - $10/mo]
        Messages[✉️ Direct Messages - $5/mo]
        Analytics[📊 Analytics - $15/mo]
    end
    
    subgraph "Dashboard Customization"
        Widgets[12 Widget Types]
        DragDrop[Drag & Drop Layout]
        SaveLayout[Save Custom Layouts]
    end
    
    Logo --> Theme
    Colors --> Theme
    Fonts --> Theme[Custom Theme Applied]
    
    Events --> Dashboard
    Challenges --> Dashboard
    Social --> Dashboard
    Loyalty --> Dashboard
    Messages --> Dashboard
    Analytics --> Dashboard[Personalized Dashboard]
    
    Widgets --> Dashboard
    DragDrop --> Dashboard
    SaveLayout --> Dashboard
```

## 👥 MEMBER INVITATION & MANAGEMENT FLOW

```mermaid
sequenceDiagram
    participant Owner
    participant System
    participant InvitedUser
    participant Database
    
    Owner->>System: Create Organization
    System->>Database: Insert organization record
    Database-->>System: Return org_id
    System->>Database: Add owner to organization_members
    System-->>Owner: Organization Created
    
    Owner->>System: Generate Invite Code
    System->>Database: Create invite_code (CLUB2025)
    System-->>Owner: Share Code/Link
    
    Owner->>InvitedUser: Send Invitation
    Note over InvitedUser: Via Email/SMS/WhatsApp
    
    InvitedUser->>System: Enter Code CLUB2025
    System->>Database: Validate code
    Database-->>System: Code valid, not expired
    
    System->>Database: Add to organization_members
    System->>Database: Assign role (member/admin)
    System-->>InvitedUser: Welcome to Organization!
    
    InvitedUser->>System: Access Dashboard
    System->>Database: Query with organization_id filter
    Database-->>System: Return org-specific data
    System-->>InvitedUser: Show Organization Dashboard
```

## 🔐 DATA ISOLATION ARCHITECTURE

```mermaid
graph TB
    subgraph "Organization A - Wellness Warriors"
        UserA1[User 1] --> DataA
        UserA2[User 2] --> DataA
        DataA[Organization A Data]
        DataA --> EventsA[Events]
        DataA --> PostsA[Posts]
        DataA --> MessagesA[Messages]
    end
    
    subgraph "Organization B - Tech Sisters"
        UserB1[User 3] --> DataB
        UserB2[User 4] --> DataB
        DataB[Organization B Data]
        DataB --> EventsB[Events]
        DataB --> PostsB[Posts]
        DataB --> MessagesB[Messages]
    end
    
    subgraph "Row Level Security"
        RLS[RLS Policies]
        RLS -->|Filters| QueryA[WHERE org_id = 'A']
        RLS -->|Filters| QueryB[WHERE org_id = 'B']
    end
    
    DataA -.->|Protected by| RLS
    DataB -.->|Protected by| RLS
    
    Block[❌ No Cross-Organization Access]
```

## 📊 SUBSCRIPTION TIERS & FEATURES

```mermaid
graph TD
    subgraph "FREE - $0/month"
        Free[50 Members Max]
        Free --> FreeFeatures[
            ✓ Basic Events
            ✓ Simple Messaging
            ✗ No Challenges
            ✗ No Loyalty
        ]
    end
    
    subgraph "BASIC - $19/month"
        Basic[100 Members Max]
        Basic --> BasicFeatures[
            ✓ Events
            ✓ Messaging
            ✓ Basic Analytics
            ✗ Limited Features
        ]
    end
    
    subgraph "PRO - $49/month"
        Pro[500 Members Max]
        Pro --> ProFeatures[
            ✓ All Features
            ✓ Challenges
            ✓ Loyalty Program
            ✓ Advanced Analytics
        ]
    end
    
    subgraph "ENTERPRISE - $149/month"
        Enterprise[Unlimited Members]
        Enterprise --> EnterpriseFeatures[
            ✓ Everything in Pro
            ✓ Custom Domain
            ✓ White Label
            ✓ API Access
            ✓ Priority Support
        ]
    end
```

## 🚀 PLATFORM SCALABILITY

```mermaid
graph LR
    subgraph "Current Capacity"
        Users[10,000 Concurrent Users]
        Orgs[Unlimited Organizations]
        Data[100GB Storage]
    end
    
    subgraph "Infrastructure"
        Supabase[Supabase Team Plan]
        Postgres[PostgreSQL 15]
        Edge[Edge Functions]
        CDN[Cloudflare CDN]
    end
    
    subgraph "Performance"
        Response[<200ms Response]
        Uptime[99.9% Uptime]
        Scale[Auto-scaling]
    end
    
    Users --> Supabase
    Orgs --> Postgres
    Data --> CDN
    
    Supabase --> Response
    Postgres --> Uptime
    Edge --> Scale
```

## 🎯 USER JOURNEY SUMMARY

1. **Download & Sign Up** → User downloads PWA/iOS app, creates account
2. **Organization Decision** → Join existing org with code OR create new org
3. **Setup Wizard** → Configure organization (name, plan, features, theme)
4. **Invite Members** → Generate codes, send invitations, manage roles
5. **Access Dashboard** → Personalized, drag-drop dashboard with enabled features
6. **Use Features** → Events, challenges, social feed, loyalty points, messaging
7. **Grow Community** → Add more members, upgrade plan, enable features

## 💡 KEY PLATFORM BENEFITS

- **Complete Isolation**: Each organization's data is completely separate
- **Custom Branding**: Every org can have unique look and feel
- **Flexible Pricing**: Pay only for features you need
- **Scalable**: Handles 10,000+ concurrent users
- **Mobile-First**: iOS PWA with offline support
- **Enterprise Ready**: White-label, custom domains, API access

---

*This architecture supports unlimited organizations, each with their own members, data, and customization, all running on a single platform instance.*