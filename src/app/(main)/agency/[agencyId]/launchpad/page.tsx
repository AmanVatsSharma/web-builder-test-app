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
  getAgencyPayoutProvider,
  getGatewayDisplayName,
  upsertAgencyConnectAccount,
} from '@/lib/payments'
import { CheckCircleIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

type Props = {
  params: Promise<{
    agencyId: string
  }>
  searchParams: Promise<{ code?: string }>
}

const LaunchPadPage = async ({ params, searchParams }: Props) => {
  const { agencyId } = await params
  const { code } = await searchParams
  const agencyDetails = await db.agency.findUnique({
    where: { id: agencyId },
  })

  if (!agencyDetails) return
  const paymentContext = await getAgencyPayoutProvider(agencyId)
  const gatewayName = getGatewayDisplayName(paymentContext.gateway)

  const allDetailsExist =
    agencyDetails.address &&
    agencyDetails.address &&
    agencyDetails.agencyLogo &&
    agencyDetails.city &&
    agencyDetails.companyEmail &&
    agencyDetails.companyPhone &&
    agencyDetails.country &&
    agencyDetails.name &&
    agencyDetails.state &&
    agencyDetails.zipCode

  const paymentOAuthLink = paymentContext.provider.getConnectOAuthLink(
    'agency',
    `launchpad___${agencyDetails.id}`
  )

  let connectedPaymentAccount = false

  if (code) {
    if (!paymentContext.accountId) {
      try {
        const response = await paymentContext.provider.exchangeConnectCode(code)
        await upsertAgencyConnectAccount(
          agencyId,
          response.accountId,
          paymentContext.gateway
        )
        connectedPaymentAccount = true
      } catch (error) {
        console.log(`🔴 Could not connect ${gatewayName} account`)
      }
    }
  }

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="w-full h-full max-w-[800px]">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>Lets get started!</CardTitle>
            <CardDescription>
              Follow the steps below to get your account setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <Image
                  src="/appstore.png"
                  alt="app logo"
                  height={80}
                  width={80}
                  className="rounded-md object-contain"
                />
                <p> Save the website as a shortcut on your mobile device</p>
              </div>
              <Button>Start</Button>
            </div>
            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <Image
                  src="/stripelogo.png"
                  alt="app logo"
                  height={80}
                  width={80}
                  className="rounded-md object-contain"
                />
                <p>
                  Connect your {gatewayName} account to accept payments and see your
                  dashboard.
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
                      href={`/agency/${agencyId}/settings`}
                    >
                      Set in Settings
                    </Link>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-between items-center w-full border p-4 rounded-lg gap-2">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <Image
                  src={agencyDetails.agencyLogo}
                  alt="app logo"
                  height={80}
                  width={80}
                  className="rounded-md object-contain"
                />
                <p> Fill in all your bussiness details</p>
              </div>
              {allDetailsExist ? (
                <CheckCircleIcon
                  size={50}
                  className="text-primary p-2 flex-shrink-0"
                />
              ) : (
                <Link
                  className="bg-primary py-2 px-4 rounded-md text-white"
                  href={`/agency/${agencyId}/settings`}
                >
                  Start
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LaunchPadPage
