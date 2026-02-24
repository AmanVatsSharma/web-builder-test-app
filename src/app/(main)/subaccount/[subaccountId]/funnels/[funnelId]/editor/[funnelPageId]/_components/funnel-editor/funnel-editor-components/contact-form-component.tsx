'use client'
import ContactForm from '@/components/forms/contact-form'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { EditorBtns } from '@/lib/constants'
import {
  getFunnel,
  saveActivityLogsNotification,
  upsertContact,
} from '@/lib/queries'

import { ContactUserFormSchema } from '@/lib/types'
import { EditorElement, useEditor } from '@/providers/editor/editor-provider'
import clsx from 'clsx'
import { Trash } from 'lucide-react'
import { useRouter } from 'next/navigation'

import React from 'react'
import { z } from 'zod'

type Props = {
  element: EditorElement
}

const ContactFormComponent = (props: Props) => {
  const { dispatch, state, subaccountId, funnelId, pageDetails } = useEditor()
  const router = useRouter()

  const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
    if (type === null) return
    e.dataTransfer.setData('componentType', type)
  }

  const handleOnClickBody = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({
      type: 'CHANGE_CLICKED_ELEMENT',
      payload: {
        elementDetails: props.element,
      },
    })
  }

  const styles = props.element.styles

  const goToNextPage = async () => {
    if (!state.editor.liveMode) return
    const funnelPages = await getFunnel(funnelId)
    if (!funnelPages || !pageDetails) return
    if (funnelPages.FunnelPages.length > pageDetails.order + 1) {
      const nextPage = funnelPages.FunnelPages.find(
        (page) => page.order === pageDetails.order + 1
      )
      if (!nextPage) return
      router.replace(
        `${process.env.NEXT_PUBLIC_SCHEME}${funnelPages.subDomainName}.${process.env.NEXT_PUBLIC_DOMAIN}/${nextPage.pathName}`
      )
    }
  }

  const handleDeleteElement = () => {
    dispatch({
      type: 'DELETE_ELEMENT',
      payload: { elementDetails: props.element },
    })
  }

  const onFormSubmit = async (
    values: z.infer<typeof ContactUserFormSchema>
  ) => {
    if (!state.editor.liveMode) return

    try {
      const response = await upsertContact({
        ...values,
        subAccountId: subaccountId,
      })
      //WIP Call trigger endpoint
      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `A New contact signed up | ${response?.name}`,
        subaccountId: subaccountId,
      })
      toast({
        title: 'Success',
        description: 'Successfully Saved your info',
      })
      await goToNextPage()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed',
        description: 'Could not save your information',
      })
    }
  }

  return (
    <div
      style={styles}
      draggable
      onDragStart={(e) => handleDragStart(e, 'contactForm')}
      onClick={handleOnClickBody}
      className={clsx(
        'builder-element-base my-2 flex w-full items-center justify-center px-3 py-3',
        {
          '!border-primary !ring-2 !ring-primary/20':
            state.editor.selectedElement.id === props.element.id &&
            !state.editor.liveMode,
          'hover:border-primary/35':
            state.editor.selectedElement.id !== props.element.id &&
            !state.editor.liveMode,
          '!border-transparent !ring-0': state.editor.liveMode,
        }
      )}
    >
      {state.editor.selectedElement.id === props.element.id &&
        !state.editor.liveMode && (
          <Badge className="builder-element-badge">
            {state.editor.selectedElement.name}
          </Badge>
        )}
      <div className="w-full rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm">
        <ContactForm
          subTitle="Contact Us"
          title="Want a free quote? We can help you"
          apiCall={onFormSubmit}
        />
      </div>
      {state.editor.selectedElement.id === props.element.id &&
        !state.editor.liveMode && (
          <div className="builder-element-action">
            <Trash
              className="cursor-pointer"
              size={16}
              onClick={handleDeleteElement}
            />
          </div>
        )}
    </div>
  )
}

export default ContactFormComponent
