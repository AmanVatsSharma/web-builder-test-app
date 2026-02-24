import Unauthorized from '@/components/unauthorized'
import { getAuthUserDetails, verifyAndAcceptInvitation } from '@/lib/queries'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  searchParams: Promise<{ state?: string; code?: string }>
}

const SubAccountMainPage = async ({ searchParams }: Props) => {
  const { state, code } = await searchParams
  const agencyId = await verifyAndAcceptInvitation()

  if (!agencyId) {
    return <Unauthorized />
  }

  const user = await getAuthUserDetails()
  if (!user) return

  const isAgencyPrivileged =
    user.role === 'AGENCY_OWNER' || user.role === 'AGENCY_ADMIN'
  const firstSubaccountIdForRedirect = isAgencyPrivileged
    ? user.Agency?.SubAccount[0]?.id
    : user.Permissions.find((permission) => permission.access === true)
        ?.subAccountId

  if (state) {
    const statePath = state.split('___')[0]
    const stateSubaccountId = state.split('___')[1]
    if (!stateSubaccountId) return <Unauthorized />
    return redirect(
      `/subaccount/${stateSubaccountId}/${statePath}?code=${code}`
    )
  }

  if (firstSubaccountIdForRedirect) {
    return redirect(`/subaccount/${firstSubaccountIdForRedirect}`)
  }

  return <Unauthorized />
}

export default SubAccountMainPage
