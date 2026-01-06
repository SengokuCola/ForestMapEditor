import React, { useRef, useEffect } from 'react'
import { useCoordinates } from '../../contexts/CoordinateContext'

const CoordinateOverlay = ({ canvasRef, containerRef, scale, offsetX, offsetY }) => {
  const overlayRef = useRef(null)
  const { coordinatesRef, renderTrigger } = useCoordinates()

  // 同步覆盖层的大小和位置，并绘制坐标点
  useEffect(() => {
    if (!overlayRef.current || !canvasRef.current || !containerRef.current) return

    const overlay = overlayRef.current
    const canvas = canvasRef.current
    const container = containerRef.current

    // 设置覆盖层大小与主画布相同
    overlay.width = canvas.width
    overlay.height = canvas.height

    // 同步 transform
    const rect = container.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const translateX = centerX + offsetX - (canvas.width * scale) / 2
    const translateY = centerY + offsetY - (canvas.height * scale) / 2

    overlay.style.position = 'absolute'
    overlay.style.left = '0'
    overlay.style.top = '0'
    overlay.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`
    overlay.style.transformOrigin = '0 0'
    overlay.style.pointerEvents = 'none' // 让鼠标事件穿透到主画布

    // 绘制坐标点
    const ctx = overlay.getContext('2d')
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    // 绘制所有坐标点（使用 ref 直接访问，避免状态更新）
    const coordinates = coordinatesRef.current
    coordinates.forEach(coord => {
      // 绘制坐标点（圆形标记）
      ctx.fillStyle = coord.color
      ctx.beginPath()
      ctx.arc(coord.x, coord.y, coord.size / 2, 0, Math.PI * 2)
      ctx.fill()

      // 绘制白色边框
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()

      // 如果有附加文字，绘制文字
      if (coord.text) {
        ctx.fillStyle = coord.textColor
        ctx.font = `${coord.fontSize}px Arial`
        ctx.textBaseline = 'bottom'
        ctx.fillText(coord.text, coord.x + coord.size / 2 + 5, coord.y)
      }
    })
  }, [renderTrigger, canvasRef, containerRef, scale, offsetX, offsetY, coordinatesRef])

  return (
    <canvas
      ref={overlayRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10,
        backgroundColor: 'transparent'
      }}
    />
  )
}

export default CoordinateOverlay
