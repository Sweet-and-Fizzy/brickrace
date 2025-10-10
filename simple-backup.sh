#!/usr/bin/env bash

# Simple Production Backup for Free Supabase Account
echo "🏁 Creating complete production backup..."

mkdir -p backups
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Get absolute path for backup file
ABSOLUTE_BACKUP_FILE="$(pwd)/backups/complete_production_${TIMESTAMP}.sql"

cd frontend

# Get the complete database dump
echo "📦 Dumping complete production database (schema + data)..."

# Create schema dump
echo "🏗️ Step 1: Dumping schema..."
npx supabase db dump --file "${ABSOLUTE_BACKUP_FILE}"

# Append data dump
echo "📊 Step 2: Dumping data..."
cd ..
TEMP_DATA_FILE="$(pwd)/backups/temp_data_${TIMESTAMP}.sql"
cd frontend
npx supabase db dump --data-only --file "${TEMP_DATA_FILE}"

# Combine them
echo "🔗 Step 3: Combining schema + data..."
cd ..
cat "${TEMP_DATA_FILE}" >> "${ABSOLUTE_BACKUP_FILE}"
rm "${TEMP_DATA_FILE}"
cd frontend

cd ..

echo "✅ Complete backup saved to: backups/complete_production_${TIMESTAMP}.sql"
echo "📏 Size: $(du -h backups/complete_production_${TIMESTAMP}.sql | cut -f1)"

echo ""
echo "🎯 Full production backup created"
