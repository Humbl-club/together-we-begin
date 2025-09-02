import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const env = (name: string, required = true) => {
  const v = Deno.env.get(name);
  if (required && (!v || v.length === 0)) throw new Error(`${name} not set`);
  return v || '';
}

const envAllowed = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
const defaultAllowed = ['http://localhost:5000', 'http://localhost:3000'];
const allowedOrigins = envAllowed.length ? envAllowed : defaultAllowed;

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

type Body = { userId: string; notes?: string };

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const supabaseAnon = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'));
    const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader?.replace('Bearer ', '') || '';
    const { data: userData } = await supabaseAnon.auth.getUser(token);
    const caller = userData.user;
    if (!caller?.id) return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers, status: 401 });

    // Check platform admin permissions
    const { data: admin } = await supabase
      .from('platform_admins')
      .select('role, permissions, is_active')
      .eq('user_id', caller.id)
      .eq('is_active', true)
      .maybeSingle();

    const perms = (admin?.permissions as string[] | null) || [];
    const isAllowed = admin?.role === 'super_admin' || perms.includes('billing_management') || perms.includes('all_access');
    if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { headers, status: 403 });

    const { userId, notes } = (await req.json()) as Body;
    if (!userId) return new Response(JSON.stringify({ error: 'userId required' }), { headers, status: 400 });

    // Upsert entitlement
    const { error } = await supabase
      .from('user_entitlements')
      .upsert({ user_id: userId, free_unlimited: true, notes, granted_by: caller.id })
      .select('user_id')
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { headers, status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), { headers, status: 500 });
  }
});

