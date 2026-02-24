import AgencyDetails from '@/components/forms/agency-details'
import UserDetails from '@/components/forms/user-details'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import React from 'react'

type Props = {
  params: { agencyId: string }
}

const SettingsPage = async ({ params }: Props) => {
  const session = await auth()
  if (!session?.user?.email) return null

  const userDetails = await db.user.findUnique({
    where: {
      email: session.user.email,
    },
  })

  if (!userDetails) return null
  const agencyDetails = await db.agency.findUnique({
    where: {
      id: params.agencyId,
    },
    include: {
      SubAccount: true,
    },
  })

  if (!agencyDetails) return null

  const subAccounts = agencyDetails.SubAccount

  return (
    <div className="flex lg:!flex-row flex-col gap-4">
      <AgencyDetails data={agencyDetails} />
      <UserDetails
        type="agency"
        id={params.agencyId}
        subAccounts={subAccounts}
        userData={userDetails}
      />
    </div>
  )
}

export default SettingsPage
