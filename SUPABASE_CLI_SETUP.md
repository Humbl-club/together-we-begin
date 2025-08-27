# Supabase CLI Setup & Usage

## ✅ Status: READY TO USE!

Your Supabase local development environment is now running!

## Connection Details
- **API URL**: http://127.0.0.1:54321
- **GraphQL URL**: http://127.0.0.1:54321/graphql/v1
- **Studio URL**: http://127.0.0.1:54323 (Web interface)
- **DB URL**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Inbucket URL**: http://127.0.0.1:54324 (Email testing)

## Quick Commands

### Start/Stop Supabase
```bash
npx supabase start    # Start local development environment
npx supabase stop     # Stop local development environment
npx supabase status   # Check status
```

### Run SQL Queries
```bash
# Using the convenience script:
./run-sql.sh "SELECT version();"
./run-sql.sh "SELECT current_database(), current_user;"

# Using Docker directly:
docker exec supabase_db_workspace psql -U postgres -d postgres -c "SELECT version();"
```

### Push Migrations
```bash
npx supabase db push  # Push local migrations to Supabase
```

## VS Code Tasks Available

Use `Ctrl+Shift+P` → "Tasks: Run Task" → Select:

- **"Supabase: Start Local"** - Start the development environment
- **"Supabase: Stop Local"** - Stop the development environment  
- **"Supabase: Push Migrations"** - Push migrations to Supabase
- **"Supabase: Run SQL Query - Version"** - Test database connection
- **"Supabase: Run SQL Query - List Tables"** - List all tables
- **"Supabase: Run Custom SQL Query"** - Enter custom SQL to run

## npm scripts available
```bash
npm run supabase:start  # Start local Supabase
npm run supabase:stop   # Stop local Supabase
npm run supabase:push   # Push migrations
```

## Access Supabase Studio
Open http://127.0.0.1:54323 in your browser for the web interface!

## File Structure
- `supabase/migrations/` - Your SQL migration files
- `run-sql.sh` - Convenience script for running SQL queries
- `.vscode/tasks.json` - VS Code tasks for Supabase operations
