import BlurPage from '@/components/global/blur-page'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { db } from '@/lib/db'
import {
  getGatewayDisplayName,
  getSubAccountPaymentProvider,
  upsertSubAccountConnectAccount,
} from '@/lib/payments'
import { CheckCircleIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

type Props = {
  searchParams: Promise<{
    state?: string
    code?: string
  }>
  params: Promise<{ subaccountId: string }>
}

const LaunchPad = async ({ params, searchParams }: Props) => {
  const { subaccountId } = await params
  const { code } = await searchParams
  const subaccountDetails = await db.subAccount.findUnique({
    where: {
      id: subaccountId,
    },
  })

  if (!subaccountDetails) {
    return
  }
  const paymentContext = await getSubAccountPaymentProvider(subaccountId)
  const gatewayName = getGatewayDisplayName(paymentContext.gateway)

  const allDetailsExist =
    subaccountDetails.address &&
    subaccountDetails.subAccountLogo &&
    subaccountDetails.city &&
    subaccountDetails.companyEmail &&
    subaccountDetails.companyPhone &&
    subaccountDetails.country &&
    subaccountDetails.name &&
    subaccountDetails.state

  const paymentOAuthLink = paymentContext.provider.getConnectOAuthLink(
    'subaccount',
    `launchpad___${subaccountDetails.id}`
  )

  let connectedPaymentAccount = false

  if (code) {
    if (!paymentContext.accountId) {
      try {
        const response = await paymentContext.provider.exchangeConnectCode(code)
        await upsertSubAccountConnectAccount(
          subaccountId,
          response.accountId,
          paymentContext.gateway
        )
        connectedPaymentAccount = true
      } catch (error) {
        console.log(`🔴 Could not connect ${gatewayName} account`, error)
      }
    }
  }

  return (
    <BlurPage>
      <div className="flex flex-col justify-center items-center">
        <div className="w-full h-full max-w-[800px]">
          <Card className="border-none ">
            <CardHeader>
              <CardTitle>Lets get started!</CardTitle>
              <CardDescription>
                Follow the steps below to get your account setup correctly.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex justify-between items-center w-full h-20 border p-4 rounded-lg ">
                <div className="flex items-center gap-4">
                  <Image
                    src="/appstore.png"
                    alt="App logo"
                    height={80}
                    width={80}
                    className="rounded-md object-contain"
                  />
                  <p>Save the website as a shortcut on your mobile devide</p>
                </div>
                <Button>Start</Button>
              </div>
              <div className="flex justify-between items-center w-full h-20 border p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <Image
                    src="/stripelogo.png"
                    alt="App logo"
                    height={80}
                    width={80}
                    className="rounded-md object-contain "
                  />
                  <p>
                    Connect your {gatewayName} account to accept payments. {gatewayName} is
                    used to run payouts.
                  </p>
                </div>
                {paymentContext.accountId || connectedPaymentAccount ? (
                  <CheckCircleIcon
                    size={50}
                    className=" text-primary p-2 flex-shrink-0"
                  />
                ) : (
                  <>
                    {paymentOAuthLink ? (
                      <Link
                        className="bg-primary py-2 px-4 rounded-md text-white"
                        href={paymentOAuthLink}
                      >
                        Start
                      </Link>
                    ) : (
                      <Link
                        className="bg-primary py-2 px-4 rounded-md text-white"
                        href={`/subaccount/${subaccountDetails.id}/settings`}
                      >
                        Set in Settings
                      </Link>
                    )}
                  </>
                )}
              </div>
              <div className="flex justify-between items-center w-full h-20 border p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <Image
                    src={subaccountDetails.subAccountLogo}
                    alt="App logo"
                    height={80}
                    width={80}
                    className="rounded-md object-contain p-4"
                  />
                  <p>Fill in all your business details.</p>
                </div>
                {allDetailsExist ? (
                  <CheckCircleIcon
                    size={50}
                    className=" text-primary p-2 flex-shrink-0"
                  />
                ) : (
                  <Link
                    className="bg-primary py-2 px-4 rounded-md text-white"
                    href={`/subaccount/${subaccountDetails.id}/settings`}
                  >
                    Start
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BlurPage>
  )
}

export default LaunchPad
