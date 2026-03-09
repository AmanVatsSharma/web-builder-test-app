/**
 * @file subscription-sync.ts
 * @module payments
 * @description Shared subscription upsert logic used by all payment webhooks.
 * @author BharatERP
 * @created 2026-02-24
 */

import { Plan } from '@prisma/client'
import { db } from '@/lib/db'
import { PaymentGatewayCode } from './types'

type SubscriptionSyncInput = {
  gateway: PaymentGatewayCode
  customerId: string
  subscriptionId: string
  priceId: string
  currentPeriodEndDate: Date
  active: boolean
  planId?: string | null
}

const getKnownPlanOrNull = (planId?: string | null): Plan | null => {
  if (!planId) return null
  const knownPlans = new Set<Plan>(Object.values(Plan))
  return knownPlans.has(planId as Plan) ? (planId as Plan) : null
}

export const upsertGatewaySubscription = async ({
  gateway,
  customerId,
  subscriptionId,
  priceId,
  currentPeriodEndDate,
  active,
  planId,
}: SubscriptionSyncInput) => {
  const agency = await db.agency.findFirst({
    where: {
      OR: [{ customerId }, { billingCustomerId: customerId }],
    },
    include: { SubAccount: true },
  })

  if (!agency) {
    throw new Error('Could not find an agency for subscription sync.')
  }

  const plan = getKnownPlanOrNull(planId)
  const payload = {
    active,
    agencyId: agency.id,
    customerId,
    currentPeriodEndDate,
    priceId,
    subscritiptionId: subscriptionId,
    plan,
    paymentGateway: gateway,
    gatewaySubscriptionId: subscriptionId,
  }

  return db.subscription.upsert({
    where: { agencyId: agency.id },
    create: payload,
    update: payload,
  })
}
