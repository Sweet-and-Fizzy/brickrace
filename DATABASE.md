# BrickRace Database Management

## Quick Reference

### Environment Info
- **Production**: `ehbmnhyyycvduhtfgoho` - Live users
- **Staging**: `kdmumpwlyoesxzkgygyu` - Testing before production
- **Local**: `brickrace` - Development

### Common Commands
```bash
# Switch environments
npx supabase link --project-ref ehbmnhyyycvduhtfgoho  # Production
npx supabase link --project-ref kdmumpwlyoesxzkgygyu  # Staging

# Schema management (migrations)
npx supabase db diff -f feature_name  # Create migration
npx supabase db push                  # Push to remote
npx supabase db reset                 # Reset local to migrations

# Data backup (production)
./simple-backup.sh                    # Full backup (nuclear option)
```

---

## Schema Management (Migrations)

Use migrations for all schema changes. Never manually edit production schema.

### Making Schema Changes

1. **Develop locally**:
   ```bash
   cd frontend
   npx supabase start
   # Make changes in Supabase Studio or SQL Editor
   ```

2. **Generate migration**:
   ```bash
   npx supabase db diff -f add_new_feature
   # Review the generated migration file
   ```

3. **Test locally**:
   ```bash
   npx supabase db reset  # Apply all migrations fresh
   ```

4. **Deploy to staging**:
   ```bash
   npx supabase link --project-ref kdmumpwlyoesxzkgygyu
   npx supabase db push
   ```

5. **Deploy to production** (after staging validation):
   ```bash
   npx supabase link --project-ref ehbmnhyyycvduhtfgoho
   npx supabase db push
   ```

### Migration Baseline

We squashed all migrations into a single baseline on 2025-01-01:
- `20250101000000_squashed_baseline.sql` - Current production schema snapshot

---

## Data Management (Backups)

### Full Production Backup (Nuclear Option)

Use before major changes or for disaster recovery:

```bash
./simple-backup.sh
```

Creates: `backups/complete_production_YYYYMMDD_HHMMSS.sql`

This includes:
- All schemas (public, auth, storage, etc.)
- All data
- Use this as your "nuclear option" backup

### Public Schema Only Backup

For testing migrations in staging without auth/storage:

```bash
cd frontend
npx supabase db dump --schema public --file ../backups/public_only.sql
```

### Restoring Data Locally

```bash
cd frontend
npx supabase db reset  # Reset to clean migration state
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < ../backups/your_backup.sql
```

### Restoring to Remote (Staging)

**Method 1: SQL Editor** (Recommended for public schema):
1. Go to staging SQL Editor
2. Paste and run the SQL from backup file

**Method 2: psql** (For full backups):
- Get connection string from dashboard
- Use Session mode (port 5432), not Transaction mode
- Format: `postgres.PROJECT_ID@aws-0-region.pooler.supabase.com:5432`

---

## Common Workflows

### Setting Up Staging Environment

```bash
# 1. Link to staging
cd frontend
npx supabase link --project-ref kdmumpwlyoesxzkgygyu

# 2. Push migrations
npx supabase db push

# 3. Seed with test data
npx supabase db seed  # Uses supabase/seed.sql
```

### Testing Migration Before Production

```bash
# 1. Create migration locally
npx supabase db diff -f new_feature
npx supabase db reset  # Test locally

# 2. Push to staging first
npx supabase link --project-ref kdmumpwlyoesxzkgygyu
npx supabase db push

# 3. Validate in staging, then push to prod
npx supabase link --project-ref ehbmnhyyycvduhtfgoho
npx supabase db push
```

### Emergency Production Backup

```bash
# Immediate full backup
./simple-backup.sh

# Backup is saved to: backups/complete_production_TIMESTAMP.sql
```

---

## Best Practices

### ✅ DO:
- Use migrations for all schema changes
- Test in staging before production
- Take full backup before major changes (`./simple-backup.sh`)
- Commit migrations to git
- Use seed data for testing

### ❌ DON'T:
- Manually edit production schema
- Use backups to sync schema (use migrations)
- Commit backup SQL files to git
- Skip staging testing
- Run untested migrations on production

---

## Troubleshooting

### "Migration already exists" error
```bash
# Check what's applied
npx supabase migration list

# Mark as reverted if needed
npx supabase migration repair --status reverted VERSION
```

### Staging out of sync
```bash
# Reset staging to match production migrations
npx supabase link --project-ref kdmumpwlyoesxzkgygyu
npx supabase db reset --linked
```

### Need production data locally
```bash
# Backup from production
./simple-backup.sh

# Restore to local
cd frontend
npx supabase db reset
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < ../backups/complete_production_*.sql
```
