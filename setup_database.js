import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ynqdddwponrqwhtqfepi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwNjA5MywiaGV4cCI6MjA2NzU4MjA5M30.Xd_gxkWK1ufyG9chejudVrfOyiTQQZZ0MIH3mOvwo_E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
    console.log('🚀 Setting up database schema...\n');
    
    // Since we can't run raw SQL easily, let's check what we can do
    // First, let's create a test user to work with
    const { data: testUser, error: userError } = await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'TestPassword123!',
        email_confirm: true
    });
    
    if (!userError) {
        console.log('✅ Test user created:', testUser.user.id);
        
        // Create a profile for the test user
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: testUser.user.id,
                email: 'test@example.com',
                display_name: 'Test User',
                is_admin: false
            });
            
        if (!profileError) {
            console.log('✅ Profile created');
        } else {
            console.log('❌ Profile creation failed:', profileError.message);
        }
    } else {
        console.log('⚠️ User creation issue:', userError.message);
    }
    
    // Test creating other data
    const tablesToTest = [
        { 
            name: 'events',
            data: {
                title: 'Test Event',
                description: 'Testing database',
                event_date: new Date().toISOString(),
                location: 'Virtual'
            }
        },
        {
            name: 'challenges',
            data: {
                title: 'Test Challenge',
                description: 'Testing',
                challenge_type: 'steps',
                target_value: 10000,
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        },
        {
            name: 'rewards_catalog',
            data: {
                title: 'Test Reward',
                description: 'Test reward item',
                points_required: 100
            }
        }
    ];
    
    for (const table of tablesToTest) {
        const { error } = await supabase
            .from(table.name)
            .insert(table.data);
            
        if (!error) {
            console.log(`✅ ${table.name} table works`);
        } else {
            console.log(`❌ ${table.name} table error:`, error.message);
        }
    }
}

setupDatabase().catch(console.error);