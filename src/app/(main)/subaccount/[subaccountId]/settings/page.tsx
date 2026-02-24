import SubAccountDetails from '@/components/forms/subaccount-details'
import UserDetails from '@/components/forms/user-details'
import BlurPage from '@/components/global/blur-page'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import React from 'react'

type Props = {
  params: { subaccountId: string }
}

const SubaccountSettingPage = async ({ params }: Props) => {
  const session = await auth()
  if (!session?.user?.email) return
  const userDetails = await db.user.findUnique({
    where: {
      email: session.user.email,
    },
  })
  if (!userDetails) return

  const subAccount = await db.subAccount.findUnique({
    where: { id: params.subaccountId },
  })
  if (!subAccount) return

  const agencyDetails = await db.agency.findUnique({
    where: { id: subAccount.agencyId },
    include: { SubAccount: true },
  })

  if (!agencyDetails) return
  const subAccounts = agencyDetails.SubAccount

  return (
    <BlurPage>
      <div className="flex lg:!flex-row flex-col gap-4">
        <SubAccountDetails
          agencyDetails={agencyDetails}
          details={subAccount}
          userId={userDetails.id}
          userName={userDetails.name}
        />
        <UserDetails
          type="subaccount"
          id={params.subaccountId}
          subAccounts={subAccounts}
          userData={userDetails}
        />
      </div>
    </BlurPage>
  )
}

export default SubaccountSettingPage
