import React, { useEffect } from 'react'
import { useHistory } from '../contexts/HistoryContext'
import { useLayers } from '../contexts/LayerContext'

const KeyboardShortcuts = () => {
  const { undo, redo, canUndo, canRedo } = useHistory()
  const { setLayers, isUndoRedoRef } = useLayers()

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z 或 Cmd+Z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) {
          const previousState = undo()
          if (previousState) {
            isUndoRedoRef.current = true
            setLayers(JSON.parse(JSON.stringify(previousState)))
            // 重置标记
            setTimeout(() => {
              isUndoRedoRef.current = false
            }, 0)
          }
        }
      }
      // Ctrl+Y 或 Ctrl+Shift+Z 或 Cmd+Shift+Z 重做
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        if (canRedo) {
          const nextState = redo()
          if (nextState) {
            isUndoRedoRef.current = true
            setLayers(JSON.parse(JSON.stringify(nextState)))
            // 重置标记
            setTimeout(() => {
              isUndoRedoRef.current = false
            }, 0)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, canUndo, canRedo, setLayers, isUndoRedoRef])

  return null
}

export default KeyboardShortcuts
