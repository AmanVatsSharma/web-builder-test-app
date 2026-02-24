# Seed Script Quick Guide

This project includes a seed script at `prisma/seed.js` to create local test users you can log in with.

## Run seed

```bash
npm run seed
```

This runs:

```bash
prisma db seed
```

## Default seeded data

- Agency: `Seed Agency`
- Agency ID: `11111111-1111-1111-1111-111111111111`

### Users and credentials

- `AGENCY_OWNER` -> `owner@example.com` / `Owner@12345`
- `AGENCY_ADMIN` -> `admin@example.com` / `Admin@12345`
- `SUBACCOUNT_USER` -> `member@example.com` / `Member@12345`

## Behavior

- Idempotent: uses Prisma `upsert`, so running again updates existing seed users instead of creating duplicates.
- Passwords are securely hashed with `bcryptjs`.
- All seeded users are marked with `emailVerified = new Date()`.

## Optional environment overrides

You can override defaults by setting env vars before running `npm run seed`.

Common overrides:

- `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD`, `SEED_OWNER_NAME`
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`
- `SEED_MEMBER_EMAIL`, `SEED_MEMBER_PASSWORD`, `SEED_MEMBER_NAME`
- `SEED_AGENCY_ID`, `SEED_AGENCY_NAME`
- `SEED_AGENCY_PHONE`, `SEED_AGENCY_ADDRESS`, `SEED_AGENCY_CITY`
- `SEED_AGENCY_ZIP`, `SEED_AGENCY_STATE`, `SEED_AGENCY_COUNTRY`

Example:

```bash
SEED_OWNER_EMAIL="sonu@example.com" SEED_OWNER_PASSWORD="StrongPass@123" npm run seed
```

## Notes

- Use these defaults only for local development/testing.
- Change credentials in non-local environments.
