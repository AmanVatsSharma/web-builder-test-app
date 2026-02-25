import { EditorBtns } from '@/lib/constants'
import { Link2Icon } from 'lucide-react'
import React from 'react'

type Props = {}

const LinkPlaceholder = (props: Props) => {
  const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
    if (type === null) return
    e.dataTransfer.setData('componentType', type)
  }
  return (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, 'link')}
      className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/70 bg-card/80 shadow-sm transition-colors group-hover:border-primary/40"
    >
      <Link2Icon
        size={24}
        className="text-muted-foreground"
      />
    </div>
  )
}

export default LinkPlaceholder
