import { createGatewaySubscription } from '@/lib/payments/actions'
import { normalizePaymentGateway } from '@/lib/payments'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const customerId = body.customerId as string | undefined
  const priceId = body.priceId as string | undefined
  const gateway = body.gateway
    ? normalizePaymentGateway(body.gateway)
    : undefined

  if (!customerId || !priceId) {
    return new NextResponse('Customer Id or price id is missing', {
      status: 400,
    })
  }

  try {
    const subscription = await createGatewaySubscription(
      {
        customerId,
        priceId,
      },
      gateway
    )

    return NextResponse.json(subscription)
  } catch (error) {
    console.log('🔴 Error creating subscription', error)
    return new NextResponse('Internal Server Error', {
      status: 500,
    })
  }
}
