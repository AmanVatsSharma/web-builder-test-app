import React from 'react'
import { addOnProducts, pricingCards } from '@/lib/constants'
import { db } from '@/lib/db'
import { Separator } from '@/components/ui/separator'
import PricingCard from './_components/pricing-card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import clsx from 'clsx'
import SubscriptionHelper from './_components/subscription-helper'
import { getAgencyBillingSnapshot } from '@/lib/payments/actions'
import { getGatewayDisplayName } from '@/lib/payments'

type Props = {
  params: Promise<{ agencyId: string }>
}

const page = async ({ params }: Props) => {
  const { agencyId } = await params
  const agencySubscription = await db.agency.findUnique({
    where: {
      id: agencyId,
    },
    select: {
      customerId: true,
      billingCustomerId: true,
      billingGateway: true,
      Subscription: true,
    },
  })
  const billingSnapshot = await getAgencyBillingSnapshot(agencyId)
  const gatewayName = getGatewayDisplayName(billingSnapshot.gateway)
  const customerId =
    billingSnapshot.customerId ||
    agencySubscription?.billingCustomerId ||
    agencySubscription?.customerId ||
    ''
  const prices = billingSnapshot.plans.map((price) => ({
    id: price.id,
    nickname: price.nickname,
    unit_amount: price.unitAmount,
    currency: price.currency.toLowerCase(),
    recurring:
      price.interval === 'one_time'
        ? null
        : {
            interval: price.interval,
          },
  }))
  const addOns = billingSnapshot.addOns.map((price) => ({
    id: price.id,
    name: addOnProducts.find((product) => product.id === price.id)?.title || price.nickname,
    default_price: {
      id: price.id,
      unit_amount: price.unitAmount,
      recurring:
        price.interval === 'one_time'
          ? null
          : {
              interval: price.interval,
            },
    },
  }))

  const currentPlanDetails = pricingCards.find(
    (c) => c.priceId === agencySubscription?.Subscription?.priceId
  )

  const allCharges = [
    ...billingSnapshot.charges.map((charge) => ({
      description: charge.description,
      id: charge.id,
      date: `${new Date(charge.createdAtUnix * 1000).toLocaleTimeString()} ${new Date(
        charge.createdAtUnix * 1000
      ).toLocaleDateString()}`,
      status: charge.status,
      amount: `${charge.currency} ${charge.amount.toFixed(2)}`,
    })),
  ]

  return (
    <>
      <SubscriptionHelper
        prices={prices}
        customerId={customerId}
        gateway={billingSnapshot.gateway}
        planExists={agencySubscription?.Subscription?.active === true}
      />
      <h1 className="text-4xl p-4">Billing</h1>
      <p className="px-4 text-sm text-muted-foreground">
        Active billing gateway: {gatewayName}
      </p>
      <Separator className=" mb-6" />
      <h2 className="text-2xl p-4">Current Plan</h2>
      <div className="flex flex-col lg:!flex-row justify-between gap-8">
        <PricingCard
          gateway={billingSnapshot.gateway}
          planExists={agencySubscription?.Subscription?.active === true}
          prices={prices}
          customerId={customerId}
          amt={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.price || '$0'
              : '$0'
          }
          buttonCta={
            agencySubscription?.Subscription?.active === true
              ? 'Change Plan'
              : 'Get Started'
          }
          highlightDescription="Want to modify your plan? You can do this here. If you have
          further question contact support@plura-app.com"
          highlightTitle="Plan Options"
          description={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.description || 'Lets get started'
              : 'Lets get started! Pick a plan that works best for you.'
          }
          duration="/ month"
          features={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.features || []
              : currentPlanDetails?.features ||
                pricingCards.find((pricing) => pricing.title === 'Starter')
                  ?.features ||
                []
          }
          title={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.title || 'Starter'
              : 'Starter'
          }
        />
        {addOns.map((addOn) => (
          <PricingCard
            gateway={billingSnapshot.gateway}
            planExists={agencySubscription?.Subscription?.active === true}
            prices={prices}
            customerId={customerId}
            key={addOn.id}
            amt={
              addOn.default_price?.unit_amount
                ? `$${addOn.default_price.unit_amount / 100}`
                : '$0'
            }
            buttonCta="Subscribe"
            description="Dedicated support line & teams channel for support"
            duration="/ month"
            features={[]}
            title={'24/7 priority support'}
            highlightTitle="Get support now!"
            highlightDescription="Get priority support and skip the long long with the click of a button."
          />
        ))}
      </div>
      <h2 className="text-2xl p-4">Payment History</h2>
      <Table className="bg-card border-[1px] border-border rounded-md">
        <TableHeader className="rounded-md">
          <TableRow>
            <TableHead className="w-[200px]">Description</TableHead>
            <TableHead className="w-[200px]">Invoice Id</TableHead>
            <TableHead className="w-[300px]">Date</TableHead>
            <TableHead className="w-[200px]">Paid</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-medium truncate">
          {allCharges.map((charge) => (
            <TableRow key={charge.id}>
              <TableCell>{charge.description}</TableCell>
              <TableCell className="text-muted-foreground">
                {charge.id}
              </TableCell>
              <TableCell>{charge.date}</TableCell>
              <TableCell>
                <p
                  className={clsx('', {
                    'text-emerald-500': charge.status.toLowerCase() === 'paid',
                    'text-orange-600':
                      charge.status.toLowerCase() === 'pending',
                    'text-red-600': charge.status.toLowerCase() === 'failed',
                  })}
                >
                  {charge.status.toUpperCase()}
                </p>
              </TableCell>
              <TableCell className="text-right">{charge.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

export default page
