const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ynqdddwponrqwhtqfepi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDYwOTMsImV4cCI6MjA2NzU4MjA5M30.LoH2muJ_kTSk3y_fBlxEq3m9q5LTQaMaWBSFyh4JDzQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeMaxSuperAdmin() {
  console.log('🔧 Making Max Hufschlag a Super Admin...');
  console.log('📧 Email: max.hufschlag@googlemail.com');
  console.log('🆔 User ID: 71f538b8-c7ce-4f52-b9da-87ea7f6458b4');
  console.log('');

  try {
    // Insert or update platform_admins record
    const { data: adminData, error: adminError } = await supabase
      .from('platform_admins')
      .upsert({
        user_id: '71f538b8-c7ce-4f52-b9da-87ea7f6458b4',
        role: 'super_admin',
        is_active: true,
        permissions: [
          'all_access',
          'manage_organizations',
          'manage_users', 
          'manage_billing',
          'manage_platform',
          'view_analytics',
          'manage_features',
          'access_all_orgs'
        ],
        created_at: new Date().toISOString(),
        created_by: '71f538b8-c7ce-4f52-b9da-87ea7f6458b4'
      }, {
        onConflict: 'user_id,role'
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Error creating platform admin:', adminError);
      throw adminError;
    }

    console.log('✅ Platform admin record created/updated');

    // Ensure profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: '71f538b8-c7ce-4f52-b9da-87ea7f6458b4',
        full_name: 'Max Hufschlag',
        bio: 'Platform Super Administrator',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (profileError) {
      console.error('⚠️  Warning: Could not update profile:', profileError);
    } else {
      console.log('✅ Profile record created/updated');
    }

    // Log the action
    const { error: logError } = await supabase
      .from('platform_audit_logs')
      .insert({
        admin_id: '71f538b8-c7ce-4f52-b9da-87ea7f6458b4',
        action_type: 'grant_super_admin',
        target_type: 'user',
        target_id: '71f538b8-c7ce-4f52-b9da-87ea7f6458b4',
        action_details: {
          email: 'max.hufschlag@googlemail.com',
          role: 'super_admin',
          reason: 'Initial platform setup',
          granted_by: 'System Administrator'
        },
        ip_address: '127.0.0.1',
        user_agent: 'CLI/Script',
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.log('⚠️  Warning: Could not create audit log:', logError);
    } else {
      console.log('✅ Audit log created');
    }

    // Verify the assignment
    const { data: verification, error: verifyError } = await supabase
      .from('platform_admins')
      .select('*')
      .eq('user_id', '71f538b8-c7ce-4f52-b9da-87ea7f6458b4')
      .single();

    if (verifyError) {
      console.error('❌ Could not verify super admin status:', verifyError);
    } else {
      console.log('\n🎉 SUCCESS! Max Hufschlag is now a Super Admin');
      console.log('📋 Admin Details:');
      console.log('   Role:', verification.role);
      console.log('   Active:', verification.is_active);
      console.log('   Created:', new Date(verification.created_at).toLocaleString());
      console.log('\n🔑 Permissions:');
      if (Array.isArray(verification.permissions)) {
        verification.permissions.forEach(perm => {
          console.log(`   • ${perm}`);
        });
      }
    }

    console.log('\n✨ Max can now:');
    console.log('   • Access /super-admin dashboard');
    console.log('   • Manage all organizations');
    console.log('   • View platform analytics');
    console.log('   • Manage users and billing');
    console.log('   • Control platform features');
    console.log('\n🚀 Log in with max.hufschlag@googlemail.com to access super admin features!');

  } catch (error) {
    console.error('❌ Failed to make user super admin:', error);
    process.exit(1);
  }
}

makeMaxSuperAdmin();