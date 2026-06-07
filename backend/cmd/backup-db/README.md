# Backup Database Command

This command creates a full PostgreSQL backup using `pg_dump` custom format.
It runs separately from the server, migrations, and database cleaner.

Install PostgreSQL client tools first so `pg_dump` and `pg_restore` are
available.

Run from the `backend` directory:

```bash
go run cmd/backup-db/main.go
```

Backups are written to `backend/backups/` by default. Use another directory:

```bash
go run cmd/backup-db/main.go --output-dir /secure/path/sobat-pintar-backups
```

Verify the backup contents:

```bash
pg_restore --list backups/postgres-YYYYMMDD-HHMMSS.dump
```

Restore into an empty target database:

```bash
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname "$DATABASE_URL" \
  backups/postgres-YYYYMMDD-HHMMSS.dump
```

Test restore procedures on a separate database before relying on a backup for
production recovery.
