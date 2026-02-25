import { createGatewayCheckoutSession } from '@/lib/payments/actions'
import { normalizePaymentGateway } from '@/lib/payments'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const gateway = body.gateway
    ? normalizePaymentGateway(body.gateway)
    : undefined
  const subAccountAccountId =
    (body.subAccountAccountId as string | undefined) ||
    (body.subAccountConnectAccId as string | undefined) ||
    ''
  const subaccountId = body.subaccountId as string | undefined
  const prices = body.prices as { recurring: boolean; productId: string }[] | undefined

  const origin = req.headers.get('origin')
  if (!subaccountId || !prices?.length) {
    return new NextResponse('Subaccount id or prices are missing', {
      status: 400,
    })
  }
  try {
    const session = await createGatewayCheckoutSession(
      {
        subAccountAccountId,
        prices,
        subaccountId,
      },
      gateway
    )

    return NextResponse.json(session, {
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.log('🔴 Error creating checkout session', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown checkout error',
      },
      {
        status: 500,
      }
    )
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
