import { useCallback, useRef } from 'react'
import { useCoordinates } from '../contexts/CoordinateContext'
import { useMarkers } from '../contexts/MarkerContext'

export const useCoordinateInteraction = (canvasRef, containerRef, currentTool, toolOptions, scale, offsetX, offsetY, setOffsetX, setOffsetY) => {
  const { coordinates } = useCoordinates()
  const { addMarker, markers } = useMarkers()
  const isMovingCoordinateRef = useRef(false)
  const movingCoordinateIdRef = useRef(null)
  const isPanningRef = useRef(false)
  const startPanPosRef = useRef({ x: 0, y: 0 })
  const lastClickTimeRef = useRef(0)
  const lastClickedCoordinateIdRef = useRef(null)

  // 获取画布坐标
  const getCanvasCoordinates = useCallback((e) => {
    if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 }
    const container = containerRef.current
    const canvas = canvasRef.current
    const containerRect = container.getBoundingClientRect()

    const mouseX = e.clientX - containerRect.left
    const mouseY = e.clientY - containerRect.top

    const centerX = containerRect.width / 2
    const centerY = containerRect.height / 2

    const canvasLeft = centerX + offsetX - (canvas.width * scale) / 2
    const canvasTop = centerY + offsetY - (canvas.height * scale) / 2

    const x = (mouseX - canvasLeft) / scale
    const y = (mouseY - canvasTop) / scale

    return {
      x: Math.max(0, Math.min(canvas.width, x)),
      y: Math.max(0, Math.min(canvas.height, y))
    }
  }, [canvasRef, containerRef, offsetX, offsetY, scale])

  // 检测点击了哪个标记点
  const getClickedMarker = useCallback((coords) => {
    if (!markers || markers.length === 0) return null

    for (let i = markers.length - 1; i >= 0; i--) {
      const marker = markers[i]
      // 检测是否点击了坐标点圆形
      const distance = Math.sqrt(
        Math.pow(coords.x - marker.x, 2) + Math.pow(coords.y - marker.y, 2)
      )
      if (distance <= (marker.size / 2 + 5)) {
        return { marker: marker, index: i }
      }
    }
    return null
  }, [markers])

  // 处理鼠标按下
  const handleMouseDown = useCallback((e, setCoordinateInput) => {
    if (currentTool !== 'coordinate') return false

    const coords = getCanvasCoordinates(e)
    const clicked = getClickedMarker(coords)

    if (clicked) {
      // 右键：打开编辑面板
      if (e.button === 2) {
        e.preventDefault()
        e.stopPropagation()
        setCoordinateInput({
          ...clicked.marker,
          index: clicked.index,
          isMarker: true
        })
        return false
      }

      // 左键：检测双击编辑或单击拖动
      const currentTime = Date.now()
      const timeDiff = currentTime - lastClickTimeRef.current
      const isDoubleClick = timeDiff < 300 && lastClickedCoordinateIdRef.current === clicked.marker.id

      if (isDoubleClick) {
        // 双击：编辑标记点文字
        setCoordinateInput({
          ...clicked.marker,
          index: clicked.index,
          isMarker: true
        })
        lastClickTimeRef.current = 0
        lastClickedCoordinateIdRef.current = null
      } else {
        // 单击：开始移动标记点
        lastClickTimeRef.current = currentTime
        lastClickedCoordinateIdRef.current = clicked.marker.id
        isMovingCoordinateRef.current = true
        movingCoordinateIdRef.current = clicked.marker.id
      }
      return false
    }

    // 点击空白处：根据按钮类型执行不同操作
    if (e.button === 0) {
      // 左键：创建新标记点
      const newMarker = {
        x: coords.x,
        y: coords.y,
        size: toolOptions.coordinate.size,
        color: toolOptions.coordinate.color,
        fontSize: toolOptions.coordinate.fontSize,
        textColor: toolOptions.coordinate.textColor
      }
      addMarker(newMarker)
      return false
    } else if (e.button === 2) {
      // 右键：开始平移地图
      e.preventDefault()
      e.stopPropagation()
      isPanningRef.current = true
      startPanPosRef.current = { x: e.clientX - offsetX, y: e.clientY - offsetY }
      return false
    }

    return false
  }, [currentTool, getCanvasCoordinates, getClickedMarker, toolOptions, addMarker, offsetX, offsetY])

  // 处理鼠标移动
  const handleMouseMove = useCallback((e) => {
    if (currentTool !== 'coordinate') return false

    // 平移地图
    if (isPanningRef.current) {
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
      return true
    }

    // 移动标记点 - 暂不支持，因为标记点使用独立的 marker 系统
    if (isMovingCoordinateRef.current) {
      // 标记点移动可以后续实现
      return true
    }

    return false
  }, [currentTool, scale, canvasRef, containerRef, setOffsetX, setOffsetY])

  // 处理鼠标释放
  const handleMouseUp = useCallback((e) => {
    if (e.button === 2 && isPanningRef.current) {
      isPanningRef.current = false
      return false
    }

    if (isMovingCoordinateRef.current) {
      isMovingCoordinateRef.current = false
      movingCoordinateIdRef.current = null
    }
  }, [])

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  }
}
