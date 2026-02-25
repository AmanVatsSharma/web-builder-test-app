import { EditorBtns } from '@/lib/constants'
import React from 'react'

type Props = {}

const ContainerPlaceholder = (props: Props) => {
  const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
    if (type === null) return
    e.dataTransfer.setData('componentType', type)
  }
  return (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, 'container')}
      className="flex h-12 w-12 flex-row gap-1 rounded-lg border border-border/70 bg-card/80 p-2 shadow-sm transition-colors group-hover:border-primary/40"
    >
      <div className="h-full w-full rounded-sm border border-dashed border-muted-foreground/40 bg-muted/60" />
    </div>
  )
}

export default ContainerPlaceholder
