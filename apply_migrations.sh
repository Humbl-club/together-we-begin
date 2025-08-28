#!/bin/bash

# ============================================================================
# MIGRATION APPLICATION SCRIPT
# ============================================================================
# This script applies the Day 1-2 multi-tenant migrations to your Supabase database
# ============================================================================

echo "==========================================="
echo "MULTI-TENANT MIGRATION SCRIPT"
echo "==========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI is not installed${NC}"
    echo "Install it with: brew install supabase/tap/supabase"
    exit 1
fi

# Function to apply migration
apply_migration() {
    local migration_file=$1
    local migration_name=$2
    
    echo -e "${YELLOW}Applying migration: $migration_name${NC}"
    echo "File: $migration_file"
    echo "----------------------------------------"
    
    # Apply the migration
    supabase db push --file "$migration_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $migration_name applied successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to apply $migration_name${NC}"
        return 1
    fi
}

# Function to check migration status
check_migration_status() {
    echo -e "${YELLOW}Checking current migration status...${NC}"
    
    # Check if organizations table exists
    supabase db query "SELECT COUNT(*) FROM organizations;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Organizations table exists${NC}"
        
        # Get organization count
        ORG_COUNT=$(supabase db query "SELECT COUNT(*) FROM organizations;" --json | jq '.[0].count')
        echo "  Organizations: $ORG_COUNT"
        
        # Get member count
        MEMBER_COUNT=$(supabase db query "SELECT COUNT(*) FROM organization_members;" --json | jq '.[0].count')
        echo "  Members: $MEMBER_COUNT"
    else
        echo -e "${YELLOW}⚠ Organizations table does not exist yet${NC}"
    fi
    echo ""
}

# Main execution
echo "Starting migration process..."
echo ""

# Check current status
check_migration_status

# Confirm with user
echo -e "${YELLOW}This will apply the following migrations:${NC}"
echo "1. Day 1: Complete Multi-tenant Foundation (100_day1_complete_multitenant.sql)"
echo "2. Day 2: Security, Indexes, and Performance (101_day2_security_indexes.sql)"
echo ""
read -p "Do you want to continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "==========================================="
echo "PHASE 1: DAY 1 MIGRATIONS"
echo "==========================================="
echo ""

# Apply Day 1 migrations
if apply_migration "supabase/migrations/100_day1_complete_multitenant.sql" "Day 1 - Multi-tenant Foundation"; then
    echo -e "${GREEN}Day 1 migrations completed successfully!${NC}"
    echo ""
    
    # Check status after Day 1
    check_migration_status
    
    echo ""
    echo "==========================================="
    echo "PHASE 2: DAY 2 MIGRATIONS"
    echo "==========================================="
    echo ""
    
    # Apply Day 2 migrations
    if apply_migration "supabase/migrations/101_day2_security_indexes.sql" "Day 2 - Security and Performance"; then
        echo -e "${GREEN}Day 2 migrations completed successfully!${NC}"
        echo ""
        
        # Final status check
        echo "==========================================="
        echo "FINAL STATUS"
        echo "==========================================="
        check_migration_status
        
        echo ""
        echo -e "${GREEN}✓ ALL MIGRATIONS COMPLETED SUCCESSFULLY!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Test the database changes with: npm run test:db"
        echo "2. Update frontend hooks to use organization context"
        echo "3. Deploy the updated application"
        
    else
        echo -e "${RED}Day 2 migrations failed. Please check the error messages above.${NC}"
        exit 1
    fi
else
    echo -e "${RED}Day 1 migrations failed. Please check the error messages above.${NC}"
    exit 1
fi

echo ""
echo "==========================================="
echo "MIGRATION SUMMARY"
echo "==========================================="
echo "✓ Multi-tenant tables created"
echo "✓ Organization_id added to all tables"
echo "✓ Existing data migrated to default organization"
echo "✓ RLS policies updated for multi-tenancy"
echo "✓ Performance indexes created"
echo "✓ Helper functions installed"
echo ""
echo -e "${GREEN}Database is now ready for multi-tenant operations!${NC}"