import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPaymentProvider } from '@/lib/payments'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = (await headers()).get('Stripe-Signature')
  const provider = getPaymentProvider('STRIPE')
  try {
    await provider.handleWebhook({ body, signature: sig })
  } catch (error: any) {
    console.log(`🔴 Error ${error.message}`)
    return new NextResponse('🔴 Webhook Error', { status: 400 })
  }
  return NextResponse.json(
    {
      webhookActionReceived: true,
    },
    {
      status: 200,
    }
  )
}
