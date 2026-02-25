import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { EditorBtns } from '@/lib/constants'
import React from 'react'
import TextPlaceholder from './text-placeholder'
import ContainerPlaceholder from './container-placeholder'
import VideoPlaceholder from './video-placeholder'
import TwoColumnsPlaceholder from './two-columns-placeholder'
import LinkPlaceholder from './link-placeholder'
import ContactFormComponentPlaceholder from './contact-form-placeholder'
import CheckoutPlaceholder from './checkout-placeholder'

type Props = {}

const ComponentsTab = (props: Props) => {
  const elements: {
    Component: React.ReactNode
    label: string
    id: EditorBtns
    group: 'layout' | 'elements'
  }[] = [
    {
      Component: <TextPlaceholder />,
      label: 'Text',
      id: 'text',
      group: 'elements',
    },
    {
      Component: <ContainerPlaceholder />,
      label: 'Container',
      id: 'container',
      group: 'layout',
    },
    {
      Component: <TwoColumnsPlaceholder />,
      label: '2 Columns',
      id: '2Col',
      group: 'layout',
    },
    {
      Component: <VideoPlaceholder />,
      label: 'Video',
      id: 'video',
      group: 'elements',
    },
    {
      Component: <ContactFormComponentPlaceholder />,
      label: 'Contact',
      id: 'contactForm',
      group: 'elements',
    },
    {
      Component: <CheckoutPlaceholder />,
      label: 'Checkout',
      id: 'paymentForm',
      group: 'elements',
    },
    {
      Component: <LinkPlaceholder />,
      label: 'Link',
      id: 'link',
      group: 'elements',
    },
  ]

  const renderGroup = (group: 'layout' | 'elements') => (
    <div className="grid grid-cols-2 gap-3">
      {elements
        .filter((element) => element.group === group)
        .map((element) => (
          <div
            key={element.id}
            className="group flex flex-col items-center rounded-xl border border-border/70 bg-background/70 px-2 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-background hover:shadow-sm"
          >
            {element.Component}
            <span className="mt-2 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              {element.label}
            </span>
          </div>
        ))}
    </div>
  )

  return (
    <Accordion
      type="multiple"
      className="w-full px-3 pb-14"
      defaultValue={['Layout', 'Elements']}
    >
      <AccordionItem
        value="Layout"
        className="mb-3 rounded-xl border border-border/70 bg-background/70 px-4"
      >
        <AccordionTrigger className="py-4 text-sm font-semibold tracking-tight !no-underline">
          Layout
        </AccordionTrigger>
        <AccordionContent className="pb-4 pt-1">
          {renderGroup('layout')}
        </AccordionContent>
      </AccordionItem>
      <AccordionItem
        value="Elements"
        className="mb-3 rounded-xl border border-border/70 bg-background/70 px-4"
      >
        <AccordionTrigger className="py-4 text-sm font-semibold tracking-tight !no-underline">
          Elements
        </AccordionTrigger>
        <AccordionContent className="pb-4 pt-1">
          {renderGroup('elements')}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default ComponentsTab
