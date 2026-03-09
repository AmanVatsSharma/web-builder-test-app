import { createGatewayCustomer } from '@/lib/payments/actions'
import { StripeCustomerType } from '@/lib/types'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { address, email, name, shipping }: StripeCustomerType =
    await req.json()

  if (!email || !address || !name || !shipping)
    return new NextResponse('Missing data', {
      status: 400,
    })
  try {
    const customer = await createGatewayCustomer(
      {
        address,
        email,
        name,
        shipping,
      },
      'STRIPE'
    )
    return NextResponse.json({ customerId: customer.customerId })
  } catch (error) {
    console.log('🔴 Error', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
