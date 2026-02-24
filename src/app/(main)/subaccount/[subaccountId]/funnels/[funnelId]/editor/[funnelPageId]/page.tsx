import { db } from '@/lib/db'
import EditorProvider from '@/providers/editor/editor-provider'
import { redirect } from 'next/navigation'
import React from 'react'
import FunnelEditorNavigation from './_components/funnel-editor-navigation'
import FunnelEditorSidebar from './_components/funnel-editor-sidebar'
import FunnelEditor from './_components/funnel-editor'

type Props = {
  params: Promise<{
    subaccountId: string
    funnelId: string
    funnelPageId: string
  }>
}

const Page = async ({ params }: Props) => {
  const { subaccountId, funnelId, funnelPageId } = await params
  const funnelPageDetails = await db.funnelPage.findFirst({
    where: {
      id: funnelPageId,
    },
  })
  if (!funnelPageDetails) {
    return redirect(
      `/subaccount/${subaccountId}/funnels/${funnelId}`
    )
  }

  return (
    <div className="fixed inset-0 z-[20] overflow-hidden builder-shell-bg">
      <EditorProvider
        subaccountId={subaccountId}
        funnelId={funnelId}
        pageDetails={funnelPageDetails}
      >
        <div className="flex h-full flex-col">
          <FunnelEditorNavigation
            funnelId={funnelId}
            funnelPageDetails={funnelPageDetails}
            subaccountId={subaccountId}
          />
          <div className="relative flex flex-1 justify-center overflow-hidden px-4 pb-4 pt-3 md:px-6 md:pb-6">
            <FunnelEditor funnelPageId={funnelPageId} />
          </div>
          <FunnelEditorSidebar subaccountId={subaccountId} />
        </div>
      </EditorProvider>
    </div>
  )
}

export default Page
