import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ynqdddwponrqwhtqfepi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeMaxSuperAdmin() {
  console.log('🔧 Making Max Hufschlag a Super Admin...');
  console.log('📧 Email: max.hufschlag@googlemail.com');
  console.log('🆔 User ID: 71f538b8-c7ce-4f52-b9da-87ea7f6458b4');
  console.log('');

  try {
    // First, ensure the user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(
      '71f538b8-c7ce-4f52-b9da-87ea7f6458b4'
    );

    if (userError) {
      console.log('⚠️  Could not verify user via Auth API (might need service key)');
    } else {
      console.log('✅ User verified in Auth system');
    }

    // Insert or update platform_admins record
    const { data: adminData, error: adminError } = await supabase
      .from('platform_admins')
      .upsert({
        user_id: '71f538b8-c7ce-4f52-b9da-87ea7f6458b4',
        role: 'super_admin',
        is_active: true,
        permissions: {
          all_access: true,
          can_manage_organizations: true,
          can_manage_users: true,
          can_manage_billing: true,
          can_manage_platform: true,
          can_view_analytics: true,
          can_manage_features: true,
          can_access_all_orgs: true
        },
        created_at: new Date().toISOString(),
        created_by: '71f538b8-c7ce-4f52-b9da-87ea7f6458b4',
        notes: 'Max Hufschlag - Platform Super Admin'
      }, {
        onConflict: 'user_id'
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
      Object.entries(verification.permissions).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }

    console.log('\n✨ Max can now access /super-admin dashboard and manage the entire platform!');

  } catch (error) {
    console.error('❌ Failed to make user super admin:', error);
    process.exit(1);
  }
}

makeMaxSuperAdmin();