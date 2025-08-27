import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const supabaseUrl = 'https://ynqdddwponrqwhtqfepi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwNjA5MywiaGV4cCI6MjA2NzU4MjA5M30.Xd_gxkWK1ufyG9chejudVrfOyiTQQZZ0MIH3mOvwo_E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runQuery() {
    // Example: Get all admin users
    const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'admin');
    
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Admin users:', data);
    }
    
    // You can run any query here
    // INSERT example:
    // const { data, error } = await supabase
    //     .from('your_table')
    //     .insert({ column: 'value' });
    
    // UPDATE example:
    // const { data, error } = await supabase
    //     .from('your_table')
    //     .update({ column: 'new_value' })
    //     .eq('id', 'some_id');
    
    // DELETE example:
    // const { data, error } = await supabase
    //     .from('your_table')
    //     .delete()
    //     .eq('id', 'some_id');
}

runQuery();