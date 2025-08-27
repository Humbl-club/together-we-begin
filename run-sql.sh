#!/bin/bash

# Script to run SQL queries against local Supabase database
# Usage: ./run-sql.sh "SELECT * FROM users;"

if [ $# -eq 0 ]; then
    echo "Usage: $0 \"SQL_QUERY\""
    echo "Example: $0 \"SELECT version();\""
    exit 1
fi

SQL_QUERY="$1"

echo "Running SQL query against local Supabase database..."
echo "Query: $SQL_QUERY"
echo "----------------------------------------"

docker exec supabase_db_workspace psql -U postgres -d postgres -c "$SQL_QUERY"
