# 🚀 FINAL STEP: Apply Multi-Tenant Migration

## Current Status
✅ All base migrations (001-089) have been successfully applied
✅ All 43 application tables have been created
✅ Organizations and organization_members tables exist
⏳ Migration 200 needs to be applied to complete multi-tenant setup

## How to Apply Migration 200

### Option 1: Using Supabase Studio (Recommended)

1. **Open Supabase Studio**
   ```bash
   # If not already running:
   npx supabase start
   ```
   
2. **Navigate to SQL Editor**
   - Open http://localhost:54323 in your browser
   - Click "SQL Editor" in the left sidebar

3. **Run Migration 200**
   - Click "New Query"
   - Copy ALL content from: `supabase/migrations/200_apply_multitenant_to_existing.sql`
   - Paste into the SQL editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Expected Output**
   You should see notices like:
   ```
   NOTICE: Created default organization with ID: [uuid]
   NOTICE: Migrated users to default organization
   NOTICE: Added organization_id to table: events
   NOTICE: Added organization_id to table: challenges
   ... (for all 43 tables)
   NOTICE: === MULTI-TENANT MIGRATION COMPLETE ===
   ```

### Option 2: Using psql (if installed)

```bash
# Connect to local database
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f supabase/migrations/200_apply_multitenant_to_existing.sql
```

### Option 3: Using Node.js Script

Create and run this script:

```javascript
// apply-migration-200.js
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:54322/postgres'
});

async function applyMigration() {
  try {
    await client.connect();
    
    const migration = fs.readFileSync(
      './supabase/migrations/200_apply_multitenant_to_existing.sql', 
      'utf8'
    );
    
    console.log('Applying migration 200...');
    await client.query(migration);
    
    // Verify
    const result = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM organizations) as org_count,
        (SELECT COUNT(*) FROM organization_members) as member_count,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE column_name = 'organization_id') as tables_with_org_id
    `);
    
    console.log('Migration complete!');
    console.log(`Organizations: ${result.rows[0].org_count}`);
    console.log(`Members: ${result.rows[0].member_count}`);
    console.log(`Tables with organization_id: ${result.rows[0].tables_with_org_id}`);
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

applyMigration();
```

Run with:
```bash
npm install pg
node apply-migration-200.js
```

## What Migration 200 Does

1. **Creates Default Organization**
   - Name: "Humbl Girls Club"
   - Slug: "humbl-girls-club"
   - Tier: Enterprise (10,000 member limit)

2. **Migrates Existing Users**
   - All current users become members of default organization
   - Admins retain admin role in organization

3. **Adds organization_id to ALL Tables**
   - Events, challenges, social posts, messages
   - Loyalty transactions, rewards
   - User settings, notifications
   - All 43 tables get organization context

4. **Updates Existing Data**
   - All existing records assigned to default organization
   - No data is lost or deleted

5. **Creates Performance Indexes**
   - Composite indexes for fast queries
   - Organization-based filtering optimized

6. **Updates Security Policies**
   - RLS policies updated for multi-tenancy
   - Data isolation between organizations

## Verification After Migration

Run these queries to verify success:

```sql
-- Check organization was created
SELECT * FROM organizations;

-- Check users were migrated
SELECT COUNT(*) as member_count FROM organization_members;

-- Check tables have organization_id
SELECT table_name 
FROM information_schema.columns 
WHERE column_name = 'organization_id' 
  AND table_schema = 'public';

-- Test organization context function
SELECT get_user_current_organization(auth.uid());
```

## ⚠️ CRITICAL NEXT STEPS

After applying this migration, you MUST:

### 1. Update Frontend Hooks (Day 3-4)
All 54 hooks need organization filtering:

```typescript
// BEFORE (current - BROKEN)
const { data: events } = await supabase
  .from('events')
  .select('*');

// AFTER (required)
const { data: events } = await supabase
  .from('events')
  .select('*')
  .eq('organization_id', currentOrg.id);
```

### 2. Add Organization Context Provider
```typescript
// Add to client/src/App.tsx
<OrganizationProvider>
  <App />
</OrganizationProvider>
```

### 3. Test Data Isolation
- Create test organizations
- Verify users only see their org's data
- Test switching between organizations

## Common Issues & Solutions

### Issue: "column plan_type does not exist"
✅ FIXED - Changed to use `subscription_tier` instead

### Issue: "table profiles does not exist"
Migration checks for table existence before referencing

### Issue: "organization_id already exists"
Migration uses IF NOT EXISTS clauses - safe to re-run

## Success Criteria

After successful migration:
- ✅ 1 organization exists ("Humbl Girls Club")
- ✅ All users are members of the organization
- ✅ 43+ tables have organization_id column
- ✅ Helper functions created (get_user_current_organization)
- ✅ Indexes created for performance
- ✅ RLS policies updated for multi-tenancy

## Timeline

- **Now**: Apply migration 200
- **Day 3-4**: Update frontend hooks
- **Day 5**: Test multi-tenant isolation
- **Day 6**: Configure production infrastructure
- **Day 7**: Deploy to production

---

**Ready to Apply**: Migration 200 is the final step to enable multi-tenancy in your database!