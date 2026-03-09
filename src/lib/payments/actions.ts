/**
 * @file actions.ts
 * @module payments
 * @description Gateway-aware payment operations consumed by API routes and pages.
 * @author BharatERP
 * @created 2026-02-24
 */

import { db } from '@/lib/db'
import { StripeCustomerType } from '@/lib/types'
import { getPaymentProvider } from './provider-factory'
import {
  normalizePaymentGateway,
  PaymentGatewayCode,
  CreateCheckoutSessionInput,
  CreateSubscriptionInput,
} from './types'
import {
  getAgencyBillingContext,
  getSubAccountPaymentContext,
  resolveAgencyBillingGateway,
  resolveSubAccountPaymentGateway,
} from './service'

const resolveGatewayForCustomer = async (
  customerId: string,
  fallbackGateway?: string | null
): Promise<PaymentGatewayCode> => {
  if (fallbackGateway) {
    return normalizePaymentGateway(fallbackGateway)
  }

  const agency = (await db.agency.findFirst({
    where: {
      OR: [{ customerId }, { billingCustomerId: customerId }],
    },
  })) as any

  return resolveAgencyBillingGateway(agency)
}

const resolveGatewayForSubaccount = async (
  subaccountId: string,
  fallbackGateway?: string | null
): Promise<PaymentGatewayCode> => {
  if (fallbackGateway) {
    return normalizePaymentGateway(fallbackGateway)
  }

  const subaccount = (await db.subAccount.findUnique({
    where: {
      id: subaccountId,
    },
  })) as any
  return resolveSubAccountPaymentGateway(subaccount)
}

export const createGatewayCustomer = async (
  input: StripeCustomerType,
  gateway?: string | null
) => {
  const provider = getPaymentProvider(gateway)
  return provider.createCustomer(input)
}

export const createGatewaySubscription = async (
  input: CreateSubscriptionInput,
  gateway?: string | null
) => {
  const resolvedGateway = await resolveGatewayForCustomer(input.customerId, gateway)
  const provider = getPaymentProvider(resolvedGateway)
  return provider.createSubscription(input)
}

export const createGatewayCheckoutSession = async (
  input: CreateCheckoutSessionInput,
  gateway?: string | null
) => {
  const resolvedGateway = await resolveGatewayForSubaccount(
    input.subaccountId,
    gateway
  )
  const provider = getPaymentProvider(resolvedGateway)
  return provider.createCheckoutSession(input)
}

export const getAgencyBillingSnapshot = async (agencyId: string) => {
  const context = await getAgencyBillingContext(agencyId)
  const provider = getPaymentProvider(context.gateway)
  if (!provider.isConfigured()) {
    return {
      gateway: context.gateway,
      customerId: context.customerId,
      plans: [],
      addOns: [],
      charges: [],
    }
  }

  let plans = [] as Awaited<ReturnType<typeof provider.listPlatformPrices>>
  let addOns = [] as Awaited<ReturnType<typeof provider.listAddOns>>
  let charges = [] as Awaited<ReturnType<typeof provider.listCustomerCharges>>
  try {
    ;[plans, addOns, charges] = await Promise.all([
      provider.listPlatformPrices(),
      provider.listAddOns(),
      context.customerId ? provider.listCustomerCharges(context.customerId) : [],
    ])
  } catch (error) {
    console.log('🔴 Error loading billing snapshot', error)
  }

  return {
    gateway: context.gateway,
    customerId: context.customerId,
    plans,
    addOns,
    charges,
  }
}

export const getSubaccountProductCatalog = async (subaccountId: string) => {
  const context = await getSubAccountPaymentContext(subaccountId)
  const provider = getPaymentProvider(context.gateway)
  if (!provider.isConfigured()) {
    return {
      gateway: context.gateway,
      accountId: context.accountId,
      products: [],
    }
  }

  let products = [] as Awaited<ReturnType<typeof provider.listConnectedProducts>>
  try {
    products = await provider.listConnectedProducts(context.accountId)
  } catch (error) {
    console.log('🔴 Error loading product catalog', error)
  }

  return {
    gateway: context.gateway,
    accountId: context.accountId,
    products,
  }
}
