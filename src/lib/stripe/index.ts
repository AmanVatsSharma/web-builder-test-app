import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
export const isStripeConfigured = Boolean(stripeSecretKey)

let stripeClient: Stripe | null = null

const getStripeClient = (): Stripe => {
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      appInfo: {
        name: 'Plura App',
        version: '0.1.0',
      },
    })
  }

  return stripeClient
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripeClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})


