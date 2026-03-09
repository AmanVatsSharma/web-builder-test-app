/**
 * @file razorpay-provider.ts
 * @module payments
 * @description Razorpay-backed implementation of the provider-neutral payment interface.
 * @author BharatERP
 * @created 2026-02-24
 */

import crypto from 'crypto'
import { db } from '@/lib/db'
import { pricingCards } from '@/lib/constants'
import { StripeCustomerType } from '@/lib/types'
import {
  getRazorpayClient,
  isRazorpayConfigured,
  isRazorpayPublicKeyConfigured,
} from '../razorpay-client'
import { upsertGatewaySubscription } from '../subscription-sync'
import {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  CreateSubscriptionInput,
  CreateSubscriptionResult,
  GatewayCharge,
  GatewayPrice,
  GatewayProduct,
  PaymentProvider,
  PaymentWebhookInput,
  PaymentWebhookResult,
} from '../types'

const DEFAULT_RAZORPAY_CURRENCY = 'INR'

const getRazorpayPublicKey = (): string => {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID
  if (!key) {
    throw new Error('Razorpay key is not configured')
  }
  return key
}

const getRazorpayWebhookSecret = (): string => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured')
  }
  return secret
}

const parsePlanMapping = (): Record<string, string> => {
  const raw = process.env.RAZORPAY_PLATFORM_PLAN_MAP
  if (!raw) return {}
  try {
    const parsedValue = JSON.parse(raw)
    if (typeof parsedValue === 'object' && parsedValue) {
      return parsedValue as Record<string, string>
    }
    return {}
  } catch {
    return {}
  }
}

const resolveRazorpayPlanId = (priceId: string): string => {
  const map = parsePlanMapping()
  return map[priceId] || priceId
}

const parseCardAmountToSubunits = (priceLabel: string): number => {
  const numericAmount = Number(priceLabel.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 0
  return Math.round(numericAmount * 100)
}

const mapPaymentToCharge = (payment: any): GatewayCharge => ({
  id: payment.id,
  description:
    payment.description || payment.email || payment.notes?.subaccountId || 'Payment',
  amount: (payment.amount || 0) / 100,
  currency: (payment.currency || DEFAULT_RAZORPAY_CURRENCY).toUpperCase(),
  status: payment.status || 'created',
  createdAtUnix: payment.created_at || Math.floor(Date.now() / 1000),
})

const createCustomer = async (
  input: StripeCustomerType
): Promise<{ customerId: string }> => {
  const razorpay = getRazorpayClient()
  const customer = await razorpay.customers.create({
    name: input.name,
    email: input.email,
    fail_existing: 0,
    notes: {
      city: input.address.city,
      state: input.address.state,
      country: input.address.country,
      line1: input.address.line1,
    },
  })
  return { customerId: customer.id }
}

const createSubscription = async ({
  customerId,
  priceId,
}: CreateSubscriptionInput): Promise<CreateSubscriptionResult> => {
  const razorpay = getRazorpayClient()
  const planId = resolveRazorpayPlanId(priceId)
  const totalCount = Number(process.env.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT || '12')
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: Number.isFinite(totalCount) && totalCount > 0 ? totalCount : 12,
    notes: {
      customerId,
      sourcePriceId: priceId,
    },
  })

  return {
    gateway: 'RAZORPAY',
    mode: 'popup',
    subscriptionId: subscription.id,
    checkout: {
      key: getRazorpayPublicKey(),
      name: 'Plura',
      description: 'Platform subscription',
      customerId,
      subscriptionId: subscription.id,
    },
  }
}

const createCheckoutSession = async ({
  subAccountAccountId,
  prices,
  subaccountId,
}: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult> => {
  const razorpay = getRazorpayClient()
  const recurringPrice = prices.find((price) => price.recurring)

  if (recurringPrice) {
    const planId = resolveRazorpayPlanId(recurringPrice.productId)
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: Number(process.env.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT || '12'),
      notes: {
        subaccountId,
        accountId: subAccountAccountId,
        sourcePriceId: recurringPrice.productId,
      },
    })

    return {
      gateway: 'RAZORPAY',
      mode: 'popup',
      checkout: {
        key: getRazorpayPublicKey(),
        name: 'Plura',
        description: 'Funnel recurring checkout',
        currency: DEFAULT_RAZORPAY_CURRENCY,
        amount: 0,
        subscriptionId: subscription.id,
      },
    }
  }

  let amountSubunits = 0
  for (const price of prices) {
    const item = await razorpay.items.fetch(price.productId)
    amountSubunits += Number(item.amount || 0)
  }

  if (!amountSubunits) {
    throw new Error('Could not resolve checkout amount from selected products')
  }

  const order = await razorpay.orders.create({
    amount: amountSubunits,
    currency: DEFAULT_RAZORPAY_CURRENCY,
    receipt: `subaccount-${subaccountId}-${Date.now()}`,
    notes: {
      subaccountId,
      accountId: subAccountAccountId,
    },
  })

  return {
    gateway: 'RAZORPAY',
    mode: 'popup',
    checkout: {
      key: getRazorpayPublicKey(),
      name: 'Plura',
      description: 'Funnel checkout',
      currency: order.currency || DEFAULT_RAZORPAY_CURRENCY,
      amount: Number(order.amount || amountSubunits),
      orderId: order.id,
    },
  }
}

