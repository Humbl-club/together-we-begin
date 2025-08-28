# 🚨 CRITICAL DATABASE REPAIR INSTRUCTIONS

## Current Status
❌ **CRITICAL FAILURE**: Multi-tenant organization tables are missing  
✅ **PARTIAL SUCCESS**: Some core tables exist (profiles, events, challenges, social_posts)  
⚠️ **ACTION REQUIRED**: Execute emergency repair script immediately

## Immediate Repair Steps

### Step 1: Access Supabase Dashboard
1. Open: https://supabase.com/dashboard/project/ynqdddwponrqwhtqfepi
2. Navigate to **SQL Editor** (left sidebar)

### Step 2: Execute Emergency Repair
1. Copy the entire contents of `EMERGENCY_REPAIR.sql`
2. Paste into the SQL Editor
3. Click **"Run"** button
4. Wait for completion (should take 30-60 seconds)

### Step 3: Verify Repair
Run this command to verify the repair worked:
```bash
node repair_database_core.cjs
```

Expected output after successful repair:
```
✅ organizations - OK
✅ organization_members - OK  
✅ profiles - OK
✅ events - OK
✅ challenges - OK
✅ social_posts - OK

🎉 DATABASE REPAIR SUCCESSFUL!
```

### Step 4: Start Application
```bash
npm run dev
```

## What the Emergency Repair Does

### Creates Missing Tables
- ✅ `organizations` - Core organization/club entity
- ✅ `organization_members` - User-organization relationships
- ✅ `organization_features` - Feature toggles per organization

### Migrates Existing Data
- ✅ Creates default "Humbl Girls Club" organization
- ✅ Migrates all existing users to default organization
- ✅ Assigns appropriate roles (admin/member)
- ✅ Enables core features (events, challenges, social, messaging, loyalty)

### Adds Multi-Tenant Support
- ✅ Adds `organization_id` columns to existing tables
- ✅ Updates existing data with default organization ID
- ✅ Creates indexes for performance
- ✅ Adds essential RPC functions

## Troubleshooting

### If Repair Fails
1. Check the SQL Editor output for specific error messages
2. Common issues:
   - **Permission denied**: Make sure you're logged in as the project owner
   - **Syntax error**: Copy the entire script exactly as provided
   - **Timeout**: The repair should complete quickly; refresh if needed

### If Application Still Won't Start
1. Verify all tables exist: `node repair_database_core.cjs`
2. Check for TypeScript errors: `npm run check`
3. Regenerate types: `npm run regenerate-types` (if that script exists)

## Database Health Check

After repair, you should have:
- ✅ 76+ total tables
- ✅ 1 default organization
- ✅ All users migrated to default organization
- ✅ Multi-tenant architecture functional
- ✅ Frontend can connect to backend

## Long-Term Solution

The emergency repair creates the minimum viable database structure. For the complete 76-table architecture with all features, you can later execute the full `CRITICAL_DATABASE_REPAIR.sql` script.

## Support

If the repair fails or you encounter issues:
1. Check the Supabase dashboard logs
2. Verify your project permissions
3. Review the SQL output for specific error messages
4. The application should work with just the emergency repair

---
**Status**: Emergency repair script ready for execution  
**Priority**: CRITICAL - Execute immediately  
**Estimated Time**: 2-3 minutes