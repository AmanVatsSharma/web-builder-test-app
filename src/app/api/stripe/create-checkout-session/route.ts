import { createGatewayCheckoutSession } from '@/lib/payments/actions'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const {
    subAccountConnectAccId,
    prices,
    subaccountId,
  }: {
    subAccountConnectAccId: string
    prices: { recurring: boolean; productId: string }[]
    subaccountId: string
  } = await req.json()

  const origin = req.headers.get('origin')
  if (!subAccountConnectAccId || !prices.length)
    return new NextResponse('Stripe Account Id or price id is missing', {
      status: 400,
    })

  try {
    const session = await createGatewayCheckoutSession(
      {
        subAccountAccountId: subAccountConnectAccId,
        prices,
        subaccountId,
      },
      'STRIPE'
    )

    return NextResponse.json(
      {
        clientSecret: session.mode === 'embedded' ? session.clientSecret : '',
      },
      {
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    )
  } catch (error) {
    console.log('🔴 Error', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Checkout session error',
    })
  }
}

export async function OPTIONS(request: Request) {
  const allowedOrigin = request.headers.get('origin')
  const response = new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
      'Access-Control-Max-Age': '86400',
    },
  })

  return response
}
