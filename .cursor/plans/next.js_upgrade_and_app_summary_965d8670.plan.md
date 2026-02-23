---
name: Next.js Upgrade and App Summary
overview: Plan to upgrade the web-builder-test-app from Next.js 14.2.4 to the latest stable Next.js 16.x, and document what has been accomplished in the app so far.
todos: []
isProject: false
---

# Next.js Upgrade Plan and App Accomplishment Summary

---

## Part 1: What's Been Accomplished in This App

The **W-Build** (Web Builder Test) app is an agency/SaaS platform foundation with the following built so far:

### Core Infrastructure

- **Next.js 14.2.4** with App Router
- **Clerk** authentication (sign-in, sign-up, UserButton)
- **Prisma** ORM with MySQL and a full multi-tenant schema
- **Uploadthing** for file uploads
- **shadcn/ui** component library (40+ Radix-based components)
- **Tailwind CSS** with dark/light theme via `next-themes`

### Routing Structure

- `**/**` – Root redirect: unauthenticated → `/site`, authenticated → `/agency`
- `**/site**` – Public landing page with hero, pricing cards (Starter, Basic, Unlimited SaaS)
- `**/agency**` – Protected agency dashboard (placeholder)
- `**/agency/sign-in**`, `**/agency/sign-up**` – Auth pages
- `**/[domain]/[path]**` – Dynamic routes for multi-tenant funnel pages (placeholders)

### Key Features Implemented

- **Landing page** (`[src/app/site/page.tsx](src/app/site/page.tsx)`): Gradient hero, pricing cards with Stripe price IDs, CTA links to `/agency?plan=...`
- **Navigation** (`[src/components/site/navigation/index.tsx](src/components/site/navigation/index.tsx)`): Logo, nav links, AccountButton, ModeToggle
- **Server queries** (`[src/lib/queries.ts](src/lib/queries.ts)`): `getAuthUserDetails`, `verifyAndAcceptInvitation`, `createTeamUser` (partially implemented, has syntax errors)
- **Middleware** (`[src/middleware.ts](src/middleware.ts)`): Clerk middleware for auth

### Prisma Schema (Planned Domain Model)

- **Agency** → **SubAccount** hierarchy with roles (AGENCY_OWNER, AGENCY_ADMIN, SUBACCOUNT_USER, SUBACCOUNT_GUEST)
- **Funnel** and **FunnelPage** for landing pages
- **Pipeline**, **Lane**, **Ticket** for CRM-like pipelines
- **Contact**, **Automation**, **Trigger**, **Action** for workflows
- **Media**, **Tag**, **Notification**, **Invitation**, **Subscription**, **AddOns**

### Current Gaps / Incomplete

- Agency page is a placeholder
- Domain and path pages are placeholders
- `queries.ts` has syntax errors (invalid object destructuring, typos like `ser` vs `user`, `imagUrl` vs `imageUrl`)
- Stripe integration not wired (pricing cards link to `/agency?plan=...` but no checkout flow)
- No `preview.png` asset referenced in site page (may 404)

---

## Part 2: Next.js Upgrade Plan (14.2.4 → 16.x)

### Current vs Target Versions


| Package            | Current | Target               |
| ------------------ | ------- | -------------------- |
| next               | 14.2.4  | 16.x (latest stable) |
| react              | ^18     | ^19                  |
| react-dom          | ^18     | ^19                  |
| eslint-config-next | 14.2.4  | latest               |


### Upgrade Steps

#### 1. Run the Codemod (Recommended)

```bash
npx @next/codemod@canary upgrade latest
```

This will:

- Update Next.js, React, React-DOM
- Update `next.config` for Turbopack
- Migrate `middleware` → `proxy` if applicable
- Remove deprecated config options

#### 2. Manual Changes Required

**a) next.config.mjs – `images.domains` is deprecated**

Replace `images.domains` with `images.remotePatterns`:

```js
// Before
images: {
  domains: ['uploadthing.com', 'utfs.io', 'img.clerk.com', 'subdomain', 'files.stripe.com'],
}

// After
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'uploadthing.com' },
    { protocol: 'https', hostname: 'utfs.io' },
    { protocol: 'https', hostname: 'img.clerk.com' },
    { protocol: 'https', hostname: 'subdomain' },
    { protocol: 'https', hostname: 'files.stripe.com' },
  ],
},
```

**b) Middleware → Proxy (Clerk compatibility)**

Next.js 16 deprecates `middleware` in favor of `proxy`. Clerk’s `clerkMiddleware` is designed for middleware. You may need to:

- Keep using `middleware.ts` for now (Clerk may not yet support `proxy`)
- Check [@clerk/nextjs](https://www.npmjs.com/package/@clerk/nextjs) compatibility with Next.js 16
- If Clerk requires middleware, consider using `--webpack` for build until Clerk supports proxy

**c) Async params**

`[domain]` and `[path]` pages don’t use params yet. When you add params, use the async pattern:

```tsx
export default async function Page(props: PageProps<'/[domain]/[path]'>) {
  const { domain, path } = await props.params
  // ...
}
```

**d) Update `@types/react` and `@types/react-dom` to React 19**

```bash
npm install -D @types/react@latest @types/react-dom@latest
```

#### 3. Prerequisites

- **Node.js 20.9+** (Node 18 is no longer supported)
- **TypeScript 5.1.0+** (already satisfied)

#### 4. Post-Upgrade Verification

- Run `npm run build`
- Run `npm run dev`
- Test auth flow (sign-in, sign-up)
- Test image loading from Clerk, Uploadthing, Stripe
- Confirm no breaking changes in Clerk, Prisma, Uploadthing

### Dependency Compatibility Notes

- **@clerk/nextjs** – Verify compatibility with Next.js 16 and React 19
- **Prisma** – Should work with Next.js 16
- **Uploadthing** – Should work with Next.js 16
- **shadcn/ui** – Should work with React 19

### Rollback Option

If issues arise, you can pin to Next.js 15:

```bash
npm install next@15 react@19 react-dom@19
```

---

## Summary


| Task                            | Status                  |
| ------------------------------- | ----------------------- |
| Document app accomplishments    | Complete                |
| Plan Next.js 14 → 16 upgrade    | Complete                |
| Codemod + manual config changes | Pending                 |
| Fix `queries.ts` syntax errors  | Pending (separate task) |


