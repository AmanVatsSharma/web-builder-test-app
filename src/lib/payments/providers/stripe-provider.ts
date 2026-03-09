/**
 * @file stripe-provider.ts
 * @module payments
 * @description Stripe-backed implementation of the provider-neutral payment interface.
 * @author BharatERP
 * @created 2026-02-24
 */

import Stripe from 'stripe'
import { db } from '@/lib/db'
import { addOnProducts } from '@/lib/constants'
import { StripeCustomerType } from '@/lib/types'
import { isStripeConfigured, stripe } from '@/lib/stripe'
import { getStripeOAuthLink } from '@/lib/utils'
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
import { upsertGatewaySubscription } from '../subscription-sync'

const mapStripePrice = (price: Stripe.Price): GatewayPrice => ({
  id: price.id,
  nickname: price.nickname || price.id,
  unitAmount: price.unit_amount ?? 0,
  currency: price.currency.toUpperCase(),
  interval: price.recurring?.interval ?? 'one_time',
})

const mapStripeCharge = (charge: Stripe.Charge): GatewayCharge => ({
  id: charge.id,
  description: charge.description || charge.statement_descriptor || 'Payment',
  amount: charge.amount / 100,
  currency: charge.currency.toUpperCase(),
  status: charge.status || 'unknown',
  createdAtUnix: charge.created,
})

const mapStripeCheckoutSessionToCharge = (
  session: Stripe.Checkout.Session
): GatewayCharge => ({
  id: session.id,
  description:
    session.customer_details?.email ||
    session.customer_email ||
    session.client_reference_id ||
    'Checkout session',
  amount: (session.amount_total ?? 0) / 100,
  currency: session.currency?.toUpperCase() || 'USD',
  status: session.status || 'open',
  createdAtUnix: session.created,
})

const mapStripeProduct = (product: Stripe.Product): GatewayProduct | null => {
  const defaultPrice = product.default_price
  if (!defaultPrice || typeof defaultPrice === 'string') return null

  return {
    id: product.id,
    name: product.name,
    image: product.images[0] || '/stripelogo.png',
    priceId: defaultPrice.id,
    unitAmount: (defaultPrice.unit_amount ?? 0) / 100,
    currency: defaultPrice.currency.toUpperCase(),
    recurring: Boolean(defaultPrice.recurring),
    interval: defaultPrice.recurring?.interval,
  }
}

const stripeWebhookEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])

const getStripeWebhookSecret = () =>
  process.env.STRIPE_WEBHOOK_SECRET_LIVE ?? process.env.STRIPE_WEBHOOK_SECRET

const createCustomer = async (
  input: StripeCustomerType
): Promise<{ customerId: string }> => {
  const customer = await stripe.customers.create({
    email: input.email,
    name: input.name,
    address: input.address,
    shipping: input.shipping,
  })
  return { customerId: customer.id }
}

const createSubscription = async ({
  customerId,
  priceId,
}: CreateSubscriptionInput): Promise<CreateSubscriptionResult> => {
  const subscriptionExists = await db.agency.findFirst({
    where: {
      OR: [{ customerId }, { billingCustomerId: customerId }],
    },
    include: { Subscription: true },
  })

  const existingSubscriptionId =
    subscriptionExists?.Subscription?.subscritiptionId ||
    ((subscriptionExists?.Subscription as any)?.gatewaySubscriptionId as
      | string
      | undefined)

  if (existingSubscriptionId && subscriptionExists?.Subscription?.active) {
    const currentSubscriptionDetails = await stripe.subscriptions.retrieve(
      existingSubscriptionId
    )

    const currentItemId = currentSubscriptionDetails.items.data[0]?.id
    const subscription = await stripe.subscriptions.update(existingSubscriptionId, {
      items: [
        ...(currentItemId
          ? [
              {
                id: currentItemId,
                deleted: true,
              } as Stripe.SubscriptionUpdateParams.Item
            ]
          : []),
        { price: priceId },
      ],
      expand: ['latest_invoice.payment_intent'],
    })

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null
    const paymentIntent = (latestInvoice as any)?.payment_intent as
      | Stripe.PaymentIntent
      | null

    if (!paymentIntent?.client_secret) {
      throw new Error('Could not create payment intent for subscription update')
    }

    return {
      gateway: 'STRIPE',
      mode: 'embedded',
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    }
  }

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })

  const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null
  const paymentIntent = (latestInvoice as any)?.payment_intent as
    | Stripe.PaymentIntent
    | null
  if (!paymentIntent?.client_secret) {
    throw new Error('Could not create payment intent for subscription creation')
  }

  return {
    gateway: 'STRIPE',
    mode: 'embedded',
    subscriptionId: subscription.id,
    clientSecret: paymentIntent.client_secret,
  }
}

