import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useHistory } from './HistoryContext'

const LayerContext = createContext()

export const useLayers = () => {
  const context = useContext(LayerContext)
  if (!context) {
    throw new Error('useLayers must be used within a LayerProvider')
  }
  return context
}

export const LayerProvider = ({ children }) => {
  const [layers, setLayers] = useState([])
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0)
  const { pushHistory, clearHistory } = useHistory()
  const isUndoRedoRef = useRef(false) // 标记是否是撤销/重做操作

  // 监听图层加载事件（从本地存储加载）
  useEffect(() => {
    const handleLayersLoaded = (e) => {
      if (e.detail && e.detail.layers && e.detail.layers.length > 0) {
        // 为没有颜色或透明度的图层添加默认值
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e']
        const layersWithDefaults = e.detail.layers.map((layer, index) => ({
          ...layer,
          color: layer.color || colors[index % colors.length],
          opacity: layer.opacity !== undefined ? layer.opacity : 1.0
        }))
        setLayers(layersWithDefaults)
        setCurrentLayerIndex(0)
      }
    }

    window.addEventListener('layersLoaded', handleLayersLoaded)
    return () => window.removeEventListener('layersLoaded', handleLayersLoaded)
  }, [])

  const createLayer = useCallback((name, color = null) => {
    let newLayerId
    setLayers(prev => {
      // 如果没有指定颜色，随机生成一个颜色
      const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]

      const newLayer = {
        id: Date.now(),
        name: name || `图层 ${prev.length + 1}`,
        visible: true,
        color: color || randomColor,
        opacity: 1.0, // 添加透明度属性
        markers: [],
        drawings: [],
        texts: []
      }
      newLayerId = newLayer.id
      // 新图层添加到数组开头，索引为0
      setCurrentLayerIndex(0)
      return [newLayer, ...prev]
    })
    return newLayerId
  }, [])

  const deleteLayer = useCallback((index) => {
    if (layers.length <= 1) {
      throw new Error('至少需要保留一个图层')
    }
    setLayers(prev => {
      const newLayers = prev.filter((_, i) => i !== index)
      // 如果删除的是当前图层，或者删除后索引超出范围，调整当前图层索引
      if (index === currentLayerIndex || currentLayerIndex >= newLayers.length) {
        // 优先选择删除位置附近的图层，如果删除的是第一个，选择新的第一个（索引0）
        // 如果删除的是其他位置，选择删除位置（因为后面的图层索引都减1了）
        setCurrentLayerIndex(Math.min(index, newLayers.length - 1))
      } else if (index < currentLayerIndex) {
        // 如果删除的图层在当前图层之前，当前图层索引需要减1
        setCurrentLayerIndex(currentLayerIndex - 1)
      }
      return newLayers
    })
  }, [layers.length, currentLayerIndex])

  const toggleLayerVisibility = useCallback((index) => {
    setLayers(prev => prev.map((layer, i) => 
      i === index ? { ...layer, visible: !layer.visible } : layer
    ))
  }, [])

  const setCurrentLayer = useCallback((index) => {
    setCurrentLayerIndex(index)
  }, [])

  const updateLayer = useCallback((index, updates) => {
    setLayers(prev => prev.map((layer, i) =>
      i === index ? { ...layer, ...updates } : layer
    ))
  }, [])

  const renameLayer = useCallback((index, newName) => {
    if (!newName || newName.trim() === '') {
      throw new Error('图层名称不能为空')
    }
    setLayers(prev => prev.map((layer, i) =>
      i === index ? { ...layer, name: newName.trim() } : layer
    ))
  }, [])

  const updateLayerColor = useCallback((index, color) => {
    setLayers(prev => prev.map((layer, i) =>
      i === index ? { ...layer, color } : layer
    ))
    // 触发重绘事件，清除缓存
    window.dispatchEvent(new CustomEvent('layerColorChanged'))
  }, [])

  const updateLayerOpacity = useCallback((index, opacity) => {
    setLayers(prev => prev.map((layer, i) =>
      i === index ? { ...layer, opacity } : layer
    ))
    // 触发重绘事件，清除缓存
    window.dispatchEvent(new CustomEvent('layerOpacityChanged'))
  }, [])

  const getCurrentLayer = useCallback(() => {
    return layers[currentLayerIndex] || null
  }, [layers, currentLayerIndex])

  const moveLayer = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return

    setLayers(prev => {
      const newLayers = [...prev]
      const [movedLayer] = newLayers.splice(fromIndex, 1)
      newLayers.splice(toIndex, 0, movedLayer)

      // 调整当前图层索引
      if (currentLayerIndex === fromIndex) {
        setCurrentLayerIndex(toIndex)
      } else if (fromIndex < currentLayerIndex && toIndex >= currentLayerIndex) {
        setCurrentLayerIndex(currentLayerIndex - 1)
      } else if (fromIndex > currentLayerIndex && toIndex <= currentLayerIndex) {
        setCurrentLayerIndex(currentLayerIndex + 1)
      }

      return newLayers
    })
    // 触发重绘事件，清除缓存
    window.dispatchEvent(new CustomEvent('layerOrderChanged'))
  }, [currentLayerIndex])

  const value = {
    layers,
    currentLayerIndex,
    currentLayer: getCurrentLayer(),
    createLayer,
    deleteLayer,
    toggleLayerVisibility,
    setCurrentLayer,
    updateLayer,
    renameLayer,
    updateLayerColor,
    updateLayerOpacity,
    getCurrentLayer,
    moveLayer,
    setLayers,
    isUndoRedoRef
  }

  return (
    <LayerContext.Provider value={value}>
      {children}
    </LayerContext.Provider>
  )
}
