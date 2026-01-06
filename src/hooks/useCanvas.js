import { useState, useCallback, useRef, useEffect } from 'react'
import { canvasUtils } from '../utils/canvasUtils'
import { useHistory } from '../contexts/HistoryContext'

export const useCanvas = (canvasRef, containerRef, mapImage, layers, currentLayer, currentLayerIndex, currentTool, toolOptions, updateLayer, setTextInput, setBackgroundColor) => {
  const { pushHistoryImmediate } = useHistory()
  const [scale, setScale] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)

  const isDrawingRef = useRef(false)
  const isPanningRef = useRef(false)
  const isRightClickPanningRef = useRef(false) // 右键拖拽标志
  const lastPosRef = useRef({ x: 0, y: 0 })
  const startPanPosRef = useRef({ x: 0, y: 0 })
  const currentDrawingRef = useRef(null)
  const textInputRef = useRef(null) // 文字输入框引用
  const isMovingCoordinateRef = useRef(false) // 是否正在移动坐标点
  const movingCoordinateIdRef = useRef(null) // 正在移动的坐标点 ID
  const lastClickTimeRef = useRef(0) // 用于检测双击
  const lastClickedCoordinateIdRef = useRef(null) // 上次点击的坐标点 ID

  // 图层缓存：存储每个图层的离屏画布
  const layerCacheRef = useRef(new Map()) // Map<layerId, { canvas, version }>
  const currentLayerVersionRef = useRef(new Map()) // Map<layerId, version>
  // 绘制前的缓存：存储绘制操作开始前的图层状态（用于实时绘制优化）
  const beforeDrawCacheRef = useRef(new Map()) // Map<layerId, { canvas, drawingsCount }>
  // layers 内容的哈希，用于检测实际内容变化
  const layersHashRef = useRef('')
  // 使用 requestAnimationFrame 优化绘制
  const rafIdRef = useRef(null)
  const pendingDrawRef = useRef(false)

  const getCanvasCoordinates = useCallback((e) => {
    if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 }
    const container = containerRef.current
    const canvas = canvasRef.current
    const containerRect = container.getBoundingClientRect()
    
    // 获取鼠标在容器中的位置
    const mouseX = e.clientX - containerRect.left
    const mouseY = e.clientY - containerRect.top
    
    // 计算画布中心在容器中的位置
    const centerX = containerRect.width / 2
    const centerY = containerRect.height / 2
    
    // 计算画布左上角在容器中的位置（考虑偏移和缩放）
    const canvasLeft = centerX + offsetX - (canvas.width * scale) / 2
    const canvasTop = centerY + offsetY - (canvas.height * scale) / 2
    
    // 计算鼠标在画布坐标系中的位置（考虑缩放）
    const x = (mouseX - canvasLeft) / scale
    const y = (mouseY - canvasTop) / scale
    
    // 确保坐标在画布范围内
    return { 
      x: Math.max(0, Math.min(canvas.width, x)), 
      y: Math.max(0, Math.min(canvas.height, y)) 
    }
  }, [canvasRef, containerRef, offsetX, offsetY, scale])

  const updateCanvasTransform = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return
    const container = containerRef.current
    const canvas = canvasRef.current
    const rect = container.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const translateX = centerX + offsetX - (canvas.width * scale) / 2
    const translateY = centerY + offsetY - (canvas.height * scale) / 2
    
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`
    canvas.style.transformOrigin = '0 0'
  }, [canvasRef, containerRef, offsetX, offsetY, scale])

  const draw = useCallback((forceImmediate = false) => {
    if (!canvasRef.current || !mapImage) return

    // 如果需要立即绘制（非绘制过程中），跳过 RAF 批处理
    if (forceImmediate && !isDrawingRef.current) {
      // 立即执行绘制，不使用 requestAnimationFrame
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      // 计算 layers 的哈希，检测是否真的需要重绘
      const newLayersHash = layers.map(l =>
        `${l.id}-${l.visible}-${l.drawings?.length || 0}-${l.markers?.length || 0}-${l.texts?.length || 0}`
      ).join('|')

      // 先绘制地图底图
      canvasUtils.drawMap(ctx, mapImage, canvas.width, canvas.height)

      // 更新哈希
      layersHashRef.current = newLayersHash

      // 绘制所有可见图层
      if (layers && layers.length > 0) {
        // 清理已被删除的图层缓存
        const currentLayerIds = new Set(layers.map(l => l.id))
        for (const [cachedLayerId] of layerCacheRef.current) {
          if (!currentLayerIds.has(cachedLayerId)) {
            layerCacheRef.current.delete(cachedLayerId)
            currentLayerVersionRef.current.delete(cachedLayerId)
          }
        }

        for (let i = layers.length - 1; i >= 0; i--) {
          const layer = layers[i]
          if (!layer.visible) continue

          const layerId = layer.id
          const drawingsCount = layer.drawings ? layer.drawings.length : 0
          const markersCount = layer.markers ? layer.markers.length : 0
          const textsCount = layer.texts ? layer.texts.length : 0
          const layerVersion = `${drawingsCount}-${markersCount}-${textsCount}-${layer.visible}`

          let layerCanvas = layerCacheRef.current.get(layerId)

          // 使用缓存
          if (!layerCanvas || currentLayerVersionRef.current.get(layerId) !== layerVersion) {
            // 创建新的离屏画布
            layerCanvas = document.createElement('canvas')
            layerCanvas.width = canvas.width
            layerCanvas.height = canvas.height
            const layerCtx = layerCanvas.getContext('2d')

            // 绘制图层内容到离屏画布
            canvasUtils.drawLayer(layerCtx, layer, canvas.width, canvas.height)

            // 更新缓存
            layerCacheRef.current.set(layerId, layerCanvas)
            currentLayerVersionRef.current.set(layerId, layerVersion)
          }

          // 将缓存的画布绘制到主画布
          ctx.drawImage(layerCanvas, 0, 0)
        }
      }

      updateCanvasTransform()
      return
    }

    // 使用 requestAnimationFrame 批量处理绘制请求
    if (rafIdRef.current) {
      pendingDrawRef.current = true
      return
    }

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null
      pendingDrawRef.current = false

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      // 计算 layers 的哈希，检测是否真的需要重绘
      const newLayersHash = layers.map(l =>
        `${l.id}-${l.visible}-${l.drawings?.length || 0}-${l.markers?.length || 0}-${l.texts?.length || 0}`
      ).join('|')

      // 如果哈希没变且不在绘制过程中，跳过重绘（缩放/平移时的优化）
      const shouldSkipDraw = layersHashRef.current === newLayersHash && !isDrawingRef.current

      // 先绘制地图底图
      canvasUtils.drawMap(ctx, mapImage, canvas.width, canvas.height)

      // 如果跳过重绘，只更新 transform
      if (shouldSkipDraw) {
        updateCanvasTransform()
        return
      }

      // 更新哈希（只有在真正重绘时才更新）
      layersHashRef.current = newLayersHash

      // 绘制所有可见图层（使用缓存优化性能）
      if (layers && layers.length > 0) {
        // 清理已被删除的图层缓存
        const currentLayerIds = new Set(layers.map(l => l.id))
        for (const [cachedLayerId] of layerCacheRef.current) {
          if (!currentLayerIds.has(cachedLayerId)) {
            layerCacheRef.current.delete(cachedLayerId)
            currentLayerVersionRef.current.delete(cachedLayerId)
          }
        }

        for (let i = layers.length - 1; i >= 0; i--) {
          const layer = layers[i]
          if (!layer.visible) continue

          const layerId = layer.id
          const isCurrentLayer = i === currentLayerIndex

          // 计算图层版本：对于非当前图层，使用内容数量检测变化
          // 对于当前图层，只在非绘制状态下才使用缓存
          const drawingsCount = layer.drawings ? layer.drawings.length : 0
          const markersCount = layer.markers ? layer.markers.length : 0
          const textsCount = layer.texts ? layer.texts.length : 0
          const layerVersion = `${drawingsCount}-${markersCount}-${textsCount}-${layer.visible}`

          let layerCanvas = layerCacheRef.current.get(layerId)

          // 如果是当前图层且正在绘制，使用优化的实时绘制策略
          const isCurrentlyDrawing = isCurrentLayer && isDrawingRef.current

          if (isCurrentlyDrawing) {
            // 关键优化：直接使用缓存，只绘制新增的点
            const beforeDrawCache = beforeDrawCacheRef.current.get(layerId)

            if (beforeDrawCache && beforeDrawCache.drawingsCount === (layer.drawings?.length || 0) - 1) {
              // 使用绘制前的缓存（已经包含了除当前绘制外的所有内容）
              ctx.drawImage(beforeDrawCache.canvas, 0, 0)

              // 只绘制当前正在绘制的笔画
              if (layer.drawings && layer.drawings.length > 0) {
                const lastDrawing = layer.drawings[layer.drawings.length - 1]
                canvasUtils.drawSingleDrawing(ctx, lastDrawing)
              }
            } else {
              // 缓存失效，重新生成（只做一次）
              const layerWithoutLast = {
                ...layer,
                drawings: layer.drawings ? layer.drawings.slice(0, -1) : []
              }
              const tempCanvas = document.createElement('canvas')
              tempCanvas.width = canvas.width
              tempCanvas.height = canvas.height
              const tempCtx = tempCanvas.getContext('2d')
              canvasUtils.drawLayer(tempCtx, layerWithoutLast, canvas.width, canvas.height)
              ctx.drawImage(tempCanvas, 0, 0)

              // 更新绘制前缓存（避免下次再重新生成）
              beforeDrawCacheRef.current.set(layerId, {
                canvas: tempCanvas,
                drawingsCount: layer.drawings ? layer.drawings.length - 1 : 0
              })

              // 绘制当前笔画
              if (layer.drawings && layer.drawings.length > 0) {
                const lastDrawing = layer.drawings[layer.drawings.length - 1]
                canvasUtils.drawSingleDrawing(ctx, lastDrawing)
              }
            }

            // 绘制标记点和文字（这些不会频繁变化，直接绘制）
            if (layer.markers && layer.markers.length > 0) {
              layer.markers.forEach(marker => {
                ctx.fillStyle = marker.color
                ctx.beginPath()
                ctx.arc(marker.x, marker.y, marker.size / 2, 0, Math.PI * 2)
                ctx.fill()
                ctx.strokeStyle = 'white'
                ctx.lineWidth = 2
                ctx.stroke()
              })
            }

            if (layer.texts && layer.texts.length > 0) {
              layer.texts.forEach(text => {
                if (!text.text) return

                ctx.fillStyle = text.color
                ctx.font = `${text.fontSize}px Arial`
                ctx.textBaseline = 'bottom'
                ctx.fillText(text.text, text.x, text.y)
              })
            }
          } else {
            // 非绘制状态：使用缓存
            if (!layerCanvas || currentLayerVersionRef.current.get(layerId) !== layerVersion) {
              // 创建新的离屏画布
              layerCanvas = document.createElement('canvas')
              layerCanvas.width = canvas.width
              layerCanvas.height = canvas.height
              const layerCtx = layerCanvas.getContext('2d')

              // 绘制图层内容到离屏画布
              canvasUtils.drawLayer(layerCtx, layer, canvas.width, canvas.height)

              // 更新缓存
              layerCacheRef.current.set(layerId, layerCanvas)
              currentLayerVersionRef.current.set(layerId, layerVersion)
            }

            // 将缓存的画布绘制到主画布
            ctx.drawImage(layerCanvas, 0, 0)
          }
        }
      }

      updateCanvasTransform()
    })
  }, [canvasRef, mapImage, layers, currentLayerIndex, currentTool, toolOptions, updateCanvasTransform])

  // 监听图层颜色变化，清除缓存并重绘
  useEffect(() => {
    const handleLayerColorChanged = () => {
      // 清除所有图层缓存
      layerCacheRef.current.clear()
      currentLayerVersionRef.current.clear()
      beforeDrawCacheRef.current.clear()
      // 使用 RAF 优化重绘，避免在颜色选择过程中卡顿
      requestAnimationFrame(() => {
        draw(true)
      })
    }

    window.addEventListener('layerColorChanged', handleLayerColorChanged)
    return () => window.removeEventListener('layerColorChanged', handleLayerColorChanged)
  }, [draw])

  // 监听图层透明度变化，清除缓存并重绘
  useEffect(() => {
    const handleLayerOpacityChanged = () => {
      // 清除所有图层缓存
      layerCacheRef.current.clear()
      currentLayerVersionRef.current.clear()
      beforeDrawCacheRef.current.clear()
      // 使用 RAF 优化重绘
      requestAnimationFrame(() => {
        draw(true)
      })
    }

    window.addEventListener('layerOpacityChanged', handleLayerOpacityChanged)
    return () => window.removeEventListener('layerOpacityChanged', handleLayerOpacityChanged)
  }, [draw])

  const handleMouseDown = useCallback((e) => {
    if (!mapImage) return

    // 如果没有图层，不执行操作（除了右键拖拽）
    if (currentLayerIndex < 0 || !currentLayer) {
      console.warn('没有可用的图层，请先创建图层')
      // 右键：允许拖拽地图，但阻止右键菜单
      if (e.button === 2) {
        e.preventDefault()
        e.stopPropagation()
        isRightClickPanningRef.current = true
        startPanPosRef.current = { x: e.clientX - offsetX, y: e.clientY - offsetY }
        return false
      }
      return
    }

    const coords = getCanvasCoordinates(e)
    lastPosRef.current = coords

    if (currentTool === 'pan') {
      isPanningRef.current = true
      startPanPosRef.current = { x: e.clientX - offsetX, y: e.clientY - offsetY }
    } else if (currentTool === 'pen' || currentTool === 'eraser') {
      isDrawingRef.current = true
      const newDrawing = {
        type: currentTool,
        color: currentTool === 'pen' ? currentLayer.color : null,
        size: currentTool === 'pen' ? toolOptions.pen.size : toolOptions.eraser.size,
        points: [{ x: coords.x, y: coords.y }]
      }
      const updatedDrawings = [...(currentLayer.drawings || []), newDrawing]
      updateLayer(currentLayerIndex, {
        drawings: updatedDrawings
      })
      currentDrawingRef.current = newDrawing
    }

    // 其他工具的右键处理
    if (e.button === 2) {
      e.preventDefault()
      e.stopPropagation()
      isRightClickPanningRef.current = true
      startPanPosRef.current = { x: e.clientX - offsetX, y: e.clientY - offsetY }
      return false
    }
  }, [mapImage, currentLayer, currentLayerIndex, currentTool, toolOptions, getCanvasCoordinates, updateLayer, draw, canvasRef, setTextInput])
  const handleMouseMove = useCallback((e) => {
    if (!mapImage) return

    // 右键拖拽地图
    if (isRightClickPanningRef.current) {
      // 平移操作：直接更新 transform，不重绘
      const newOffsetX = e.clientX - startPanPosRef.current.x
      const newOffsetY = e.clientY - startPanPosRef.current.y
      setOffsetX(newOffsetX)
      setOffsetY(newOffsetY)
      // 直接操作 DOM，避免触发重绘
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        const translateX = centerX + newOffsetX - (canvasRef.current.width * scale) / 2
        const translateY = centerY + newOffsetY - (canvasRef.current.height * scale) / 2
        canvasRef.current.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`
      }
      return
    }

    const coords = getCanvasCoordinates(e)
    
    if (currentTool === 'pan' && isPanningRef.current) {
      // 平移操作：直接更新 transform，不重绘
      const newOffsetX = e.clientX - startPanPosRef.current.x
      const newOffsetY = e.clientY - startPanPosRef.current.y
      setOffsetX(newOffsetX)
      setOffsetY(newOffsetY)
      // 直接操作 DOM，避免触发重绘
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        const translateX = centerX + newOffsetX - (canvasRef.current.width * scale) / 2
        const translateY = centerY + newOffsetY - (canvasRef.current.height * scale) / 2
        canvasRef.current.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`
      }
    } else if (isDrawingRef.current && (currentTool === 'pen' || currentTool === 'eraser')) {
      if (currentDrawingRef.current && currentLayer) {
        // 更新当前绘制的点
        currentDrawingRef.current.points.push({ x: coords.x, y: coords.y })

        // 更新图层中的绘制路径（创建新数组避免直接修改）
        const drawings = [...(currentLayer.drawings || [])]
        if (drawings.length > 0) {
          // 创建新的绘制对象，包含更新的点
          drawings[drawings.length - 1] = {
            ...currentDrawingRef.current,
            points: [...currentDrawingRef.current.points]
          }
          updateLayer(currentLayerIndex, { drawings })
        }
        draw()
      }
    }

    lastPosRef.current = coords
  }, [mapImage, currentTool, currentLayer, currentLayerIndex, getCanvasCoordinates, scale, updateLayer, draw])

  const handleMouseUp = useCallback((e) => {
    // 右键拖拽结束
    if (e.button === 2) {
      isRightClickPanningRef.current = false
      // 不要 return，继续处理其他状态清理
    }

    isDrawingRef.current = false
    isPanningRef.current = false
    currentDrawingRef.current = null

    // 绘制结束后保存历史记录并清除缓存
    if (currentLayer && (currentTool === 'pen' || currentTool === 'eraser')) {
      // 保存当前状态到历史记录
      pushHistoryImmediate(layers)
      // 清除缓存
      layerCacheRef.current.delete(currentLayer.id)
      currentLayerVersionRef.current.delete(currentLayer.id)
    }
  }, [currentTool, currentLayer, currentLayerIndex, toolOptions, getCanvasCoordinates, updateLayer, draw, layers, pushHistoryImmediate])

  const handleWheel = useCallback((e) => {
    if (!mapImage || !canvasRef.current || !containerRef.current) return
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const container = containerRef.current
    const canvas = canvasRef.current
    const containerRect = container.getBoundingClientRect()
    
    // 获取鼠标在容器中的位置
    const mouseX = e.clientX - containerRect.left
    const mouseY = e.clientY - containerRect.top
    
    // 计算画布中心在容器中的位置
    const centerX = containerRect.width / 2
    const centerY = containerRect.height / 2
    
    // 计算画布左上角在容器中的位置（当前状态）
    const canvasLeft = centerX + offsetX - (canvas.width * scale) / 2
    const canvasTop = centerY + offsetY - (canvas.height * scale) / 2
    
    // 计算鼠标在画布坐标系中的位置（世界坐标）
    const worldX = (mouseX - canvasLeft) / scale
    const worldY = (mouseY - canvasTop) / scale
    
    // 计算新的缩放比例
    const newScale = Math.max(0.1, Math.min(5, scale * delta))
    
    // 计算新的画布左上角位置，使鼠标位置的世界坐标保持不变
    const newCanvasLeft = mouseX - worldX * newScale
    const newCanvasTop = mouseY - worldY * newScale
    
    // 计算新的偏移量
    const newOffsetX = newCanvasLeft - centerX + (canvas.width * newScale) / 2
    const newOffsetY = newCanvasTop - centerY + (canvas.height * newScale) / 2
    
    setScale(newScale)
    setOffsetX(newOffsetX)
    setOffsetY(newOffsetY)
    updateCanvasTransform()
  }, [mapImage, canvasRef, containerRef, offsetX, offsetY, scale, updateCanvasTransform])

  const zoomIn = useCallback(() => {
    if (!mapImage || !canvasRef.current || !containerRef.current) return
    
    const container = containerRef.current
    const canvas = canvasRef.current
    const containerRect = container.getBoundingClientRect()
    
    // 以容器中心为缩放中心
    const centerX = containerRect.width / 2
    const centerY = containerRect.height / 2
    
    // 计算容器中心在画布坐标系中的位置（世界坐标）
    const canvasLeft = centerX + offsetX - (canvas.width * scale) / 2
    const canvasTop = centerY + offsetY - (canvas.height * scale) / 2
    const worldX = (centerX - canvasLeft) / scale
    const worldY = (centerY - canvasTop) / scale
    
    // 计算新的缩放比例
    const newScale = Math.min(5, scale * 1.2)
    
    // 计算新的画布左上角位置，使容器中心的世界坐标保持不变
    const newCanvasLeft = centerX - worldX * newScale
    const newCanvasTop = centerY - worldY * newScale
    
    // 计算新的偏移量
    const newOffsetX = newCanvasLeft - centerX + (canvas.width * newScale) / 2
    const newOffsetY = newCanvasTop - centerY + (canvas.height * newScale) / 2
    
    setScale(newScale)
    setOffsetX(newOffsetX)
    setOffsetY(newOffsetY)
    updateCanvasTransform()
  }, [mapImage, canvasRef, containerRef, offsetX, offsetY, scale, updateCanvasTransform])

  const zoomOut = useCallback(() => {
    if (!mapImage || !canvasRef.current || !containerRef.current) return
    
    const container = containerRef.current
    const canvas = canvasRef.current
    const containerRect = container.getBoundingClientRect()
    
    // 以容器中心为缩放中心
    const centerX = containerRect.width / 2
    const centerY = containerRect.height / 2
    
    // 计算容器中心在画布坐标系中的位置（世界坐标）
    const canvasLeft = centerX + offsetX - (canvas.width * scale) / 2
    const canvasTop = centerY + offsetY - (canvas.height * scale) / 2
    const worldX = (centerX - canvasLeft) / scale
    const worldY = (centerY - canvasTop) / scale
    
    // 计算新的缩放比例
    const newScale = Math.max(0.1, scale / 1.2)
    
    // 计算新的画布左上角位置，使容器中心的世界坐标保持不变
    const newCanvasLeft = centerX - worldX * newScale
    const newCanvasTop = centerY - worldY * newScale
    
    // 计算新的偏移量
    const newOffsetX = newCanvasLeft - centerX + (canvas.width * newScale) / 2
    const newOffsetY = newCanvasTop - centerY + (canvas.height * newScale) / 2
    
    setScale(newScale)
    setOffsetX(newOffsetX)
    setOffsetY(newOffsetY)
    updateCanvasTransform()
  }, [mapImage, canvasRef, containerRef, offsetX, offsetY, scale, updateCanvasTransform])

  const resetZoom = useCallback(() => {
    if (!mapImage) return
    setScale(1)
    setOffsetX(0)
    setOffsetY(0)
    updateCanvasTransform()
  }, [mapImage, updateCanvasTransform])

  const handleTouchStart = useCallback((e) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      handleMouseDown(mouseEvent)
    }
  }, [handleMouseDown])

  const handleTouchMove = useCallback((e) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      handleMouseMove(mouseEvent)
    }
  }, [handleMouseMove])

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault()
    handleMouseUp()
  }, [handleMouseUp])

  return {
    scale,
    offsetX,
    offsetY,
    setOffsetX,
    setOffsetY,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    draw,
    textInputRef
  }
}
