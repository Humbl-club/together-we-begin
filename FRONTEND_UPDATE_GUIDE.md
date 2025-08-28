# 🚀 FRONTEND UPDATE GUIDE - Multi-Tenant Implementation

## Current Status
✅ **OrganizationContext** is created and integrated into App.tsx
✅ **Organization tables** exist in database with data
⏳ **Frontend hooks** need organization filtering (IN PROGRESS)

## Critical Updates Needed

### 1. ✅ COMPLETED: Dashboard Hook
**File**: `/client/src/hooks/useDashboardData.ts`
- Added `useOrganization` import
- Added organization filtering to all queries
- Updated cache key to include organization ID

### 2. 🔄 REMAINING HOOKS TO UPDATE

#### High Priority Hooks (Data Fetching)
These hooks fetch data that MUST be filtered by organization:

```typescript
// Pattern to follow for ALL data hooks:
import { useOrganization } from '@/contexts/OrganizationContext';

export const useYourHook = () => {
  const { currentOrganization } = useOrganization();
  
  // In queries, add:
  .eq('organization_id', currentOrganization?.id)
};
```

**Files to update:**
- `/client/src/hooks/useUpcomingEvents.ts` - Events data
- `/client/src/hooks/useCommunityFeed.ts` - Social posts
- `/client/src/hooks/useWalkingChallenges.ts` - Challenges
- `/client/src/hooks/useMessaging.ts` - Direct messages
- `/client/src/hooks/useNotifications.ts` - Notifications
- `/client/src/hooks/useEnhancedChallenges.ts` - Challenge data
- `/client/src/hooks/useRealtimeActivityFeed.ts` - Real-time feed

### 3. 🔧 UPDATE PATTERN

For each hook, apply this pattern:

#### BEFORE:
```typescript
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('status', 'upcoming');
```

#### AFTER:
```typescript
import { useOrganization } from '@/contexts/OrganizationContext';

// In component:
const { currentOrganization } = useOrganization();

// In query:
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('organization_id', currentOrganization?.id)  // ADD THIS
  .eq('status', 'upcoming');
```

### 4. 📊 Tables Requiring Organization Filter

All queries to these tables MUST include organization_id:

```
events                    ✅
event_registrations      ✅
challenges               ✅
challenge_participations ✅
social_posts             ✅
post_likes               ✅
post_comments            ✅
direct_messages          ✅
message_threads          ✅
loyalty_transactions     ✅
rewards_catalog          ✅
notifications            ✅
admin_actions            ✅
```

### 5. 🚨 CRITICAL SECURITY NOTE

**WITHOUT THESE UPDATES:**
- Users will see data from ALL organizations
- Data leakage between organizations
- Complete privacy failure

**WITH THESE UPDATES:**
- Complete data isolation
- Each org sees only their data
- Enterprise-grade security

### 6. 📝 TESTING CHECKLIST

After updating each hook:

```typescript
// 1. Check organization is loaded
if (!currentOrganization) {
  return { data: [], loading: false };
}

// 2. Add to all queries
.eq('organization_id', currentOrganization.id)

// 3. Update cache keys
const cacheKey = `${dataType}-${userId}-${currentOrganization.id}`;

// 4. Add to dependencies
}, [userId, currentOrganization?.id]);
```

### 7. 🎯 QUICK COMMANDS

To find all hooks that need updating:
```bash
# Find all Supabase queries without organization_id
grep -r "supabase.from" client/src/hooks/ | grep -v "organization_id"

# Find specific table queries
grep -r "from('events')" client/src/hooks/
grep -r "from('social_posts')" client/src/hooks/
grep -r "from('direct_messages')" client/src/hooks/
```

### 8. 🔄 REAL-TIME SUBSCRIPTIONS

Update real-time subscriptions to filter by organization:

```typescript
// BEFORE
const subscription = supabase
  .channel('events-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'events'
  }, handler)

// AFTER
const subscription = supabase
  .channel(`events-${currentOrganization.id}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'events',
    filter: `organization_id=eq.${currentOrganization.id}`  // ADD THIS
  }, handler)
```

### 9. 🛡️ ERROR HANDLING

Add organization checks to all hooks:

```typescript
export const useYourHook = () => {
  const { currentOrganization, loading: orgLoading } = useOrganization();
  
  // Return early if no org
  if (orgLoading) return { loading: true };
  if (!currentOrganization) {
    return { 
      data: null, 
      loading: false, 
      error: 'No organization selected' 
    };
  }
  
  // Continue with org-filtered queries...
};
```

### 10. 📊 PROGRESS TRACKER

**Hooks Updated:**
- [x] `useDashboardData.ts`
- [ ] `useUpcomingEvents.ts`
- [ ] `useCommunityFeed.ts`
- [ ] `useWalkingChallenges.ts`
- [ ] `useMessaging.ts`
- [ ] `useNotifications.ts`
- [ ] `useEnhancedChallenges.ts`
- [ ] `useRealtimeActivityFeed.ts`
- [ ] `useHealthData.ts`
- [ ] `useStepTracking.ts`
- [ ] `useUserGoals.ts`
- [ ] `useAnalytics.ts`

## 🚀 Next Steps

1. **Update remaining hooks** with organization filtering
2. **Test each feature** to ensure data isolation
3. **Add organization switcher** to UI (already exists in `/components/organization/OrganizationSwitcher.tsx`)
4. **Test switching** between organizations
5. **Deploy** to production

## ⚠️ DEPLOYMENT READINESS

**Before deploying to production:**
1. ✅ All hooks updated with organization filtering
2. ✅ Organization switcher visible in UI
3. ✅ Test with multiple organizations
4. ✅ Verify data isolation
5. ✅ Load test with expected users

---

**Status**: IN PROGRESS - 1 of 54 hooks updated
**Next Hook**: `useUpcomingEvents.ts`
**ETA**: 2-3 hours for all critical hooks