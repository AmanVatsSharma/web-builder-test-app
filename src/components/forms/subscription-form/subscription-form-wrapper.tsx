'use client'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { pricingCards } from '@/lib/constants'
import { PaymentGatewayCode } from '@/lib/payments'
import { useModal } from '@/providers/modal-provider'
import { StripeElementsOptions } from '@stripe/stripe-js'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe/stripe-client'
import Loading from '@/components/global/loading'
import SubscriptionForm from '.'

type Props = {
  customerId: string
  gateway: PaymentGatewayCode
  planExists: boolean
}

type RazorpaySubscriptionCheckout = {
  key: string
  name: string
  description: string
  customerId: string
  subscriptionId: string
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void
    }
  }
}

const loadRazorpayScript = async () => {
  if (typeof window === 'undefined') return false
  if (window.Razorpay) return true

  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const SubscriptionFormWrapper = ({ customerId, gateway, planExists }: Props) => {
  const { data, setClose } = useModal()
  const router = useRouter()
  const [selectedPriceId, setSelectedPriceId] = useState<string>(
    data?.plans?.defaultPriceId || ''
  )
  const [subscription, setSubscription] = useState<{
    subscriptionId: string
    clientSecret: string
  }>({ subscriptionId: '', clientSecret: '' })
  const [razorpayCheckout, setRazorpayCheckout] =
    useState<RazorpaySubscriptionCheckout | null>(null)

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret: subscription?.clientSecret,
      appearance: {
        theme: 'flat',
      },
    }),
    [subscription]
  )

  useEffect(() => {
    if (!selectedPriceId) return
    const createSecret = async () => {
      const subscriptionResponse = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          gateway,
          priceId: selectedPriceId,
        }),
      })
      const subscriptionResponseData = await subscriptionResponse.json()
      if (!subscriptionResponse.ok) {
        throw new Error(subscriptionResponseData?.error || 'Subscription failed')
      }

      if (subscriptionResponseData.mode === 'embedded') {
        setSubscription({
          clientSecret: subscriptionResponseData.clientSecret,
          subscriptionId: subscriptionResponseData.subscriptionId,
        })
        setRazorpayCheckout(null)
        if (planExists) {
          toast({
            title: 'Success',
            description: 'Your plan has been successfully upgraded!',
          })
          setClose()
          router.refresh()
        }
      } else if (subscriptionResponseData.mode === 'popup') {
        setSubscription({ clientSecret: '', subscriptionId: '' })
        setRazorpayCheckout(subscriptionResponseData.checkout)
      }
    }
    createSecret().catch((error) => {
      toast({
        title: 'Payment setup failed',
        variant: 'destructive',
        description:
          error instanceof Error ? error.message : 'Could not initialize payment',
      })
    })
  }, [customerId, gateway, planExists, selectedPriceId])

  const handleRazorpayCheckout = async () => {
    if (!razorpayCheckout) return
    const sdkLoaded = await loadRazorpayScript()
    if (!sdkLoaded || !window.Razorpay) {
      toast({
        title: 'Razorpay SDK failed',
        variant: 'destructive',
        description: 'Could not load Razorpay checkout script.',
      })
      return
    }

    const checkout = new window.Razorpay({
      ...razorpayCheckout,
      handler: () => {
        toast({
          title: 'Payment successful',
          description: 'Your subscription payment has been captured.',
        })
        setClose()
        router.refresh()
      },
    })
    checkout.open()
  }

  return (
    <div className="border-none transition-all">
      <div className="flex flex-col gap-4">
        {data.plans?.plans.map((price) => (
          <Card
            onClick={() => setSelectedPriceId(price.id)}
            key={price.id}
            className={clsx('relative cursor-pointer transition-all', {
              'border-primary': selectedPriceId === price.id,
            })}
          >
            <CardHeader>
              <CardTitle>
                ${price.unit_amount ? price.unit_amount / 100 : '0'}
                <p className="text-sm text-muted-foreground">
                  {price.nickname}
                </p>
                <p className="text-sm text-muted-foreground">
                  {
                    pricingCards.find((p) => p.priceId === price.id)
                      ?.description
                  }
                </p>
              </CardTitle>
            </CardHeader>
            {selectedPriceId === price.id && (
              <div className="w-2 h-2 bg-emerald-500 rounded-full absolute top-4 right-4" />
            )}
          </Card>
        ))}

        {options.clientSecret && !planExists && gateway === 'STRIPE' && (
          <>
            <h1 className="text-xl">Payment Method</h1>
            <Elements
              stripe={getStripe()}
              options={options}
            >
              <SubscriptionForm selectedPriceId={selectedPriceId} />
            </Elements>
          </>
        )}

        {gateway === 'RAZORPAY' && razorpayCheckout && (
          <button
            type="button"
            onClick={handleRazorpayCheckout}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Continue with Razorpay
          </button>
        )}

        {!options.clientSecret &&
          selectedPriceId &&
          !(gateway === 'RAZORPAY' && razorpayCheckout) && (
          <div className="flex items-center justify-center w-full h-40">
            <Loading />
          </div>
        )}
      </div>
    </div>
  )
}

export default SubscriptionFormWrapper
