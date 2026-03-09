/**
 * @file provider-factory.ts
 * @module payments
 * @description Resolves payment provider implementations from gateway values.
 * @author BharatERP
 * @created 2026-02-24
 */

import {
  normalizePaymentGateway,
  PaymentGatewayCode,
  PaymentProvider,
} from './types'
import { stripePaymentProvider } from './providers/stripe-provider'
import { razorpayPaymentProvider } from './providers/razorpay-provider'

const providers: Record<PaymentGatewayCode, PaymentProvider> = {
  STRIPE: stripePaymentProvider,
  RAZORPAY: razorpayPaymentProvider,
}

export const getPaymentProvider = (
  gateway: string | null | undefined
): PaymentProvider => {
  const normalizedGateway = normalizePaymentGateway(gateway)
  return providers[normalizedGateway]
}
