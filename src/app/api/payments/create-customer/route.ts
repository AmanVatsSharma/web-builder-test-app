import { StripeCustomerType } from '@/lib/types'
import {
  createGatewayCustomer,
} from '@/lib/payments/actions'
import { normalizePaymentGateway } from '@/lib/payments'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const gateway = normalizePaymentGateway(body.gateway)
  const payload: StripeCustomerType = {
    address: body.address,
    email: body.email,
    name: body.name,
    shipping: body.shipping,
  }

  if (!payload.email || !payload.address || !payload.name || !payload.shipping) {
    return new NextResponse('Missing data', { status: 400 })
  }

  try {
    const customer = await createGatewayCustomer(payload, gateway)
    return NextResponse.json({ customerId: customer.customerId, gateway })
  } catch (error) {
    console.log('🔴 Error creating customer', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
