-- ============================================================================
-- MIGRATION ANALYSIS SCRIPT
-- Analyze what's needed vs what's already done
-- ============================================================================

-- Check current production state vs local state
SELECT 
    'PRODUCTION DATABASE ANALYSIS' as section;

-- 1. Check essential multi-tenant tables existence in production
SELECT 
    'organizations' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as production_status;

SELECT 
    'organization_members' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as production_status;

-- 2. Check if organization_id columns exist on core tables
SELECT 
    table_name,
    CASE 
        WHEN column_name IS NOT NULL THEN '✅ HAS organization_id'
        ELSE '❌ MISSING organization_id'
    END as status
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND c.column_name = 'organization_id'
WHERE t.table_schema = 'public'
AND t.table_name IN ('events', 'challenges', 'social_posts', 'loyalty_transactions', 'profiles')
ORDER BY t.table_name;

-- 3. Check RLS policies count
SELECT 
    'RLS Policies' as check_item,
    COUNT(*)::text || ' policies' as count
FROM pg_policies
WHERE schemaname = 'public';

-- 4. Check indexes count
SELECT 
    'Performance Indexes' as check_item,
    COUNT(*)::text || ' indexes' as count
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

-- 5. Check what advanced tables exist
SELECT 
    'Advanced Tables Present' as section,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'direct_messages', 'message_threads', 'notifications',
    'health_data', 'step_validation_logs', 'walking_leaderboards',
    'admin_actions', 'content_reports', 'reward_redemptions',
    'performance_metrics', 'privacy_settings'
);

-- 6. Check organization data existence
SELECT 
    'Organizations Count' as metric,
    COALESCE(COUNT(*)::text, '0') as value
FROM organizations
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations');

-- Summary recommendation
SELECT '═══════════════════════════════════════' as separator
UNION ALL
SELECT 'MIGRATION RECOMMENDATION ANALYSIS' as separator
UNION ALL
SELECT '═══════════════════════════════════════' as separator;
