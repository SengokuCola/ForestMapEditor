import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useLayers } from '../contexts/LayerContext'
import { useTool } from '../contexts/ToolContext'
import { useHistory } from '../contexts/HistoryContext'
import { useCoordinates } from '../contexts/CoordinateContext'
import { useMarkers } from '../contexts/MarkerContext'
import { useCanvas } from '../hooks/useCanvas'
import { useCoordinateInteraction } from '../hooks/useCoordinates'
import ZoomControls from './canvas/ZoomControls'
import TextInput from './canvas/TextInput'
import CoordinateInput from './canvas/CoordinateInput'
import CoordinateOverlay from './canvas/CoordinateOverlay'
import MarkerOverlay from './canvas/MarkerOverlay'
import CursorIndicator from './canvas/CursorIndicator'
import '../styles/Canvas.css'

const Canvas = forwardRef(({ mapImage, canvasSize, onImageLoad }, ref) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const { currentLayer, currentLayerIndex, updateLayer, layers } = useLayers()
  const { currentTool, toolOptions, backgroundColor, setBackgroundColor } = useTool()
  const { pushHistoryImmediate } = useHistory()
  const { coordinates, updateCoordinate, deleteCoordinate } = useCoordinates()
  const { addMarker, updateMarker: updateMarkerFromContext, deleteMarker: deleteMarkerFromContext } = useMarkers()
  const [textInput, setTextInput] = useState(null)
  const [coordinateInput, setCoordinateInput] = useState(null)
  // 鼠标位置，用于显示光标指示器 - 必须在所有条件返回之前声明
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showCursor, setShowCursor] = useState(false)

  // 暴露 jumpToMarker 方法
  useImperativeHandle(ref, () => ({
    jumpToMarker: (marker) => {
      if (!canvasRef.current || !containerRef.current) return

      const canvas = canvasRef.current
      const container = containerRef.current
      const rect = container.getBoundingClientRect()

      // 计算新的偏移量，使标记点位于中心
      // 标记点在画布上的位置：marker.x, marker.y
      // 我们希望标记点移动到容器中心
      const newOffsetX = scale * (canvas.width / 2 - marker.x)
      const newOffsetY = scale * (canvas.height / 2 - marker.y)

      setOffsetX(newOffsetX)
      setOffsetY(newOffsetY)

      // 更新 transform
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const translateX = centerX + newOffsetX - (canvas.width * scale) / 2
      const translateY = centerY + newOffsetY - (canvas.height * scale) / 2
      canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`
    }
  }))

  const {
    scale,
    offsetX,
    offsetY,
    setOffsetX,
    setOffsetY,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    handleMouseDown: handleCanvasMouseDown,
    handleMouseMove: handleCanvasMouseMove,
    handleMouseUp: handleCanvasMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    draw,
    textInputRef
  } = useCanvas(canvasRef, containerRef, mapImage, layers, currentLayer, currentLayerIndex, currentTool, toolOptions, updateLayer, setTextInput, setBackgroundColor)

  // 坐标点交互
  const {
    handleMouseDown: handleCoordinateMouseDown,
    handleMouseMove: handleCoordinateMouseMove,
    handleMouseUp: handleCoordinateMouseUp
  } = useCoordinateInteraction(canvasRef, containerRef, currentTool, toolOptions, scale, offsetX, offsetY, setOffsetX, setOffsetY)

  // 监听图片加载事件
  useEffect(() => {
    const handleImageLoaded = (e) => {
      onImageLoad(e.detail.image, e.detail.width, e.detail.height)
    }
    window.addEventListener('imageLoaded', handleImageLoaded)
    return () => window.removeEventListener('imageLoaded', handleImageLoaded)
  }, [onImageLoad])

  // 监听跳转到标记点事件
  useEffect(() => {
    const handleJumpToMarker = (e) => {
      const { marker } = e.detail
      if (!canvasRef.current || !containerRef.current) return

      const canvas = canvasRef.current
      const container = containerRef.current
      const rect = container.getBoundingClientRect()

      // 计算新的偏移量，使标记点位于中心
      // 标记点在画布上的位置：marker.x, marker.y
      // 我们希望标记点移动到容器中心
      const newOffsetX = scale * (canvas.width / 2 - marker.x)
      const newOffsetY = scale * (canvas.height / 2 - marker.y)

      setOffsetX(newOffsetX)
      setOffsetY(newOffsetY)

      // 更新 transform
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const translateX = centerX + newOffsetX - (canvas.width * scale) / 2
      const translateY = centerY + newOffsetY - (canvas.height * scale) / 2
      canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`
    }

    window.addEventListener('jumpToMarker', handleJumpToMarker)
    return () => window.removeEventListener('jumpToMarker', handleJumpToMarker)
  }, [scale, setOffsetX, setOffsetY])

  // 绘制画布 - 当图层、地图、画布尺寸或背景颜色变化时重绘
  useEffect(() => {
    if (mapImage && canvasRef.current && canvasSize.width > 0 && canvasSize.height > 0) {
      // 强制立即绘制，确保内容显示
      draw(true)
    }
  }, [mapImage, layers, canvasSize, draw])

  // 使用原生事件监听器处理 touch 和 wheel 事件（避免 passive listener 问题）
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 处理 wheel 事件（非 passive）
    const wheelHandler = (e) => {
      handleWheel(e)
    }
    container.addEventListener('wheel', wheelHandler, { passive: false })

    // 处理 touch 事件（非 passive）
    const touchStartHandler = (e) => {
      handleTouchStart(e)
    }
    const touchMoveHandler = (e) => {
      handleTouchMove(e)
    }
    const touchEndHandler = (e) => {
      handleTouchEnd(e)
    }
    container.addEventListener('touchstart', touchStartHandler, { passive: false })
    container.addEventListener('touchmove', touchMoveHandler, { passive: false })
    container.addEventListener('touchend', touchEndHandler, { passive: false })

    return () => {
      container.removeEventListener('wheel', wheelHandler)
      container.removeEventListener('touchstart', touchStartHandler)
      container.removeEventListener('touchmove', touchMoveHandler)
      container.removeEventListener('touchend', touchEndHandler)
    }
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd])

  // 鼠标位置，用于显示光标指示器
  const handleMouseMoveForCursor = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      setShowCursor(true)
    }
  }

  const handleMouseLeaveForCursor = () => {
    setShowCursor(false)
  }

  // 提前返回，如果没有地图图片
  if (!mapImage) {
    return (
      <div className="canvas-container">
        <div className="empty-state">
          <h3>请先导入地图图片</h3>
          <p>点击左侧"导入地图图片"按钮开始</p>
        </div>
      </div>
    )
  }

  const handleContextMenu = (e) => {
    // 阻止右键菜单，但允许右键拖拽
    e.preventDefault()
    e.stopPropagation()
    return false
  }

  return (
    <div
      ref={containerRef}
      className={`canvas-container ${currentTool === 'pan' ? 'panning' : ''}`}
      onMouseDown={(e) => {
        // 如果点击的是文字输入框，不处理
        if (e.target.closest('.text-input-container') || e.target.closest('.coordinate-input-container')) {
          return
        }
        // 如果是坐标点工具，使用坐标点处理器
        if (currentTool === 'coordinate') {
          handleCoordinateMouseDown(e, setCoordinateInput)
        } else {
          handleCanvasMouseDown(e)
        }
      }}
      onMouseMove={(e) => {
        // 如果鼠标在输入框内，不处理画布的鼠标移动事件
        if (e.target.closest('.text-input-container') || e.target.closest('.coordinate-input-container')) {
          return
        }
        handleMouseMoveForCursor(e)
        // 如果是坐标点工具，使用坐标点处理器
        if (currentTool === 'coordinate') {
          handleCoordinateMouseMove(e)
        } else {
          handleCanvasMouseMove(e)
        }
      }}
      onMouseUp={(e) => {
        handleCanvasMouseUp(e)
        handleCoordinateMouseUp(e)
      }}
      onMouseLeave={(e) => {
        handleMouseLeaveForCursor()
        // 鼠标离开时也触发 mouseUp，确保所有操作结束
        handleCanvasMouseUp(e)
        handleCoordinateMouseUp(e)
      }}
      onContextMenu={handleContextMenu}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          return false
        }}
      />
      {/* 坐标点覆盖层 */}
      <CoordinateOverlay
        canvasRef={canvasRef}
        containerRef={containerRef}
        scale={scale}
        offsetX={offsetX}
        offsetY={offsetY}
      />
      {/* 标记点覆盖层 */}
      <MarkerOverlay
        canvasRef={canvasRef}
        containerRef={containerRef}
        scale={scale}
        offsetX={offsetX}
        offsetY={offsetY}
      />
      <ZoomControls
        scale={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetZoom}
      />
      {/* 显示光标指示器（画笔和橡皮擦） */}
      {showCursor && (currentTool === 'pen' || currentTool === 'eraser') && (
        <CursorIndicator
          size={currentTool === 'pen' ? toolOptions.pen.size : toolOptions.eraser.size}
          type={currentTool}
          scale={scale}
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`
          }}
        />
      )}
      {/* 图层文字输入 */}
      {textInputRef?.current && (
        <TextInput
          x={textInputRef.current.x * scale + (containerRef.current?.getBoundingClientRect().width / 2 || 0) + offsetX - (canvasSize.width * scale) / 2}
          y={textInputRef.current.y * scale + (containerRef.current?.getBoundingClientRect().height / 2 || 0) + offsetY - (canvasSize.height * scale) / 2}
          text={textInputRef.current.text}
          fontSize={textInputRef.current.fontSize * scale}
          color={textInputRef.current.color}
          isEdit={textInputRef.current.index !== undefined}
          onSave={(newText) => {
            if (newText && currentLayer) {
              const texts = [...(currentLayer.texts || [])]
              if (textInputRef.current.index !== undefined) {
                texts[textInputRef.current.index] = {
                  ...texts[textInputRef.current.index],
                  text: newText,
                  fontSize: textInputRef.current.fontSize,
                  color: textInputRef.current.color
                }
              } else {
                texts.push({
                  id: Date.now(),
                  x: textInputRef.current.x,
                  y: textInputRef.current.y,
                  text: newText,
                  fontSize: textInputRef.current.fontSize,
                  color: textInputRef.current.color
                })
              }
              updateLayer(currentLayerIndex, { texts })
              pushHistoryImmediate(layers)
            }
            textInputRef.current = null
            setTextInput(null)
            draw()
          }}
          onCancel={() => {
            textInputRef.current = null
            setTextInput(null)
            draw()
          }}
          onDelete={() => {
            if (currentLayer && textInputRef.current.index !== undefined) {
              const updatedTexts = currentLayer.texts.filter((_, i) => i !== textInputRef.current.index)
              updateLayer(currentLayerIndex, { texts: updatedTexts })
              pushHistoryImmediate(layers)
              draw()
            }
          }}
        />
      )}
      {/* 坐标点输入 */}
      {coordinateInput && (
        <CoordinateInput
          coordinate={coordinateInput}
          containerRef={containerRef}
          canvasRef={canvasRef}
          scale={scale}
          offsetX={offsetX}
          offsetY={offsetY}
          onSave={(updates) => {
            if (coordinateInput.isMarker) {
              updateMarkerFromContext(coordinateInput.id, updates)
            } else {
              updateCoordinate(coordinateInput.id, updates)
            }
            setCoordinateInput(null)
          }}
          onDelete={() => {
            if (coordinateInput.isMarker) {
              deleteMarkerFromContext(coordinateInput.id)
            } else {
              deleteCoordinate(coordinateInput.id)
            }
            setCoordinateInput(null)
          }}
          onClose={() => {
            setCoordinateInput(null)
          }}
        />
      )}
    </div>
  )
})

Canvas.displayName = 'Canvas'

export default Canvas