const createCheckoutSession = async ({
  subAccountAccountId,
  prices,
}: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult> => {
  const hasRecurringPrice = prices.some((price) => price.recurring)

  const session = await stripe.checkout.sessions.create(
    {
      line_items: prices.map((price) => ({
        price: price.productId,
        quantity: 1,
      })),
      ...(hasRecurringPrice && {
        subscription_data: {
          metadata: { connectAccountSubscriptions: 'true' },
          application_fee_percent:
            +(process.env.NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_PERCENT || '0'),
        },
      }),
      ...(!hasRecurringPrice && {
        payment_intent_data: {
          metadata: { connectAccountPayments: 'true' },
          application_fee_amount:
            +(process.env.NEXT_PUBLIC_PLATFORM_ONETIME_FEE || '0') * 100,
        },
      }),
      mode: hasRecurringPrice ? 'subscription' : 'payment',
      ui_mode: 'embedded',
      redirect_on_completion: 'never',
    },
    { stripeAccount: subAccountAccountId }
  )

  if (!session.client_secret) {
    throw new Error('Stripe checkout did not return a client secret')
  }

  return {
    gateway: 'STRIPE',
    mode: 'embedded',
    clientSecret: session.client_secret,
  }
}

const listPlatformPrices = async (): Promise<GatewayPrice[]> => {
  if (!process.env.NEXT_PLURA_PRODUCT_ID) return []
  const prices = await stripe.prices.list({
    product: process.env.NEXT_PLURA_PRODUCT_ID,
    active: true,
  })
  return prices.data.map(mapStripePrice)
}

const listAddOns = async (): Promise<GatewayPrice[]> => {
  const addOns = await stripe.products.list({
    ids: addOnProducts.map((product) => product.id),
    expand: ['data.default_price'],
  })

  return addOns.data
    .map((product) => {
      const defaultPrice = product.default_price
      if (!defaultPrice || typeof defaultPrice === 'string') return null
      return mapStripePrice(defaultPrice)
    })
    .filter((price): price is GatewayPrice => price !== null)
}

const listCustomerCharges = async (
  customerId: string
): Promise<GatewayCharge[]> => {
  if (!customerId) return []
  const charges = await stripe.charges.list({
    limit: 50,
    customer: customerId,
  })
  return charges.data.map(mapStripeCharge)
}

const listConnectedProducts = async (
  accountId: string
): Promise<GatewayProduct[]> => {
  if (!accountId) return []
  const products = await stripe.products.list(
    {
      limit: 100,
      expand: ['data.default_price'],
    },
    {
      stripeAccount: accountId,
    }
  )

  return products.data
    .map(mapStripeProduct)
    .filter((product): product is GatewayProduct => product !== null)
}

const listAccountCheckoutSessions = async (
  accountId: string,
  startDateUnix: number,
  endDateUnix: number
): Promise<GatewayCharge[]> => {
  if (!accountId) return []
  const sessions = await stripe.checkout.sessions.list(
    {
      created: { gte: startDateUnix, lte: endDateUnix },
      limit: 100,
    },
    { stripeAccount: accountId }
  )

  return sessions.data.map(mapStripeCheckoutSessionToCharge)
}

const getAccountCurrency = async (accountId: string): Promise<string> => {
  if (!accountId) return 'USD'
  const account = await stripe.accounts.retrieve({
    stripeAccount: accountId,
  })
  return account.default_currency?.toUpperCase() || 'USD'
}

const getConnectOAuthLink = (
  accountType: 'agency' | 'subaccount',
  state: string
) => getStripeOAuthLink(accountType, state)

const exchangeConnectCode = async (code: string): Promise<{ accountId: string }> => {
  const response = await stripe.oauth.token({
    grant_type: 'authorization_code',
    code,
  })
  if (!response.stripe_user_id) {
    throw new Error('Stripe did not return a connect account id')
  }
  return { accountId: response.stripe_user_id }
}

const handleWebhook = async ({
  body,
  signature,
}: PaymentWebhookInput): Promise<PaymentWebhookResult> => {
  const webhookSecret = getStripeWebhookSecret()
  if (!signature || !webhookSecret) {
    throw new Error('Stripe webhook secret or signature is missing')
  }

  const stripeEvent = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  if (!stripeWebhookEvents.has(stripeEvent.type)) {
    return { received: true, ignored: true }
  }

  switch (stripeEvent.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      const subscriptionData = subscription as any
      if (
        subscriptionData.metadata?.connectAccountPayments ||
        subscriptionData.metadata?.connectAccountSubscriptions
      ) {
        return { received: true, ignored: true }
      }

      const subscriptionPlan =
        subscriptionData.plan?.id || subscription.items.data[0]?.price?.id
      await upsertGatewaySubscription({
        gateway: 'STRIPE',
        customerId: subscription.customer as string,
        subscriptionId: subscription.id,
        priceId: subscriptionPlan || subscription.items.data[0]?.price?.id || '',
        currentPeriodEndDate: new Date(
          (subscriptionData.current_period_end || Math.floor(Date.now() / 1000)) *
            1000
        ),
        active: subscription.status === 'active',
        planId: subscriptionPlan,
      })
      return { received: true }
    }

    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      await db.subscription.updateMany({
        where: {
          OR: [{ subscritiptionId: subscription.id }, { gatewaySubscriptionId: subscription.id }],
        },
        data: {
          active: false,
        },
      })
      return { received: true }
    }

    default:
      return { received: true, ignored: true }
  }
}

export const stripePaymentProvider: PaymentProvider = {
  gateway: 'STRIPE',
  isConfigured: () => isStripeConfigured,
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
