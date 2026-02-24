'use client'
import Loading from '@/components/global/loading'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { EditorBtns } from '@/lib/constants'
import { getFunnel, getSubaccountDetails } from '@/lib/queries'
import { PaymentGatewayCode } from '@/lib/payments'
import { getStripe } from '@/lib/stripe/stripe-client'
import { EditorElement, useEditor } from '@/providers/editor/editor-provider'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import clsx from 'clsx'
import { Trash } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

type Props = {
  element: EditorElement
}

type RazorpayCheckoutData = {
  key: string
  name: string
  description: string
  currency: string
  amount: number
  orderId?: string
  subscriptionId?: string
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

const Checkout = (props: Props) => {
  const { dispatch, state, subaccountId, funnelId, pageDetails } = useEditor()
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState('')
  const [livePrices, setLivePrices] = useState<
    { productId: string; recurring: boolean; gateway?: string }[]
  >([])
  const [paymentGateway, setPaymentGateway] =
    useState<PaymentGatewayCode>('STRIPE')
  const [subAccountPaymentAccId, setSubAccountPaymentAccId] = useState('')
  const [razorpayCheckout, setRazorpayCheckout] =
    useState<RazorpayCheckoutData | null>(null)
  const options = useMemo(() => ({ clientSecret }), [clientSecret])
  const styles = props.element.styles

  useEffect(() => {
    if (!subaccountId) return
    const fetchData = async () => {
      const subaccountDetails = await getSubaccountDetails(subaccountId)
      if (subaccountDetails) {
        setPaymentGateway(
          (subaccountDetails.paymentGateway as PaymentGatewayCode) || 'STRIPE'
        )
        setSubAccountPaymentAccId(
          subaccountDetails.paymentAccountId || subaccountDetails.connectAccountId || ''
        )
      }
    }
    fetchData()
  }, [subaccountId])

  useEffect(() => {
    if (funnelId) {
      const fetchData = async () => {
        const funnelData = await getFunnel(funnelId)
        const parsedProducts = JSON.parse(funnelData?.liveProducts || '[]') as {
          productId: string
          recurring: boolean
          gateway?: string
        }[]
        setLivePrices(
          parsedProducts.filter(
            (product) =>
              !product.gateway ||
              product.gateway.toUpperCase() === paymentGateway
          )
        )
      }
      fetchData()
    }
  }, [funnelId, paymentGateway])

  useEffect(() => {
    if (livePrices.length && subaccountId) {
      const getCheckoutSession = async () => {
        try {
          const body = JSON.stringify({
            gateway: paymentGateway,
            subAccountAccountId: subAccountPaymentAccId,
            prices: livePrices,
            subaccountId,
          })
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_URL}api/payments/create-checkout-session`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body,
            }
          )
          const responseJson = await response.json()
          if (!responseJson) throw new Error('something went wrong')
          if (responseJson.error) {
            throw new Error(responseJson.error)
          }
          if (responseJson.mode === 'embedded' && responseJson.clientSecret) {
            setClientSecret(responseJson.clientSecret)
            setRazorpayCheckout(null)
            return
          }
          if (responseJson.mode === 'popup' && responseJson.checkout) {
            setClientSecret('')
            setRazorpayCheckout(responseJson.checkout)
          }
        } catch (error) {
          toast({
            open: true,
            className: 'z-[100000]',
            variant: 'destructive',
            title: 'Oppse!',
            description:
              error instanceof Error
                ? error.message
                : 'Unable to initialize checkout',
          })
        }
      }
      getCheckoutSession()
    }
  }, [
    livePrices,
    paymentGateway,
    subAccountPaymentAccId,
    subaccountId,
  ])

  const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
    if (type === null) return
    e.dataTransfer.setData('componentType', type)
  }

  const handleOnClickBody = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({
      type: 'CHANGE_CLICKED_ELEMENT',
      payload: {
        elementDetails: props.element,
      },
    })
  }

  const goToNextPage = async () => {
    if (!state.editor.liveMode) return
    const funnelPages = await getFunnel(funnelId)
    if (!funnelPages || !pageDetails) return
    if (funnelPages.FunnelPages.length > pageDetails.order + 1) {
      const nextPage = funnelPages.FunnelPages.find(
        (page) => page.order === pageDetails.order + 1
      )
      if (!nextPage) return
      router.replace(
        `${process.env.NEXT_PUBLIC_SCHEME}${funnelPages.subDomainName}.${process.env.NEXT_PUBLIC_DOMAIN}/${nextPage.pathName}`
      )
    }
  }

  const handleRazorpayCheckout = async () => {
    if (!razorpayCheckout) return
    const sdkLoaded = await loadRazorpayScript()
    if (!sdkLoaded || !window.Razorpay) {
      toast({
        open: true,
        className: 'z-[100000]',
        variant: 'destructive',
        title: 'Oppse!',
        description: 'Could not load Razorpay checkout.',
      })
      return
    }

    const checkout = new window.Razorpay({
      key: razorpayCheckout.key,
      name: razorpayCheckout.name,
      description: razorpayCheckout.description,
      currency: razorpayCheckout.currency,
      amount: razorpayCheckout.amount,
      order_id: razorpayCheckout.orderId,
      subscription_id: razorpayCheckout.subscriptionId,
      handler: async () => {
        toast({
          open: true,
          className: 'z-[100000]',
          title: 'Payment successful',
          description: 'Payment received. Moving to the next funnel step.',
        })
        await goToNextPage()
      },
    })
    checkout.open()
  }

  const handleDeleteElement = () => {
    dispatch({
      type: 'DELETE_ELEMENT',
      payload: { elementDetails: props.element },
    })
  }

  return (
    <div
      style={styles}
      draggable
      onDragStart={(e) => handleDragStart(e, 'contactForm')}
      onClick={handleOnClickBody}
      className={clsx(
        'builder-element-base my-2 flex w-full items-center justify-center px-3 py-3',
        {
          '!border-primary !ring-2 !ring-primary/20':
            state.editor.selectedElement.id === props.element.id &&
            !state.editor.liveMode,
          'hover:border-primary/35':
            state.editor.selectedElement.id !== props.element.id &&
            !state.editor.liveMode,
          '!border-transparent !ring-0': state.editor.liveMode,
        }
      )}
    >
      {state.editor.selectedElement.id === props.element.id &&
        !state.editor.liveMode && (
          <Badge className="builder-element-badge">
            {state.editor.selectedElement.name}
          </Badge>
        )}

      <div className="w-full rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm transition-all">
        <div className="flex w-full flex-col gap-4">
          {paymentGateway === 'STRIPE' && options.clientSecret && subAccountPaymentAccId && (
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card p-2">
              <EmbeddedCheckoutProvider
                stripe={getStripe(subAccountPaymentAccId)}
                options={options}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}

          {paymentGateway === 'RAZORPAY' && razorpayCheckout && (
            <button
              type="button"
              onClick={handleRazorpayCheckout}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Continue with Razorpay
            </button>
          )}

          {!options.clientSecret && !razorpayCheckout && (
            <div className="flex h-40 w-full items-center justify-center rounded-xl border border-border/60 bg-card">
              <Loading />
            </div>
          )}
        </div>
      </div>

      {state.editor.selectedElement.id === props.element.id &&
        !state.editor.liveMode && (
          <div className="builder-element-action">
            <Trash
              className="cursor-pointer"
              size={16}
              onClick={handleDeleteElement}
            />
          </div>
        )}
    </div>
  )
}

export default Checkout
