Added Features (This Update)

- Supabase Edge functions for organization subscriptions:
  - create-org-subscription: start Stripe Checkout for Basic/Pro
  - verify-org-subscription: verify session, create org, add owner, record billing
- Free org creation via entitlement or Free plan:
  - create-org-free: creates org for Free users; allows Enterprise if user has free_unlimited entitlement
- Admin-only free entitlement grant:
  - grant-free-account: grants user free_unlimited in user_entitlements
- Onboarding integration:
  - OrganizationOnboarding calls the new functions; paid plans via Stripe, free via Edge function
- Payments hardening:
  - Event payments already attached using create-payment and verify-payment; CORS now via ALLOWED_ORIGINS
- Security + config:
  - CSP headers in vercel.json
  - All keys/env moved to Vercel/Supabase secrets; examples added

System Flow Diagram (Color-coded status)

Legend: 🟢 production-ready  🟠 needs configuration/tests  🔴 not ready/broken

User → App (Vercel SPA) → Supabase/Auth/DB → Stripe → Back

1) Invited User Join (No Payment)
   🟢  User opens invite link (/join/:code)
   🟢  App loads invite + org data (OrganizationAuth)
   🟢  User signs up / logs in (Supabase Auth)
   🟢  Membership created (invites → organization_members)
   🟢  Redirect to dashboard

2) Event Registration Flow
   🟢  Event page → “Register” → PaymentModal
   🟠  Choose: Stripe or Loyalty Points
        • Stripe → call create-payment (Edge) → Stripe Checkout → return → verify-payment (Edge)
        • Points → create registration + loyalty transaction (Edge)
   🟠  Event capacity increment RPC, loyalty points award
   🟠  Success toast → Events reloaded
   Notes: Requires Stripe + Supabase secrets and ALLOWED_ORIGINS; test on Preview/Prod.

3) Organization Creation (Club Creator)
   A) Free/Entitled
      🟠  Onboarding → select Free or Enterprise (if entitled)
      🟠  call create-org-free (Edge) with name/slug/features
      🟠  DB: organizations insert → organization_members owner → profiles.current_organization_id
      🟠  Redirect to dashboard
      Note: Enterprise path requires user_entitlements.free_unlimited.

   B) Paid (Basic/Pro)
      🟠  Onboarding → select Basic/Pro
      🟠  call create-org-subscription (Edge) → Stripe Checkout (subscription)
      🟠  return to /organization/new?org_payment=success&session_id=...
      🟠  call verify-org-subscription (Edge)
           → create org + owner membership
           → insert platform_billing (period, price, status)
      🟠  Redirect to dashboard
      Notes: Requires Stripe price IDs + secrets + ALLOWED_ORIGINS; deploy functions.

4) Admin: Grant Free Unlimited Access
   🟠  Admin (platform_admins) → call grant-free-account (Edge) with userId
   🟠  Upsert user_entitlements.free_unlimited = true
   🟠  On next onboarding, Enterprise plan is allowed with no payment

5) Platform & Security
   🟢  SPA hosting with strict CSP (vercel.json)
   🟢  Env handling via Vercel/Supabase secrets; no secrets in repo
   🔴  TypeScript: many strict type errors → needs staged fixes
   🟠  RLS/Policies: review/verify coverage on all org-scoped tables
   🟠  Supabase migrations: ensure required functions/tables exist across envs

Outstanding Work (Prioritized)

- 🔴 Fix TypeScript type errors (Messaging, repositories, tests) and enable blocking type-check in CI
- 🟠 Deploy new functions and set secrets:
  - create-org-free, create-org-subscription, verify-org-subscription, grant-free-account
  - Set STRIPE_SECRET_KEY, STRIPE_PRICE_* and ALLOWED_ORIGINS in Supabase
- 🟠 Verify RLS policies for org isolation; add missing indexes for hot paths
- 🟠 Full E2E tests for:
  - Free org creation, Paid org subscription success/cancel, Admin grant → Enterprise creation
  - Event payment with Stripe + points
- 🟠 Tune CSP if any assets/APIs are blocked in production logs
