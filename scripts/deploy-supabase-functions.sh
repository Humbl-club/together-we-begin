#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Deploying Supabase Edge Functions"

if ! command -v supabase >/dev/null 2>&1; then
  echo "❌ Supabase CLI not found. Install: https://supabase.com/docs/guides/cli"
  exit 1
fi

if [ ! -f supabase/config.toml ]; then
  echo "❌ supabase/config.toml not found. Run from project root with Supabase initialized."
  exit 1
fi

REQUIRED_SECRETS=(
  SUPABASE_URL
  SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  STRIPE_SECRET_KEY
  STRIPE_PRICE_BASIC_MONTHLY
  STRIPE_PRICE_PRO_MONTHLY
)

MISSING=0
for key in "${REQUIRED_SECRETS[@]}"; do
  if [ -z "${!key:-}" ]; then
    echo "⚠️  Missing env: $key"
    MISSING=1
  fi
done

if [ "${ALLOWED_ORIGINS:-}" = "" ]; then
  echo "ℹ️  ALLOWED_ORIGINS not set; defaults will allow localhost only."
fi

if [ $MISSING -ne 0 ]; then
  echo "❌ Please export missing env vars then re-run."
  exit 1
fi

echo "🔐 Setting shared function secrets"
# Note: project-ref is optional if your CLI is already scoped via config/context
supabase functions secrets set \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  STRIPE_PRICE_BASIC_MONTHLY="${STRIPE_PRICE_BASIC_MONTHLY}" \
  STRIPE_PRICE_PRO_MONTHLY="${STRIPE_PRICE_PRO_MONTHLY}" \
  STRIPE_PRICE_BASIC_YEARLY="${STRIPE_PRICE_BASIC_YEARLY:-}" \
  STRIPE_PRICE_PRO_YEARLY="${STRIPE_PRICE_PRO_YEARLY:-}" \
  ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-}" \
  APP_URL="${APP_URL:-}" \
  PLATFORM_FEE_BPS="${PLATFORM_FEE_BPS:-0}" \
  STRIPE_CONNECT_WEBHOOK_SECRET="${STRIPE_CONNECT_WEBHOOK_SECRET:-}" || true

echo "📦 Deploying functions"
supabase functions deploy create-payment || true
supabase functions deploy verify-payment || true
supabase functions deploy create-org-subscription || true
supabase functions deploy verify-org-subscription || true
supabase functions deploy create-org-free || true
supabase functions deploy grant-free-account || true
supabase functions deploy stripe-connect || true
supabase functions deploy stripe-sync-status || true
supabase functions deploy stripe-connect-webhook || true

echo "✅ Deployment complete"
