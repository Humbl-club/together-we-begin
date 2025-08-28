#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://ynqdddwponrqwhtqfepi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDYwOTMsImV4cCI6MjA2NzU4MjA5M30.LoH2muJ_kTSk3y_fBlxEq3m9q5LTQaMaWBSFyh4JDzQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function repairCoreDatabase() {
    console.log('🚨 CRITICAL DATABASE REPAIR - CORE TABLES CREATION');
    console.log('==================================================');

    try {
        console.log('⚠️  Since direct SQL execution is limited, you MUST:');
        console.log('');
        console.log('1. 🌐 Open Supabase Dashboard: https://supabase.com/dashboard/project/ynqdddwponrqwhtqfepi');
        console.log('2. 📝 Go to SQL Editor');
        console.log('3. 📋 Copy the contents of CRITICAL_DATABASE_REPAIR.sql');
        console.log('4. ✅ Execute the entire script in the SQL Editor');
        console.log('5. 🔄 Return here and run: npm run dev');
        console.log('');
        console.log('🔍 Testing current database state...');

        // Test basic connectivity and current state
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(10);

        if (tablesError) {
            console.log('❌ Database connection failed:', tablesError.message);
            console.log('');
            console.log('🚨 IMMEDIATE ACTION REQUIRED:');
            console.log('   The database is in a completely broken state.');
            console.log('   All core tables are missing. You must manually execute');
            console.log('   the CRITICAL_DATABASE_REPAIR.sql script in Supabase.');
        } else {
            const tableCount = tables ? tables.length : 0;
            console.log(`📊 Current database state: ${tableCount} tables found`);
            
            if (tableCount === 0) {
                console.log('');
                console.log('🚨 CRITICAL: NO TABLES FOUND');
                console.log('   Database is completely empty. Manual repair required.');
            } else {
                console.log('   Tables:', tables.map(t => t.table_name).join(', '));
            }
        }

        // Test for critical tables
        const criticalTables = ['organizations', 'organization_members', 'profiles', 'events', 'challenges', 'social_posts'];
        const missingTables = [];

        for (const tableName of criticalTables) {
            try {
                const { error } = await supabase.from(tableName).select('id').limit(1);
                if (error) {
                    missingTables.push(tableName);
                } else {
                    console.log(`✅ ${tableName} - OK`);
                }
            } catch (err) {
                missingTables.push(tableName);
            }
        }

        if (missingTables.length > 0) {
            console.log('');
            console.log(`❌ Missing critical tables: ${missingTables.join(', ')}`);
            console.log('');
            console.log('🚨 REPAIR INSTRUCTIONS:');
            console.log('   1. Open: https://supabase.com/dashboard/project/ynqdddwponrqwhtqfepi/sql');
            console.log('   2. Copy entire contents of CRITICAL_DATABASE_REPAIR.sql');
            console.log('   3. Paste into SQL Editor');
            console.log('   4. Click "Run" to execute');
            console.log('   5. Wait for completion (may take 2-3 minutes)');
            console.log('   6. Run this script again to verify');
            console.log('');
            console.log('📂 The repair script is located at:');
            console.log('   ./CRITICAL_DATABASE_REPAIR.sql');
        } else {
            console.log('');
            console.log('🎉 All critical tables found! Database appears to be working.');
            console.log('');
            console.log('🚀 Next steps:');
            console.log('   1. Start development server: npm run dev');
            console.log('   2. Test application functionality');
            console.log('   3. Regenerate types if needed: npm run regenerate-types');
        }

        console.log('');
        console.log('📋 REPAIR CHECKLIST:');
        console.log(`   ${ missingTables.length === 0 ? '✅' : '❌' } Core tables created`);
        console.log(`   ⏳ Multi-tenant architecture (check after SQL execution)`);
        console.log(`   ⏳ RLS policies configured (check after SQL execution)`);
        console.log(`   ⏳ Indexes created (check after SQL execution)`);
        console.log(`   ⏳ RPC functions created (check after SQL execution)`);

    } catch (error) {
        console.error('💥 Error during repair check:', error);
        console.log('');
        console.log('🚨 MANUAL REPAIR REQUIRED');
        console.log('Execute CRITICAL_DATABASE_REPAIR.sql in Supabase Dashboard');
    }
}

// Execute the repair check
repairCoreDatabase().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});