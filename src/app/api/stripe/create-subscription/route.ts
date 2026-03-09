import { createGatewaySubscription } from '@/lib/payments/actions'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { customerId, priceId } = await req.json()
  if (!customerId || !priceId)
    return new NextResponse('Customer Id or price id is missing', {
      status: 400,
    })

  try {
    const subscription = await createGatewaySubscription(
      {
        customerId,
        priceId,
      },
      'STRIPE'
    )
    if (subscription.mode === 'embedded') {
      return NextResponse.json({
        subscriptionId: subscription.subscriptionId,
        clientSecret: subscription.clientSecret,
      })
    }
    return NextResponse.json(subscription)
  } catch (error) {
    console.log('🔴 Error', error)
    return new NextResponse('Internal Server Error', {
      status: 500,
    })
  }
}
