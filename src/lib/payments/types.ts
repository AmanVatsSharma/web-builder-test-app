/**
 * @file types.ts
 * @module payments
 * @description Provider-neutral contracts shared across Stripe and Razorpay flows.
 * @author BharatERP
 * @created 2026-02-24
 */

import { StripeCustomerType } from '@/lib/types'

export type PaymentGatewayCode = 'STRIPE' | 'RAZORPAY'

export const DEFAULT_PAYMENT_GATEWAY: PaymentGatewayCode = 'STRIPE'

export const isPaymentGatewayCode = (
  value: string | null | undefined
): value is PaymentGatewayCode =>
  value === 'STRIPE' || value === 'RAZORPAY'

export const normalizePaymentGateway = (
  value: string | null | undefined
): PaymentGatewayCode => {
  if (!value) return DEFAULT_PAYMENT_GATEWAY
  const normalizedValue = value.toUpperCase()
  return isPaymentGatewayCode(normalizedValue)
    ? normalizedValue
    : DEFAULT_PAYMENT_GATEWAY
}

export type GatewayPrice = {
  id: string
  nickname: string
  unitAmount: number
  currency: string
  interval: 'one_time' | 'day' | 'week' | 'month' | 'year'
}

export type GatewayCharge = {
  id: string
  description: string
  amount: number
  currency: string
  status: string
  createdAtUnix: number
}

export type GatewayProduct = {
  id: string
  name: string
  image: string
  priceId: string
  unitAmount: number
  currency: string
  recurring: boolean
  interval?: string
}

export type CheckoutPriceInput = {
  recurring: boolean
  productId: string
}

export type CreateSubscriptionInput = {
  customerId: string
  priceId: string
}

export type CreateCheckoutSessionInput = {
  subAccountAccountId: string
  prices: CheckoutPriceInput[]
  subaccountId: string
}

export type StripeSubscriptionResult = {
  gateway: 'STRIPE'
  mode: 'embedded'
  subscriptionId: string
  clientSecret: string
}

export type RazorpaySubscriptionResult = {
  gateway: 'RAZORPAY'
  mode: 'popup'
  subscriptionId: string
  checkout: {
    key: string
    name: string
    description: string
    customerId: string
    subscriptionId: string
  }
}

export type CreateSubscriptionResult =
  | StripeSubscriptionResult
  | RazorpaySubscriptionResult

export type StripeCheckoutSessionResult = {
  gateway: 'STRIPE'
  mode: 'embedded'
  clientSecret: string
}

export type RazorpayCheckoutSessionResult = {
  gateway: 'RAZORPAY'
  mode: 'popup'
  checkout: {
    key: string
    name: string
    description: string
    currency: string
    amount: number
    orderId?: string
    subscriptionId?: string
  }
}

export type CreateCheckoutSessionResult =
  | StripeCheckoutSessionResult
  | RazorpayCheckoutSessionResult

export type PaymentWebhookInput = {
  body: string
  signature: string | null
}

export type PaymentWebhookResult = {
  received: boolean
  ignored?: boolean
}

export type PaymentProvider = {
  gateway: PaymentGatewayCode
  isConfigured: () => boolean
  createCustomer: (input: StripeCustomerType) => Promise<{ customerId: string }>
  createSubscription: (
    input: CreateSubscriptionInput
  ) => Promise<CreateSubscriptionResult>
  createCheckoutSession: (
    input: CreateCheckoutSessionInput
  ) => Promise<CreateCheckoutSessionResult>
  listPlatformPrices: () => Promise<GatewayPrice[]>
  listAddOns: () => Promise<GatewayPrice[]>
  listCustomerCharges: (customerId: string) => Promise<GatewayCharge[]>
  listConnectedProducts: (accountId: string) => Promise<GatewayProduct[]>
  listAccountCheckoutSessions: (
    accountId: string,
    startDateUnix: number,
    endDateUnix: number
  ) => Promise<GatewayCharge[]>
  getAccountCurrency: (accountId: string) => Promise<string>
  getConnectOAuthLink: (
    accountType: 'agency' | 'subaccount',
    state: string
  ) => string | null
  exchangeConnectCode: (code: string) => Promise<{ accountId: string }>
  handleWebhook: (input: PaymentWebhookInput) => Promise<PaymentWebhookResult>
}
