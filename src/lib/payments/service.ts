/**
 * @file service.ts
 * @module payments
 * @description Gateway resolution and payment-context helpers for agency/subaccount flows.
 * @author BharatERP
 * @created 2026-02-24
 */

import { db } from '@/lib/db'
import { getPaymentProvider } from './provider-factory'
import { normalizePaymentGateway, PaymentGatewayCode } from './types'

type AgencyPaymentShape = {
  customerId?: string | null
  connectAccountId?: string | null
  billingGateway?: string | null
  billingCustomerId?: string | null
  payoutGateway?: string | null
  payoutAccountId?: string | null
}

type SubAccountPaymentShape = {
  connectAccountId?: string | null
  paymentGateway?: string | null
  paymentAccountId?: string | null
}

export const getGatewayDisplayName = (gateway: PaymentGatewayCode) =>
  gateway === 'RAZORPAY' ? 'Razorpay' : 'Stripe'

export const resolveAgencyBillingGateway = (
  agency: AgencyPaymentShape | null | undefined
): PaymentGatewayCode =>
  normalizePaymentGateway(agency?.billingGateway || agency?.payoutGateway || null)

export const resolveAgencyPayoutGateway = (
  agency: AgencyPaymentShape | null | undefined
): PaymentGatewayCode =>
  normalizePaymentGateway(agency?.payoutGateway || agency?.billingGateway || null)

export const resolveAgencyBillingCustomerId = (
  agency: AgencyPaymentShape | null | undefined
): string => agency?.billingCustomerId || agency?.customerId || ''

export const resolveAgencyPayoutAccountId = (
  agency: AgencyPaymentShape | null | undefined
): string => agency?.payoutAccountId || agency?.connectAccountId || ''

export const resolveSubAccountPaymentGateway = (
  subaccount: SubAccountPaymentShape | null | undefined
): PaymentGatewayCode => normalizePaymentGateway(subaccount?.paymentGateway || null)

export const resolveSubAccountPaymentAccountId = (
  subaccount: SubAccountPaymentShape | null | undefined
): string => subaccount?.paymentAccountId || subaccount?.connectAccountId || ''

export const getAgencyBillingContext = async (agencyId: string) => {
  const agency = (await db.agency.findUnique({
    where: { id: agencyId },
  })) as AgencyPaymentShape | null

  return {
    gateway: resolveAgencyBillingGateway(agency),
    customerId: resolveAgencyBillingCustomerId(agency),
  }
}

export const getAgencyPayoutContext = async (agencyId: string) => {
  const agency = (await db.agency.findUnique({
    where: { id: agencyId },
  })) as AgencyPaymentShape | null

  return {
    gateway: resolveAgencyPayoutGateway(agency),
    accountId: resolveAgencyPayoutAccountId(agency),
  }
}

export const getSubAccountPaymentContext = async (subaccountId: string) => {
  const subaccount = (await db.subAccount.findUnique({
    where: { id: subaccountId },
  })) as SubAccountPaymentShape | null

  return {
    gateway: resolveSubAccountPaymentGateway(subaccount),
    accountId: resolveSubAccountPaymentAccountId(subaccount),
  }
}

export const getAgencyBillingProvider = async (agencyId: string) => {
  const context = await getAgencyBillingContext(agencyId)
  return {
    ...context,
    provider: getPaymentProvider(context.gateway),
  }
}

export const getAgencyPayoutProvider = async (agencyId: string) => {
  const context = await getAgencyPayoutContext(agencyId)
  return {
    ...context,
    provider: getPaymentProvider(context.gateway),
  }
}

export const getSubAccountPaymentProvider = async (subaccountId: string) => {
  const context = await getSubAccountPaymentContext(subaccountId)
  return {
    ...context,
    provider: getPaymentProvider(context.gateway),
  }
}

export const upsertAgencyConnectAccount = async (
  agencyId: string,
  accountId: string,
  gateway: PaymentGatewayCode
) => {
  return db.agency.update({
    where: { id: agencyId },
    data: {
      connectAccountId: accountId,
      payoutAccountId: accountId,
      payoutGateway: gateway,
    },
  })
}

export const upsertSubAccountConnectAccount = async (
  subaccountId: string,
  accountId: string,
  gateway: PaymentGatewayCode
) => {
  return db.subAccount.update({
    where: { id: subaccountId },
    data: {
      connectAccountId: accountId,
      paymentAccountId: accountId,
      paymentGateway: gateway,
    },
  })
}
