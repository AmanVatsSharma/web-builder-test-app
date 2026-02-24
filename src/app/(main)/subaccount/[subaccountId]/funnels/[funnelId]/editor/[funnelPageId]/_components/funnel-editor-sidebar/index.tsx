'use client'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { useEditor } from '@/providers/editor/editor-provider'
import clsx from 'clsx'
import React from 'react'
import TabList from './tabs'
import SettingsTab from './tabs/settings-tab'
import MediaBucketTab from './tabs/media-bucket-tab'
import ComponentsTab from './tabs/components-tab'

type Props = {
  subaccountId: string
}

const FunnelEditorSidebar = ({ subaccountId }: Props) => {
  const { state, dispatch } = useEditor()

  return (
    <Sheet
      open={true}
      modal={false}
    >
      <Tabs
        className="w-full"
        defaultValue="Settings"
      >
        <SheetContent
          showX={false}
          showOverlay={false}
          side="right"
          className={clsx(
            '!top-[102px] !bottom-6 !right-6 !h-auto !w-[72px] !rounded-2xl !border !border-border/70 !bg-card/95 !p-2 !shadow-editor-soft backdrop-blur-md transition-all duration-200',
            {
              'pointer-events-none translate-x-4 opacity-0':
                state.editor.previewMode,
            }
          )}
        >
          <TabList />
        </SheetContent>
        <SheetContent
          showX={false}
          showOverlay={false}
          side="right"
          className={clsx(
            '!top-[102px] !bottom-6 !right-[96px] !h-auto !w-[340px] !rounded-2xl !border !border-border/70 !bg-card/95 !p-0 !shadow-editor-card backdrop-blur-md transition-all duration-200',
            {
              'pointer-events-none translate-x-4 opacity-0':
                state.editor.previewMode,
            }
          )}
        >
          <div className="h-full overflow-y-auto pb-24">
            <TabsContent
              value="Settings"
              className="mt-0"
            >
              <SheetHeader className="border-b border-border/70 px-6 py-5 text-left">
                <SheetTitle className="text-base font-semibold tracking-tight">
                  Styles
                </SheetTitle>
                <SheetDescription>
                  Show your creativity! You can customize every component as you
                  like.
                </SheetDescription>
              </SheetHeader>
              <SettingsTab />
            </TabsContent>
            <TabsContent
              value="Media"
              className="mt-0"
            >
              <MediaBucketTab subaccountId={subaccountId} />
            </TabsContent>
            <TabsContent
              value="Components"
              className="mt-0"
            >
              <SheetHeader className="border-b border-border/70 px-6 py-5 text-left">
                <SheetTitle className="text-base font-semibold tracking-tight">
                  Components
                </SheetTitle>
                <SheetDescription>
                  You can drag and drop components on the canvas
                </SheetDescription>
              </SheetHeader>
              <ComponentsTab />
            </TabsContent>
          </div>
        </SheetContent>
      </Tabs>
    </Sheet>
  )
}

export default FunnelEditorSidebar
