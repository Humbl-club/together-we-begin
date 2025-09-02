import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const env = (k: string, required = true) => {
  const v = Deno.env.get(k);
  if (required && (!v || v.length === 0)) throw new Error(`${k} not set`);
  return v || '';
};

const allowed = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
const defaults = ['http://localhost:3000', 'http://localhost:5000'];
const origins = allowed.length ? allowed : defaults;
const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && origins.includes(origin) ? origin : origins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const supabaseAnon = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'));
    const supabaseSrv = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: auth } = await supabaseAnon.auth.getUser(token);
    const user = auth.user;
    if (!user?.id || !user.email) return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers, status: 401 });

    const allowedEmails = (Deno.env.get('SUPERADMIN_EMAILS') || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!allowedEmails.includes(user.email.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { headers, status: 403 });
    }

    // Deactivate any other active super_admin rows
    await supabaseSrv
      .from('platform_admins')
      .update({ is_active: false })
      .eq('role', 'super_admin')
      .neq('user_id', user.id);

    // Upsert super admin role
    const { error } = await supabaseSrv
      .from('platform_admins')
      .upsert({
        user_id: user.id,
        role: 'super_admin',
        is_active: true,
        permissions: ['all_access']
      }, { onConflict: 'user_id,role' });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { headers, status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { headers, status: 500 });
  }
});
