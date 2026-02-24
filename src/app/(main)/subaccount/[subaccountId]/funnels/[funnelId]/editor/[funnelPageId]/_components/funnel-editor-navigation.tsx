'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { saveActivityLogsNotification, upsertFunnelPage } from '@/lib/queries'
import { DeviceTypes, useEditor } from '@/providers/editor/editor-provider'
import { FunnelPage } from '@prisma/client'
import clsx from 'clsx'
import {
  ArrowLeftCircle,
  EyeIcon,
  Laptop,
  Redo2,
  Smartphone,
  Tablet,
  Undo2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { FocusEventHandler, useEffect } from 'react'
import { toast } from 'sonner'

type Props = {
  funnelId: string
  funnelPageDetails: FunnelPage
  subaccountId: string
}

const FunnelEditorNavigation = ({
  funnelId,
  funnelPageDetails,
  subaccountId,
}: Props) => {
  const router = useRouter()
  const { state, dispatch } = useEditor()

  useEffect(() => {
    dispatch({
      type: 'SET_FUNNELPAGE_ID',
      payload: { funnelPageId: funnelPageDetails.id },
    })
  }, [funnelPageDetails])

  const handleOnBlurTitleChange: FocusEventHandler<HTMLInputElement> = async (
    event
  ) => {
    if (event.target.value === funnelPageDetails.name) return
    if (event.target.value) {
      await upsertFunnelPage(
        subaccountId,
        {
          id: funnelPageDetails.id,
          name: event.target.value,
          order: funnelPageDetails.order,
        },
        funnelId
      )

      toast('Success', {
        description: 'Saved Funnel Page title',
      })
      router.refresh()
    } else {
      toast('Oppse!', {
        description: 'You need to have a title!',
      })
      event.target.value = funnelPageDetails.name
    }
  }

  const handlePreviewClick = () => {
    dispatch({ type: 'TOGGLE_PREVIEW_MODE' })
    dispatch({ type: 'TOGGLE_LIVE_MODE' })
  }

  const handleUndo = () => {
    dispatch({ type: 'UNDO' })
  }

  const handleRedo = () => {
    dispatch({ type: 'REDO' })
  }

  const handleOnSave = async () => {
    const content = JSON.stringify(state.editor.elements)
    try {
      const response = await upsertFunnelPage(
        subaccountId,
        {
          ...funnelPageDetails,
          content,
        },
        funnelId
      )
      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Updated a funnel page | ${response?.name}`,
        subaccountId: subaccountId,
      })
      toast('Success', {
        description: 'Saved Editor',
      })
    } catch (error) {
      toast('Oppse!', {
        description: 'Could not save editor',
      })
    }
  }

  return (
    <TooltipProvider>
      <nav
        className={clsx(
          'builder-top-nav relative z-[30] flex h-[88px] items-center justify-between gap-4 px-4 md:px-6 transition-all',
          { '!h-0 !p-0 !overflow-hidden': state.editor.previewMode }
        )}
      >
        <aside className="flex w-[320px] max-w-[40%] items-center gap-3">
          <Link
            href={`/subaccount/${subaccountId}/funnels/${funnelId}`}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeftCircle size={18} />
          </Link>
          <div className="flex min-w-0 flex-col gap-0.5">
            <Input
              defaultValue={funnelPageDetails.name}
              className="h-8 border-0 bg-transparent p-0 text-base font-semibold tracking-tight shadow-none focus-visible:ring-0"
              onBlur={handleOnBlurTitleChange}
            />
            <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground/90">
              Path: /{funnelPageDetails.pathName}
            </span>
          </div>
        </aside>
        <aside className="hidden md:block">
          <Tabs
            defaultValue="Desktop"
            className="w-fit"
            value={state.editor.device}
            onValueChange={(value) => {
              dispatch({
                type: 'CHANGE_DEVICE',
                payload: { device: value as DeviceTypes },
              })
            }}
          >
            <TabsList className="grid h-10 w-full grid-cols-3 gap-1 rounded-xl border border-border/70 bg-card p-1 shadow-sm">
              <Tooltip>
                <TooltipTrigger>
                  <TabsTrigger
                    value="Desktop"
                    className="h-8 w-9 rounded-lg p-0 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    <Laptop size={16} />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Desktop</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <TabsTrigger
                    value="Tablet"
                    className="h-8 w-9 rounded-lg p-0 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    <Tablet size={16} />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tablet</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <TabsTrigger
                    value="Mobile"
                    className="h-8 w-9 rounded-lg p-0 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    <Smartphone size={16} />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mobile</p>
                </TooltipContent>
              </Tooltip>
            </TabsList>
          </Tabs>
        </aside>
        <aside className="flex items-center gap-2">
          <Button
            variant={'ghost'}
            size={'icon'}
            className="h-9 w-9 rounded-xl border border-border/70 bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
            onClick={handlePreviewClick}
          >
            <EyeIcon size={16} />
          </Button>
          <Button
            disabled={!(state.history.currentIndex > 0)}
            onClick={handleUndo}
            variant={'ghost'}
            size={'icon'}
            className="h-9 w-9 rounded-xl border border-border/70 bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
          >
            <Undo2 size={16} />
          </Button>
          <Button
            disabled={
              !(state.history.currentIndex < state.history.history.length - 1)
            }
            onClick={handleRedo}
            variant={'ghost'}
            size={'icon'}
            className="mr-2 h-9 w-9 rounded-xl border border-border/70 bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
          >
            <Redo2 size={16} />
          </Button>
          <div className="hidden md:flex min-w-[220px] flex-col rounded-xl border border-border/70 bg-card px-3 py-2 shadow-sm">
            <div className="flex flex-row items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Draft</span>
              <Switch
                disabled
                defaultChecked={true}
              />
              <span>Publish</span>
            </div>
            <span className="mt-1 text-[11px] text-muted-foreground">
              Last updated {funnelPageDetails.updatedAt.toLocaleDateString()}
            </span>
          </div>
          <Button
            onClick={handleOnSave}
            className="h-9 rounded-xl px-5 font-semibold shadow-editor-soft"
          >
            Save
          </Button>
        </aside>
      </nav>
    </TooltipProvider>
  )
}

export default FunnelEditorNavigation
