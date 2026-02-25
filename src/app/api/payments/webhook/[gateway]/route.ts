import { getPaymentProvider, normalizePaymentGateway } from '@/lib/payments'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

type Props = {
  params: Promise<{ gateway: string }>
}

export async function POST(req: NextRequest, { params }: Props) {
  const { gateway } = await params
  const normalizedGateway = normalizePaymentGateway(gateway)
  const provider = getPaymentProvider(normalizedGateway)
  const body = await req.text()
  const requestHeaders = await headers()
  const signature =
    normalizedGateway === 'RAZORPAY'
      ? requestHeaders.get('x-razorpay-signature')
      : requestHeaders.get('Stripe-Signature')

  try {
    const result = await provider.handleWebhook({
      body,
      signature,
    })
    return NextResponse.json(
      {
        gateway: normalizedGateway,
        webhookActionReceived: result.received,
        ignored: result.ignored ?? false,
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown webhook processing error'
    console.log(`🔴 ${normalizedGateway} webhook error`, message)
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 })
  }
}
