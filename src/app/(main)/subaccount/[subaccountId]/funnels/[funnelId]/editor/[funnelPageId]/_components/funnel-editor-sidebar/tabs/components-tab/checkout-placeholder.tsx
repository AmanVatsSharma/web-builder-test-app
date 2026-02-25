import { EditorBtns } from '@/lib/constants'
import Image from 'next/image'
import React from 'react'

type Props = {}

const CheckoutPlaceholder = (props: Props) => {
  const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
    if (type === null) return
    e.dataTransfer.setData('componentType', type)
  }
  return (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, 'paymentForm')}
      className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/70 bg-card/80 shadow-sm transition-colors group-hover:border-primary/40"
    >
      <Image
        src="/stripelogo.png"
        height={24}
        width={24}
        alt="stripe logo"
        className="object-cover"
      />
    </div>
  )
}

export default CheckoutPlaceholder
