'use server'
import Stripe from 'stripe'
import { isStripeConfigured, stripe } from '.'
import { upsertGatewaySubscription } from '../payments/subscription-sync'

export const subscriptionCreated = async (
  subscription: Stripe.Subscription,
  customerId: string
) => {
  try {
    const planId =
      // @ts-expect-error Stripe types mark `plan` as nullable for compatibility
      subscription.plan?.id || subscription.items.data[0]?.price?.id || ''
    await upsertGatewaySubscription({
      gateway: 'STRIPE',
      customerId,
      subscriptionId: subscription.id,
      priceId: planId,
      currentPeriodEndDate: new Date(
        ((subscription as any).current_period_end || Math.floor(Date.now() / 1000)) *
          1000
      ),
      active: subscription.status === 'active',
      planId,
    })
    console.log(`🟢 Created Subscription for ${subscription.id}`)
  } catch (error) {
    console.log('🔴 Error from Create action', error)
  }
}

export const getConnectAccountProducts = async (stripeAccount: string) => {
  if (!isStripeConfigured || !stripeAccount) {
    return []
  }

  try {
    const products = await stripe.products.list(
      {
        limit: 50,
        expand: ['data.default_price'],
      },
      {
        stripeAccount,
      }
    )
    return products.data
  } catch (error) {
    console.log('🔴 Error loading connected account products', error)
    return []
  }
}
