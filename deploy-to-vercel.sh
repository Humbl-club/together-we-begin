#!/bin/bash

echo "🚀 VERCEL PRODUCTION DEPLOYMENT SCRIPT"
echo "======================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.vercel exists
if [ ! -f ".env.vercel" ]; then
    echo -e "${RED}❌ .env.vercel file not found!${NC}"
    echo "Please ensure .env.vercel exists with required environment variables"
    exit 1
fi

# Step 1: Install Vercel CLI if not installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Step 2: Check dependencies
echo "📦 Installing dependencies..."
npm install

# Step 3: Run type checking
echo "🔍 Running type checks..."
npm run check || {
    echo -e "${YELLOW}⚠️  TypeScript warnings detected (continuing...)${NC}"
}

# Step 4: Build the project
echo "🔨 Building project for production..."
npm run build || {
    echo -e "${RED}❌ Build failed! Please fix errors before deploying.${NC}"
    exit 1
}

# Step 5: Check build output
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build directory 'dist' not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

# Step 6: Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo "Select 'Y' to link to existing project or 'N' to create new one"
vercel --prod || {
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
}

echo ""
echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
echo ""
echo "📋 POST-DEPLOYMENT CHECKLIST:"
echo "=============================="
echo ""
echo "1️⃣  ENVIRONMENT VARIABLES"
echo "   Go to: https://vercel.com/dashboard"
echo "   Select your project → Settings → Environment Variables"
echo "   Add all variables from .env.vercel file"
echo ""
echo "2️⃣  CUSTOM DOMAIN (Optional)"
echo "   Go to: Settings → Domains"
echo "   Add your custom domain (e.g., humble.club)"
echo "   Configure DNS records as instructed"
echo ""
echo "3️⃣  SUPABASE CONFIGURATION"
echo "   Go to: https://supabase.com/dashboard"
echo "   Project Settings → API → Allowed Origins"
echo "   Add your Vercel URLs:"
echo "   - https://together-we-begin.vercel.app"
echo "   - https://your-custom-domain.com"
echo ""
echo "4️⃣  EDGE FUNCTIONS (If using payments)"
echo "   Supabase Dashboard → Edge Functions → Secrets"
echo "   Add STRIPE_SECRET_KEY (with domain restriction)"
echo ""
echo "5️⃣  VERIFY DEPLOYMENT"
echo "   Test these critical paths:"
echo "   ✓ Authentication (login/signup)"
echo "   ✓ Organization creation"
echo "   ✓ Theme customization"
echo "   ✓ Dashboard widgets"
echo "   ✓ Real-time features"
echo ""
echo "🔗 DEPLOYMENT URLS:"
echo "   Production: https://together-we-begin.vercel.app"
echo "   Custom Domain: https://[your-domain] (after setup)"
echo ""
echo "📊 MONITORING:"
echo "   Vercel Dashboard: https://vercel.com/dashboard"
echo "   Analytics: Project → Analytics"
echo "   Logs: Project → Functions → Logs"
