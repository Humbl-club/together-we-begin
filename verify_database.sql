-- ============================================================================
-- DATABASE VERIFICATION SCRIPT
-- ============================================================================
-- Run this to check the current state of your database
-- ============================================================================

-- Check if multi-tenant tables exist
SELECT 
    'Organizations Table' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

SELECT 
    'Organization Members Table' as check_item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- Count existing data
SELECT 
    'Organization Count' as metric,
    COUNT(*)::text as value
FROM organizations
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations');

SELECT 
    'Member Count' as metric,
    COUNT(*)::text as value
FROM organization_members
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members');

-- Check if organization_id columns exist on main tables
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
AND t.table_name IN ('events', 'challenges', 'social_posts', 'direct_messages', 'loyalty_transactions')
ORDER BY t.table_name;

-- Check for key indexes
SELECT 
    'Performance Indexes' as check_item,
    COUNT(*)::text || ' indexes' as count
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

-- Check RLS policies
SELECT 
    'RLS Policies' as check_item,
    COUNT(*)::text || ' policies' as count
FROM pg_policies
WHERE schemaname = 'public';

-- Summary
SELECT 
    '═══════════════════════════════' as separator
UNION ALL
SELECT 
    'VERIFICATION COMPLETE' as separator
UNION ALL
SELECT 
    '═══════════════════════════════' as separator;