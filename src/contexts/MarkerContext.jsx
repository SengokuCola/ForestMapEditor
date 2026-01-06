import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const MarkerContext = createContext()

export const useMarkers = () => {
  const context = useContext(MarkerContext)
  if (!context) {
    throw new Error('useMarkers must be used within a MarkerProvider')
  }
  return context
}

const STORAGE_KEY = 'map_editor_markers'

export const MarkerProvider = ({ children }) => {
  // 从 localStorage 初始化标记点
  const getInitialMarkers = () => {
    const savedMarkers = localStorage.getItem(STORAGE_KEY)
    if (savedMarkers) {
      try {
        const parsed = JSON.parse(savedMarkers)
        console.log('✓ 从 localStorage 初始化加载了', parsed.length, '个标记点')
        return parsed
      } catch (e) {
        console.error('Failed to load markers:', e)
        return []
      }
    }
    console.log('localStorage 中没有保存的标记点，使用空数组')
    return []
  }

  const [markers, setMarkers] = useState(getInitialMarkers)
  const [selectedMarkerId, setSelectedMarkerId] = useState(null)
  const isUndoRedoRef = useRef(false)
  const isInitializedRef = useRef(false)

  // 标记已初始化
  useEffect(() => {
    isInitializedRef.current = true
  }, [])

  // 保存标记点到 localStorage
  useEffect(() => {
    // 只有在初始化完成后才保存
    if (!isUndoRedoRef.current && isInitializedRef.current) {
      const dataToSave = JSON.stringify(markers)
      localStorage.setItem(STORAGE_KEY, dataToSave)
      console.log('✓ 标记点已保存到 localStorage:', markers.length, '个标记点')
    }
  }, [markers])

  // 添加标记点
  const addMarker = useCallback((marker) => {
    const newMarker = {
      id: Date.now(),
      x: marker.x,
      y: marker.y,
      size: marker.size || 10,
      color: marker.color || '#e74c3c',
      text: marker.text || '',
      fontSize: marker.fontSize || 16,
      textColor: marker.textColor || '#e74c3c'
    }
    setMarkers(prev => [...prev, newMarker])
    return newMarker
  }, [])

  // 删除标记点
  const deleteMarker = useCallback((id) => {
    setMarkers(prev => prev.filter(marker => marker.id !== id))
    if (selectedMarkerId === id) {
      setSelectedMarkerId(null)
    }
  }, [selectedMarkerId])

  // 更新标记点
  const updateMarker = useCallback((id, updates) => {
    setMarkers(prev => prev.map(marker =>
      marker.id === id ? { ...marker, ...updates } : marker
    ))
  }, [])

  // 移动标记点
  const moveMarker = useCallback((id, x, y) => {
    setMarkers(prev => prev.map(marker =>
      marker.id === id ? { ...marker, x, y } : marker
    ))
  }, [])

  // 选中标记点
  const selectMarker = useCallback((id) => {
    setSelectedMarkerId(id)
  }, [])

  // 清空所有标记点
  const clearMarkers = useCallback(() => {
    setMarkers([])
    setSelectedMarkerId(null)
  }, [])

  // 设置所有标记点（用于加载/撤销/重做）
  const setAllMarkers = useCallback((newMarkers) => {
    setMarkers(newMarkers)
  }, [])

  const value = {
    markers,
    selectedMarkerId,
    addMarker,
    deleteMarker,
    updateMarker,
    moveMarker,
    selectMarker,
    clearMarkers,
    setAllMarkers,
    isUndoRedoRef
  }

  return (
    <MarkerContext.Provider value={value}>
      {children}
    </MarkerContext.Provider>
  )
}
