import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

const CoordinateContext = createContext()

export const useCoordinates = () => {
  const context = useContext(CoordinateContext)
  if (!context) {
    throw new Error('useCoordinates must be used within a CoordinateProvider')
  }
  return context
}

export const CoordinateProvider = ({ children }) => {
  const [coordinates, setCoordinates] = useState([]) // 坐标点数组
  const coordinatesRef = useRef([]) // 坐标点 ref，用于高性能访问
  const [renderTrigger, setRenderTrigger] = useState(0) // 渲染触发器
  const isUndoRedoRef = useRef(false) // 标记是否是撤销/重做操作

  // 同步 ref
  React.useEffect(() => {
    coordinatesRef.current = coordinates
  }, [coordinates])

  // 添加坐标点
  const addCoordinate = useCallback((coordinate) => {
    const newCoord = {
      id: Date.now(),
      x: coordinate.x,
      y: coordinate.y,
      size: coordinate.size || 10,
      color: coordinate.color || '#e74c3c',
      text: coordinate.text || null,
      fontSize: coordinate.fontSize || 16,
      textColor: coordinate.textColor || '#e74c3c'
    }
    setCoordinates(prev => [...prev, newCoord])
    coordinatesRef.current = [...coordinatesRef.current, newCoord]
    setRenderTrigger(prev => prev + 1)
  }, [])

  // 删除坐标点
  const deleteCoordinate = useCallback((id) => {
    const filtered = coordinatesRef.current.filter(coord => coord.id !== id)
    setCoordinates(filtered)
    coordinatesRef.current = filtered
    setRenderTrigger(prev => prev + 1)
  }, [])

  // 更新坐标点
  const updateCoordinate = useCallback((id, updates) => {
    const updated = coordinatesRef.current.map(coord =>
      coord.id === id ? { ...coord, ...updates } : coord
    )
    setCoordinates(updated)
    coordinatesRef.current = updated
    setRenderTrigger(prev => prev + 1)
  }, [])

  // 移动坐标点（高性能版本，只更新 ref，不触发状态更新）
  const moveCoordinate = useCallback((id, x, y) => {
    const coord = coordinatesRef.current.find(c => c.id === id)
    if (coord) {
      coord.x = x
      coord.y = y
      setRenderTrigger(prev => prev + 1)
    }
  }, [])

  // 清空所有坐标点
  const clearCoordinates = useCallback(() => {
    setCoordinates([])
    coordinatesRef.current = []
    setRenderTrigger(prev => prev + 1)
  }, [])

  // 设置坐标点（用于加载/撤销/重做）
  const setAllCoordinates = useCallback((coords) => {
    setCoordinates(coords)
    coordinatesRef.current = coords
    setRenderTrigger(prev => prev + 1)
  }, [])

  const value = {
    coordinates,
    coordinatesRef,
    renderTrigger,
    addCoordinate,
    deleteCoordinate,
    updateCoordinate,
    moveCoordinate,
    clearCoordinates,
    setAllCoordinates,
    isUndoRedoRef
  }

  return (
    <CoordinateContext.Provider value={value}>
      {children}
    </CoordinateContext.Provider>
  )
}
