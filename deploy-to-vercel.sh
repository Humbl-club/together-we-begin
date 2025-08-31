#!/bin/bash

echo "🚀 VERCEL + SUPABASE DEPLOYMENT SCRIPT"
echo "======================================"
echo ""

# Step 1: Install Vercel CLI if not installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Step 2: Build the project
echo "🔨 Building project for production..."
npm run build

# Step 3: Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Note your Vercel deployment URL"
echo "2. Go to https://vercel.com/dashboard"
echo "3. Click on your project 'together-we-begin'"
echo "4. Go to Settings > Environment Variables"
echo "5. Add these environment variables:"
echo ""
echo "   VITE_SUPABASE_URL = https://ynqdddwponrqwhtqfepi.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDYwOTMsImV4cCI6MjA2NzU4MjA5M30.LoH2muJ_kTSk3y_fBlxEq3m9q5LTQaMaWBSFyh4JDzQ"
echo ""
echo "6. Go to Settings > Domains"
echo "7. Add custom domain: humble.club"
echo "8. Test your deployment!"
echo ""
echo "🔗 Your app will be live at: https://together-we-begin.vercel.app"
echo "🔗 Your custom domain: https://humble.club (after setup)"
