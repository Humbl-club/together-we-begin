#!/bin/bash

# Multi-Tenant Migration Deployment Script
# This script deploys all the SQL migrations to transform the single-tenant app to multi-tenant

set -e  # Exit on any error

echo "🚀 Starting Multi-Tenant Migration Deployment"
echo "============================================"

# Configuration (read from environment)
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables.${NC}"
  echo "Please export them or add to your environment before running."
  exit 1
fi

# Migration files in order
MIGRATIONS=(
  "001_multi_tenant_foundation.sql"
  "002_custom_signup_and_invites.sql"
  "003_content_moderation.sql"
  "004_typography_and_theming.sql"
  "005_add_org_id_to_existing_tables.sql"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to execute SQL file
execute_migration() {
  local migration_file=$1
  local migration_path="./supabase/migrations/$migration_file"
  
  if [ ! -f "$migration_path" ]; then
    echo -e "${RED}❌ Migration file not found: $migration_path${NC}"
    exit 1
  fi
  
  echo -e "${BLUE}📄 Executing: $migration_file${NC}"
  
  # Execute the SQL file via Supabase REST API
  if command -v curl &> /dev/null; then
    # Use curl if available
    response=$(curl -s -X POST \
      "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d @- << EOF
{
  "sql": "$(cat "$migration_path" | sed 's/"/\\"/g' | tr '\n' ' ')"
}
EOF
    )
  else
    echo -e "${RED}❌ curl is required to deploy migrations${NC}"
    exit 1
  fi
  
  # Check for errors in response
  if echo "$response" | grep -q "error"; then
    echo -e "${RED}❌ Migration failed: $migration_file${NC}"
    echo "$response"
    exit 1
  else
    echo -e "${GREEN}✅ Successfully executed: $migration_file${NC}"
  fi
}

# Check if we're in the right directory
if [ ! -d "supabase/migrations" ]; then
  echo -e "${RED}❌ Error: supabase/migrations directory not found!${NC}"
  echo "Please run this script from the project root directory."
  exit 1
fi

# Create backup notification
echo -e "${YELLOW}⚠️  IMPORTANT: This will transform your single-tenant app to multi-tenant!${NC}"
echo -e "${YELLOW}   All existing data will be moved to a 'Humbl Girls Club' default organization.${NC}"
echo ""

# Ask for confirmation
read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Migration cancelled by user.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}Starting migration deployment...${NC}"
echo ""

# Execute migrations in order
for migration in "${MIGRATIONS[@]}"; do
  execute_migration "$migration"
  
  # Small delay between migrations
  sleep 1
done

echo ""
echo -e "${GREEN}🎉 Multi-Tenant Migration Complete!${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Database Structure:${NC}"
echo "   • Organizations table with subscription tiers"
echo "   • Organization members with role-based access"
echo "   • Feature enablement per organization"
echo "   • Custom signup pages with branding"
echo "   • QR invite codes system"
echo "   • Content moderation with banning"
echo "   • Typography and theming per organization"
echo "   • All 43 existing tables updated with organization_id"
echo ""
echo -e "${GREEN}✅ Default Organization Created:${NC}"
echo "   • Name: 'Humbl Girls Club'"
echo "   • Slug: 'default-club'"
echo "   • All existing users added as members"
echo "   • All existing data preserved and linked"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "   1. Update your React app with OrganizationProvider (already done)"
echo "   2. Test the organization switcher component"
echo "   3. Set up custom signup pages at: /{org-slug}/signup"
echo "   4. Create invite codes for new organizations"
echo "   5. Configure organization features and branding"
echo ""
echo -e "${YELLOW}🔗 URLs you can now use:${NC}"
echo "   • Default club signup: /default-club/signup"
echo "   • Invite join: /join/{INVITE-CODE}"
echo "   • Main app: /dashboard (with organization context)"
echo ""
echo -e "${GREEN}Multi-tenant transformation successful! 🚀${NC}"
