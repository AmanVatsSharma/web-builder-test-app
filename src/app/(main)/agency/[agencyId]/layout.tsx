import BlurPage from '@/components/global/blur-page'
import InfoBar from '@/components/global/infobar'
import Sidebar from '@/components/sidebar'
import Unauthorized from '@/components/unauthorized'
import {
  getNotificationAndUser,
  verifyAndAcceptInvitation,
  getAuthUserDetails,
} from '@/lib/queries'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  children: React.ReactNode
  params: Promise<{ agencyId: string }>
}

const layout = async ({ children, params }: Props) => {
  const { agencyId: routeAgencyId } = await params
  const agencyId = await verifyAndAcceptInvitation()
  const user = await getAuthUserDetails()

  if (!user) {
    return redirect('/')
  }

  if (!agencyId) {
    return redirect('/agency')
  }

  if (
    user.role !== 'AGENCY_OWNER' &&
    user.role !== 'AGENCY_ADMIN'
  )
    return <Unauthorized />

  let allNoti: any = []
  const notifications = await getNotificationAndUser(agencyId)
  if (notifications) allNoti = notifications

 

  return (
    <div className="h-screen overflow-hidden">
      <Sidebar
        id={routeAgencyId}
        type="agency"
      />
      <div className="md:pl-[300px]">
        <InfoBar
          notifications={allNoti}
          role={user.role}
        />
        <div className="relative">
          <BlurPage>{children}</BlurPage>
        </div>
      </div>
    </div>
  )
}

export default layout
