import InfoBar from '@/components/global/infobar'
import Sidebar from '@/components/sidebar'
import Unauthorized from '@/components/unauthorized'
import {
  getAuthUserDetails,
  getNotificationAndUser,
  verifyAndAcceptInvitation,
} from '@/lib/queries'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  children: React.ReactNode
  params: Promise<{ subaccountId: string }>
}

const SubaccountLayout = async ({ children, params }: Props) => {
  const { subaccountId } = await params
  const agencyId = await verifyAndAcceptInvitation()
  if (!agencyId) return <Unauthorized />
  const user = await getAuthUserDetails()
  if (!user) {
    return redirect('/')
  }

  let notifications: any = []

  if (!user.role) {
    return <Unauthorized />
  } else {
    const hasPermission = user.Permissions.find(
      (permissions) =>
        permissions.access && permissions.subAccountId === subaccountId
    )
    if (!hasPermission) {
      return <Unauthorized />
    }

    const allNotifications = await getNotificationAndUser(agencyId)

    if (
      user.role === 'AGENCY_ADMIN' ||
      user.role === 'AGENCY_OWNER'
    ) {
      notifications = allNotifications
    } else {
      const filteredNoti = allNotifications?.filter(
        (item) => item.subAccountId === subaccountId
      )
      if (filteredNoti) notifications = filteredNoti
    }
  }

  return (
    <div className="h-screen overflow-hidden">
      <Sidebar
        id={subaccountId}
        type="subaccount"
      />

      <div className="md:pl-[300px]">
        <InfoBar
          notifications={notifications}
          role={user.role}
          subAccountId={subaccountId as string}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  )
} 

export default SubaccountLayout
