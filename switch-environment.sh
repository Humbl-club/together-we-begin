#!/bin/bash

echo "🔄 SUPABASE ENVIRONMENT SWITCHER"
echo "================================"
echo ""
echo "1) Local Development (Docker)"
echo "2) Production (Supabase Cloud)"
echo "3) Staging (Supabase Cloud - if available)"
read -p "Select environment (1-3): " choice

case $choice in
  1)
    echo "✅ Switching to LOCAL environment..."
    cat > .env.local << EOF
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF
    npx supabase start
    ;;
  2)
    echo "✅ Switching to PRODUCTION environment..."
    cat > .env.local << EOF
VITE_SUPABASE_URL=https://ynqdddwponrqwhtqfepi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucWRkZHdwb25ycXdodHFmZXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5ODU1NTgsImV4cCI6MjA0NjU2MTU1OH0.qNiiDoOBPRh3Afhh66sYMWPl1R5kHx2-hDLtLqooFPM
EOF
    ;;
  3)
    echo "⚠️ Staging environment not configured yet"
    exit 1
    ;;
esac

echo "🔄 Restarting application..."
npm run dev:frontend