const listPlatformPrices = async (): Promise<GatewayPrice[]> => {
  const razorpay = getRazorpayClient()

  const plans = await Promise.all(
    pricingCards
      .filter((card) => card.priceId)
      .map(async (card) => {
        const mappedPlanId = resolveRazorpayPlanId(card.priceId)
        try {
          const plan = await razorpay.plans.fetch(mappedPlanId)
          return {
            id: card.priceId,
            nickname: card.title,
            unitAmount: Number(
              plan.item?.amount || parseCardAmountToSubunits(card.price)
            ),
            currency: (plan.item?.currency || DEFAULT_RAZORPAY_CURRENCY).toUpperCase(),
            interval: (plan.period || 'month') as GatewayPrice['interval'],
          } satisfies GatewayPrice
        } catch {
          return {
            id: card.priceId,
            nickname: card.title,
            unitAmount: parseCardAmountToSubunits(card.price),
            currency: DEFAULT_RAZORPAY_CURRENCY,
            interval: 'month',
          } satisfies GatewayPrice
        }
      })
  )

  return plans
}

const listAddOns = async (): Promise<GatewayPrice[]> => {
  return []
}

const listCustomerCharges = async (
  customerId: string
): Promise<GatewayCharge[]> => {
  if (!customerId) return []
  const razorpay = getRazorpayClient()
  const paymentResponse = (await razorpay.payments.all({
    count: 100,
  })) as any
  const payments = paymentResponse.items || []
  return payments
    .filter(
      (payment: any) =>
        payment.customer_id === customerId ||
        payment.notes?.customerId === customerId
    )
    .map(mapPaymentToCharge)
}

const listConnectedProducts = async (_accountId: string): Promise<GatewayProduct[]> => {
  const razorpay = getRazorpayClient()
  const [itemsResponse, plansResponse] = await Promise.all([
    razorpay.items.all({ count: 100 }) as any,
    razorpay.plans.all({ count: 100 }) as any,
  ])

  const oneTimeProducts = (itemsResponse.items || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    image: '/stripelogo.png',
    priceId: item.id,
    unitAmount: (item.amount || 0) / 100,
    currency: (item.currency || DEFAULT_RAZORPAY_CURRENCY).toUpperCase(),
    recurring: false,
  }))

  const recurringProducts = (plansResponse.items || []).map((plan: any) => ({
    id: plan.id,
    name: plan.item?.name || plan.id,
    image: '/stripelogo.png',
    priceId: plan.id,
    unitAmount: (plan.item?.amount || 0) / 100,
    currency: (plan.item?.currency || DEFAULT_RAZORPAY_CURRENCY).toUpperCase(),
    recurring: true,
    interval: plan.period,
  }))

  return [...oneTimeProducts, ...recurringProducts]
}

const listAccountCheckoutSessions = async (
  accountId: string,
  startDateUnix: number,
  endDateUnix: number
): Promise<GatewayCharge[]> => {
  const razorpay = getRazorpayClient()
  const paymentResponse = (await razorpay.payments.all({
    count: 100,
  })) as any
  const payments = paymentResponse.items || []

  return payments
    .filter((payment: any) => {
      if (accountId && payment.notes?.accountId !== accountId) return false
      const created = payment.created_at || 0
      return created >= startDateUnix && created <= endDateUnix
    })
    .map(mapPaymentToCharge)
}

const getAccountCurrency = async (_accountId: string): Promise<string> => {
  return DEFAULT_RAZORPAY_CURRENCY
}

const getConnectOAuthLink = (): string | null => {
  return null
}

const exchangeConnectCode = async (_code: string): Promise<{ accountId: string }> => {
  throw new Error('Razorpay does not support OAuth connect in this integration')
}

const handleWebhook = async ({
  body,
  signature,
}: PaymentWebhookInput): Promise<PaymentWebhookResult> => {
  if (!signature) {
    throw new Error('Razorpay webhook signature is missing')
  }
  const expectedSignature = crypto
    .createHmac('sha256', getRazorpayWebhookSecret())
    .update(body)
    .digest('hex')

  if (expectedSignature !== signature) {
    throw new Error('Razorpay webhook signature verification failed')
  }

  const payload = JSON.parse(body) as any
  const eventName = payload.event as string
  const subscriptionEntity = payload.payload?.subscription?.entity

  if (!subscriptionEntity) {
    return { received: true, ignored: true }
  }

  const customerId =
    subscriptionEntity.notes?.customerId || subscriptionEntity.customer_id
  if (!customerId) {
    return { received: true, ignored: true }
  }

  const isActiveEvent =
    eventName === 'subscription.activated' || eventName === 'subscription.charged'
  const isInactiveEvent =
    eventName === 'subscription.halted' ||
    eventName === 'subscription.completed' ||
    eventName === 'subscription.cancelled'

  if (!isActiveEvent && !isInactiveEvent) {
    return { received: true, ignored: true }
  }

  await upsertGatewaySubscription({
    gateway: 'RAZORPAY',
    customerId,
    subscriptionId: subscriptionEntity.id,
    priceId:
      subscriptionEntity.notes?.sourcePriceId || subscriptionEntity.plan_id || '',
    currentPeriodEndDate: new Date(
      (subscriptionEntity.current_end || subscriptionEntity.charge_at) * 1000
    ),
    active: isActiveEvent,
    planId: null,
  })

  return { received: true }
}

export const razorpayPaymentProvider: PaymentProvider = {
  gateway: 'RAZORPAY',
  isConfigured: () => isRazorpayConfigured && isRazorpayPublicKeyConfigured,
  createCustomer,
  createSubscription,
  createCheckoutSession,
  listPlatformPrices,
  listAddOns,
  listCustomerCharges,
  listConnectedProducts,
  listAccountCheckoutSessions,
  getAccountCurrency,
  getConnectOAuthLink,
  exchangeConnectCode,
  handleWebhook,
}
