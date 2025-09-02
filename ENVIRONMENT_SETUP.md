Environment Setup

This document lists all required environment variables and where to configure them for local development, CI, and production (Vercel + Supabase).

Client (Vite)
- VITE_SUPABASE_URL: Your Supabase project URL (https://YOUR-PROJECT.supabase.co)
- VITE_SUPABASE_ANON_KEY: Supabase anon/public key
- VITE_GOOGLE_MAPS_API_KEY: Google Maps JS API key (restricted to your domains)
- VITE_STRIPE_PUBLIC_KEY: Stripe publishable key (pk_live... or pk_test...)

Node/CI (scripts, tools)
- SUPABASE_URL: Same as VITE_SUPABASE_URL but for Node scripts
- SUPABASE_ANON_KEY: Same as VITE_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (server-side only; never in client)

Supabase Edge Functions (Secrets)
- STRIPE_SECRET_KEY: Stripe secret key for payments (sk_live... or sk_test...)

Where to set values
- Local: copy .env.example to .env and fill values. For Node scripts, export vars in your shell or use a .env loader.
- Vercel: Project → Settings → Environment Variables. Add all VITE_* vars for Production and Preview. Do NOT add service role to client runtime.
- Supabase: Project → Edge Functions → Secrets. Add STRIPE_SECRET_KEY for payment functions.

Google Maps key restrictions
- Application restrictions: HTTP referrers → add your production and preview domains (e.g., https://yourapp.vercel.app/*, https://yourdomain.com/*).
- API restrictions: Restrict to “Maps JavaScript API”.

Stripe configuration
- Publishable key (VITE_STRIPE_PUBLIC_KEY) goes to client. Secret key (STRIPE_SECRET_KEY) goes to Supabase function secrets.
- Ensure allowed origins are set in create-payment function CORS list.

Supabase notes
- Keep service role key server-side only. Rotate any previously committed keys.
- Confirm RLS policies for multi-tenant isolation before enabling production traffic.

Quick verification
- Local build: npm ci && npm run build:vercel
- Type check: npm run check
- E2E smoke (optional): npm run test:e2e

