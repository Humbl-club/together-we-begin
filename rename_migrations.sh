#!/bin/bash

# Script to rename timestamp-UUID migrations to integer format
# Makes migration files much cleaner and easier to manage

cd /home/runner/workspace/supabase/migrations

echo "Starting migration rename process..."
echo "Current format: timestamp-UUID (complex)"
echo "New format: integer sequence (simple)"
echo ""

# Starting number (we already have 001-011)
counter=12

# Get all timestamp-based migrations sorted by name (which sorts by date)
for file in $(ls | grep "^20" | sort); do
    # Format counter with leading zeros (012, 013, etc.)
    new_number=$(printf "%03d" $counter)
    
    # Extract a meaningful name from the file if possible
    # For now, just use a generic name based on date
    date_part=$(echo $file | cut -d'-' -f1 | cut -c1-8)
    
    # Create new filename
    new_name="${new_number}_migration_${date_part}.sql"
    
    # Rename the file
    echo "Renaming: $file -> $new_name"
    mv "$file" "$new_name"
    
    # Increment counter
    counter=$((counter + 1))
done

echo ""
echo "✅ Migration rename complete!"
echo "Renamed $((counter - 12)) files to integer format"
echo ""
echo "New migration files:"
ls -1 *.sql | head -20