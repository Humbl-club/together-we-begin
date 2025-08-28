# Database Repair Guide

## Problem Identified
The production database has a critical issue:
- ✅ RPC functions exist (multi-tenant functions are working)
- ❌ Tables are completely missing (organizations, profiles, events, etc.)
- ❌ Frontend cannot connect to backend due to missing tables

## Root Cause
The database migrations were never fully applied to production. Only some RPC functions exist, but none of the actual data tables.

## Solution Steps

### STEP 1: Create Multi-Tenant Foundation Tables
1. Open Supabase Dashboard → https://supabase.com/dashboard/project/ynqdddwponrqwhtqfepi
2. Go to SQL Editor
3. Execute the contents of `MANUAL_MIGRATION_SCRIPT.sql`
4. Verify no errors occurred

### STEP 2: Create Core Platform Tables  
1. In Supabase SQL Editor
2. Execute the contents of `CREATE_CORE_TABLES.sql`
3. Verify no errors occurred

### STEP 3: Create Default Organization
Execute this SQL in Supabase Dashboard:
```sql
INSERT INTO organizations (name, slug, subscription_tier, max_members, settings)
VALUES (
  'Humbl Girls Club',
  'humbl-girls-club', 
  'enterprise',
  10000,
  '{"theme": "default", "features": ["events", "challenges", "social", "loyalty", "messaging"]}'::jsonb
)
RETURNING id, name, slug;
```

### STEP 4: Verify Database Setup
Run: `node verify_database_setup.js`

### STEP 5: Regenerate TypeScript Types
Run: `npx supabase gen types typescript --project-id=ynqdddwponrqwhtqfepi > client/src/integrations/supabase/types.ts`

### STEP 6: Test Organization Context
1. Start the application: `npm run dev`
2. Navigate to the app
3. Check if organization context loads properly
4. Verify that organization-aware queries work

## Expected Results After Repair

### Database Tables (16+ tables)
- ✅ organizations
- ✅ organization_members
- ✅ organization_features
- ✅ feature_catalog
- ✅ profiles
- ✅ events
- ✅ social_posts
- ✅ challenges
- ✅ loyalty_transactions
- ✅ etc.

### RPC Functions (4+ functions)
- ✅ is_member_of_organization
- ✅ is_admin_of_organization  
- ✅ get_user_role_in_organization
- ✅ get_user_current_organization

### Frontend Features
- ✅ Organization context loads
- ✅ Organization switcher works
- ✅ Multi-tenant data isolation
- ✅ All organization-aware components function

## Files Created for Manual Execution

1. `MANUAL_MIGRATION_SCRIPT.sql` - Multi-tenant foundation tables
2. `CREATE_CORE_TABLES.sql` - Core platform tables  
3. `verify_database_setup.js` - Verification script
4. `simple_db_check.js` - Basic connectivity test

## Critical Note
The production database is currently in a broken state with missing tables. The application will not function until these tables are created. This repair is essential for the multi-tenant architecture to work.