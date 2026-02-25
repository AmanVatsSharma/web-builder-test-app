import { EditorBtns } from '@/lib/constants'
import { TypeIcon } from 'lucide-react'
import React from 'react'

type Props = {}

const TextPlaceholder = (props: Props) => {
  const handleDragState = (e: React.DragEvent, type: EditorBtns) => {
    if (type === null) return
    e.dataTransfer.setData('componentType', type)
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        handleDragState(e, 'text')
      }}
      className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/70 bg-card/80 shadow-sm transition-colors group-hover:border-primary/40"
    >
      <TypeIcon
        size={24}
        className="text-muted-foreground"
      />
    </div>
  )
}

export default TextPlaceholder
