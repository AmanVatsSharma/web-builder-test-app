# Changelog

## 2026-02-24

### Multi-Gateway Payments (Stripe + Razorpay)

- Added provider-neutral payments layer in `src/lib/payments` with gateway factory, Stripe adapter parity, and Razorpay adapter support.
- Introduced provider-agnostic API routes under `src/app/api/payments` and kept backward-compatible Stripe wrappers in `src/app/api/stripe`.
- Added `PaymentGateway` schema fields and migration backfill to preserve existing Stripe customer/account/subscription data.
- Enabled manual gateway selection in agency/subaccount settings and wired billing + funnel checkout UIs to selected gateways.
- Generalized launchpad connection flow to support provider-specific onboarding behavior and non-OAuth fallbacks.
- Verified integration baseline with `npx tsc --noEmit` after refactor.

### Premium Funnel Builder UI Polish

- Refreshed funnel editor shell with premium surface styling, clearer hierarchy, and improved responsive framing.
- Reworked sidebar rail, component palette cards, and settings panel spacing for cleaner builder ergonomics.
- Unified canvas element selection chrome, badges, and action affordances across core editable element types.
- Polished rendered contact and checkout blocks, plus the reusable contact form card and controls.
- Added builder-focused visual tokens/utilities in global styles and Tailwind theme extensions.
- Added an Agency sidebar shortcut that opens Funnels directly for the first accessible subaccount.
- Fixed Agency Owner/Admin subaccount access gating so sidebar switching and subaccount routes do not depend on per-subaccount permission rows.
- Fixed persistent sidebar click-lock by allowing `SheetContent` to disable overlay for always-open desktop/editor sidebars.
- Raised desktop sidebar z-index above dashboard blur layers so left navigation links remain clickable.
- Removed duplicate mobile menu triggers by rendering the Sheet trigger only for the mobile sidebar instance.
