# Multi-Gateway Rollout And Test Matrix

## Phase Rollout

1. **Phase 1 (Completed)**: Provider abstraction and Stripe parity under `src/lib/payments`.
2. **Phase 2 (Completed)**: Razorpay provider for customer, subscription, checkout, webhook flows.
3. **Phase 3 (Completed)**: Manual gateway selection in agency and subaccount settings.
4. **Phase 4 (In Progress in production rollout)**: Gradual tenant enablement per agency/subaccount with Stripe route wrappers retained for compatibility.

## Compatibility Paths

- New API surface:
  - `POST /api/payments/create-customer`
  - `POST /api/payments/create-subscription`
  - `POST /api/payments/create-checkout-session`
  - `POST /api/payments/webhook/[gateway]`
- Backward-compatible wrappers retained:
  - `POST /api/stripe/create-customer`
  - `POST /api/stripe/create-subscription`
  - `POST /api/stripe/create-checkout-session`
  - `POST /api/stripe/webhook`

## Regression Checklist

- [ ] Agency creation works for both billing gateways.
- [ ] Agency billing page loads plans and charge history for selected gateway.
- [ ] Agency subscription checkout works for Stripe and Razorpay.
- [ ] Subaccount settings persist gateway and account-id fields.
- [ ] Funnel settings load provider-backed product catalog.
- [ ] Funnel checkout renders Stripe embedded checkout for Stripe gateway.
- [ ] Funnel checkout opens Razorpay popup checkout for Razorpay gateway.
- [ ] Launchpad account-connection flow works for Stripe OAuth and non-OAuth fallback providers.
- [ ] Agency dashboard metrics remain functional with selected payout gateway.
- [ ] Subaccount dashboard metrics remain functional with selected payment gateway.
- [ ] Legacy `/api/stripe/*` routes still return successful responses for Stripe tenants.
- [ ] Webhooks update subscription state in `Subscription` for Stripe and Razorpay.

## Smoke Validation Run

- Type validation completed with `npx tsc --noEmit`.
