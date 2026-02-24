'use client'
import { Button } from '@/components/ui/button'
import { getFunnelPageDetails } from '@/lib/queries'
import { useEditor } from '@/providers/editor/editor-provider'
import clsx from 'clsx'
import { EyeOff } from 'lucide-react'
import React, { useEffect } from 'react'
import Recursive from './funnel-editor-components/recursive'

type Props = { funnelPageId: string; liveMode?: boolean }

const FunnelEditor = ({ funnelPageId, liveMode }: Props) => {
  const { dispatch, state } = useEditor()

  useEffect(() => {
    if (liveMode) {
      dispatch({
        type: 'TOGGLE_LIVE_MODE',
        payload: { value: true },
      })
    }
  }, [liveMode])

  //CHALLENGE: make this more performant
  useEffect(() => {
    const fetchData = async () => {
      const response = await getFunnelPageDetails(funnelPageId)
      if (!response) return

      dispatch({
        type: 'LOAD_DATA',
        payload: {
          elements: response.content ? JSON.parse(response?.content) : '',
          withLive: !!liveMode,
        },
      })
    }
    fetchData()
  }, [funnelPageId])

  const handleClick = () => {
    dispatch({
      type: 'CHANGE_CLICKED_ELEMENT',
      payload: {},
    })
  }

  const handleUnpreview = () => {
    dispatch({ type: 'TOGGLE_PREVIEW_MODE' })
    dispatch({ type: 'TOGGLE_LIVE_MODE' })
  }
  return (
    <div
      className={clsx(
        'builder-canvas-shell use-automation-zoom-in relative h-full w-full overflow-x-hidden overflow-y-auto transition-all duration-200',
        {
          '!rounded-none !border-0 !shadow-none !bg-transparent':
            state.editor.previewMode === true || state.editor.liveMode === true,
          'p-0': state.editor.previewMode === true || state.editor.liveMode === true,
          'p-4 md:p-6':
            state.editor.previewMode === false && state.editor.liveMode === false,
          'max-w-editor-tablet':
            state.editor.device === 'Tablet' && !state.editor.liveMode,
          'max-w-editor-mobile':
            state.editor.device === 'Mobile' && !state.editor.liveMode,
          'max-w-editor-desktop':
            state.editor.device === 'Desktop' && !state.editor.liveMode,
          'max-w-none': state.editor.liveMode,
        }
      )}
      onClick={handleClick}
    >
      {state.editor.previewMode && state.editor.liveMode && (
        <Button
          variant={'ghost'}
          size={'icon'}
          className="fixed left-4 top-4 z-[100] h-8 w-8 rounded-full border border-border/70 bg-card p-[2px] text-foreground shadow-editor-soft hover:bg-muted"
          onClick={handleUnpreview}
        >
          <EyeOff />
        </Button>
      )}
      {Array.isArray(state.editor.elements) &&
        state.editor.elements.map((childElement) => (
          <Recursive
            key={childElement.id}
            element={childElement}
          />
        ))}
    </div>
  )
}

export default FunnelEditor
