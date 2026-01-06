import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const HistoryContext = createContext()

export const useHistory = () => {
  const context = useContext(HistoryContext)
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider')
  }
  return context
}

export const HistoryProvider = ({ children }) => {
  // 历史记录栈，每个元素包含所有图层的快照
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const saveTimeoutRef = useRef(null) // 防抖定时器
  const historyRef = useRef([]) // 用于在回调中访问最新的 history
  const historyIndexRef = useRef(-1) // 用于在回调中访问最新的 historyIndex

  // 保持 ref 同步
  useEffect(() => {
    historyRef.current = history
    historyIndexRef.current = historyIndex
  }, [history, historyIndex])

  // 添加到历史记录（带防抖）
  const pushHistory = useCallback((layers, immediate = false) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    const save = () => {
      setHistory(prev => {
        const currentIndex = historyIndexRef.current
        const newHistory = prev.slice(0, currentIndex + 1)
        // 深拷贝图层状态
        const layersSnapshot = JSON.parse(JSON.stringify(layers))
        return [...newHistory, layersSnapshot]
      })
      setHistoryIndex(prev => prev + 1)
    }

    if (immediate) {
      save()
    } else {
      saveTimeoutRef.current = setTimeout(save, 500) // 500ms 防抖
    }
  }, [])

  // 立即保存到历史记录（用于绘制完成等关键时刻）
  const pushHistoryImmediate = useCallback((layers) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    pushHistory(layers, true)
  }, [pushHistory])

  // 撤销
  const undo = useCallback(() => {
    const currentIndex = historyIndexRef.current
    const currentHistory = historyRef.current

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setHistoryIndex(newIndex)
      return currentHistory[newIndex]
    }
    return null
  }, [])

  // 重做
  const redo = useCallback(() => {
    const currentIndex = historyIndexRef.current
    const currentHistory = historyRef.current

    if (currentIndex < currentHistory.length - 1) {
      const newIndex = currentIndex + 1
      setHistoryIndex(newIndex)
      return currentHistory[newIndex]
    }
    return null
  }, [])

  // 清空历史
  const clearHistory = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    setHistory([])
    setHistoryIndex(-1)
  }, [])

  // 检查是否可以撤销/重做
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const value = {
    history,
    historyIndex,
    pushHistory,
    pushHistoryImmediate,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo
  }

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  )
}
