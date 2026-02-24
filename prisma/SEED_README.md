# Seed Script Quick Guide

This project includes a seed script at `prisma/seed.js` to create local test users and a ready-to-test demo workspace.

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
- Subaccount: `Seed Subaccount`
- Subaccount ID: `22222222-2222-2222-2222-222222222222`

### Users and credentials

- `AGENCY_OWNER` -> `owner@example.com` / `Owner@12345`
- `AGENCY_ADMIN` -> `admin@example.com` / `Admin@12345`
- `SUBACCOUNT_USER` -> `member@example.com` / `Member@12345`

### Stripe demo fields (DB-only seed)

- Agency `connectAccountId`: `acct_demo_seed_agency`
- Agency `customerId`: `cus_demo_seed_agency`
- Subaccount `connectAccountId`: `acct_demo_seed_subaccount`
- Active subscription seeded for the agency with default price:
  - `priceId`: `price_1OYxkqFj9oKEERu1KfJGWxgN`
  - `subscritiptionId`: `sub_demo_seed_agency`

### Extra demo records

- Agency and subaccount sidebar options
- Subaccount permissions for owner, admin, and member
- Demo pipeline + lanes + tags + tickets + contact
- Demo media item
- Demo funnel + funnel page

## Behavior

- Idempotent: uses Prisma `upsert`, so running again updates existing seed users instead of creating duplicates.
- Idempotent: uses Prisma `upsert`, so rerunning updates existing demo records instead of duplicating them.
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
- `SEED_AGENCY_CONNECT_ACCOUNT_ID`, `SEED_AGENCY_CUSTOMER_ID`
- `SEED_SUBACCOUNT_ID`, `SEED_SUBACCOUNT_NAME`, `SEED_SUBACCOUNT_EMAIL`
- `SEED_SUBACCOUNT_PHONE`, `SEED_SUBACCOUNT_ADDRESS`, `SEED_SUBACCOUNT_CITY`
- `SEED_SUBACCOUNT_ZIP`, `SEED_SUBACCOUNT_STATE`, `SEED_SUBACCOUNT_COUNTRY`
- `SEED_SUBACCOUNT_CONNECT_ACCOUNT_ID`
- `SEED_STRIPE_SUBSCRIPTION_ID`, `SEED_STRIPE_PRICE_ID`, `SEED_STRIPE_PLAN`, `SEED_STRIPE_PERIOD_DAYS`

Example:

```bash
SEED_OWNER_EMAIL="sonu@example.com" SEED_OWNER_PASSWORD="StrongPass@123" npm run seed
```

## Notes

- Use these defaults only for local development/testing.
- Change credentials in non-local environments.
