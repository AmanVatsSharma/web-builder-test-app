# PostgreSQL migration guide

This project now uses PostgreSQL in `prisma/schema.prisma`.

## 1) Fresh or disposable database

Use this when the database is empty (or can be reset safely):

```bash
npx prisma migrate deploy
npx prisma generate
```

## 2) Existing PostgreSQL database with important data

Use this when tables/data already exist and must be preserved:

1. Confirm `DATABASE_URL` points to the target database.
2. Mark the baseline migration as applied (without running SQL):

```bash
npx prisma migrate resolve --applied 20260224130000_postgresql_baseline
```

3. Run pending migrations (if any):

```bash
npx prisma migrate deploy
```

4. Regenerate client:

```bash
npx prisma generate
```

## 3) Drift check (optional)

```bash
npx prisma migrate diff --from-config-datasource --to-migrations prisma/migrations --exit-code
```
