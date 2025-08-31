#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Local Supabase connection with service role key for admin access
const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixDatabaseIssues() {
  console.log('🔧 Fixing Database Issues...\n');
  
  try {
    // 1. Create default organization
    console.log('📌 Creating default organization...');
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'default')
      .single();
    
    let orgId;
    if (!existingOrg) {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Default Organization',
          slug: 'default',
          settings: { theme: 'default', features: ['events', 'challenges', 'social', 'loyalty'] },
          max_members: 10000,
          subscription_tier: 'enterprise'
        })
        .select()
        .single();
      
      if (orgError) {
        console.log('❌ Error creating organization:', orgError.message);
      } else {
        console.log('✅ Default organization created');
        orgId = newOrg.id;
      }
    } else {
      console.log('✅ Default organization already exists');
      orgId = existingOrg.id;
    }
    
    // 2. Create storage buckets
    console.log('\n📦 Creating storage buckets...');
    const buckets = ['avatars', 'posts', 'events', 'challenges'];
    
    for (const bucketName of buckets) {
      const { data: existingBucket } = await supabase.storage.getBucket(bucketName);
      
      if (!existingBucket) {
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (error) {
          console.log(`❌ Error creating bucket ${bucketName}:`, error.message);
        } else {
          console.log(`✅ Created bucket: ${bucketName}`);
        }
      } else {
        console.log(`✅ Bucket already exists: ${bucketName}`);
      }
    }
    
    // 3. Create test user
    console.log('\n👤 Creating test user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpass123',
      email_confirm: true
    });
    
    if (authError && !authError.message.includes('already been registered')) {
      console.log('❌ Error creating test user:', authError.message);
    } else {
      console.log('✅ Test user ready (test@example.com / testpass123)');
      
      // Add test user to organization
      if (authData?.user && orgId) {
        const { error: memberError } = await supabase
          .from('organization_members')
          .upsert({
            organization_id: orgId,
            user_id: authData.user.id,
            role: 'admin',
            status: 'active'
          }, {
            onConflict: 'organization_id,user_id'
          });
        
        if (memberError) {
          console.log('❌ Error adding user to organization:', memberError.message);
        } else {
          console.log('✅ Test user added to default organization as admin');
        }
        
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: 'test@example.com',
            username: 'testuser',
            full_name: 'Test User'
          }, {
            onConflict: 'id'
          });
        
        if (profileError) {
          console.log('❌ Error creating profile:', profileError.message);
        } else {
          console.log('✅ Test user profile created');
        }
      }
    }
    
    // 4. Test critical queries
    console.log('\n🧪 Testing critical queries...');
    
    // Test events query
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (eventsError) {
      console.log('❌ Events query failed:', eventsError.message);
    } else {
      console.log('✅ Events table accessible');
    }
    
    // Test challenges query
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .limit(1);
    
    if (challengesError) {
      console.log('❌ Challenges query failed:', challengesError.message);
    } else {
      console.log('✅ Challenges table accessible');
    }
    
    // Test organization members
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('*')
      .limit(1);
    
    if (membersError) {
      console.log('❌ Organization members query failed:', membersError.message);
    } else {
      console.log('✅ Organization members table accessible');
    }
    
    console.log('\n✨ Database fixes complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Refresh your browser');
    console.log('2. Login with: test@example.com / testpass123');
    console.log('3. You should be able to access the app now');
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

fixDatabaseIssues().catch(console.error);