# Clean Database Command

This command removes application data without dropping tables or modifying
`schema_migrations`. It runs separately from the migration command.

By default it preserves seeded reference data in `badges`.

Create and verify a backup with `cmd/backup-db` before cleaning important data.

Run from the `backend` directory:

```bash
go run cmd/clean-db/main.go --confirm CLEAN_ALL_APP_DATA
```

To also remove seeded reference data:

```bash
go run cmd/clean-db/main.go \
  --confirm CLEAN_ALL_APP_DATA \
  --include-reference-data
```

Production requires two additional explicit approvals:

```bash
ALLOW_PRODUCTION_DATABASE_CLEAN=CLEAN_ALL_APP_DATA \
go run cmd/clean-db/main.go \
  --confirm CLEAN_ALL_APP_DATA \
  --allow-production
```

Do not run this command while the backend is serving requests. Stop the backend,
run the clean command, then start the backend again.
