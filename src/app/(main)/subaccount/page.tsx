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

  const getFirstSubaccountWithAccess = user.Permissions.find(
    (permission) => permission.access === true
  )

  if (state) {
    const statePath = state.split('___')[0]
    const stateSubaccountId = state.split('___')[1]
    if (!stateSubaccountId) return <Unauthorized />
    return redirect(
      `/subaccount/${stateSubaccountId}/${statePath}?code=${code}`
    )
  }

  if (getFirstSubaccountWithAccess) {
    return redirect(`/subaccount/${getFirstSubaccountWithAccess.subAccountId}`)
  }

  return <Unauthorized />
}

export default SubAccountMainPage
