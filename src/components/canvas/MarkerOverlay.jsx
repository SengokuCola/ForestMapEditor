import React, { useRef, useEffect } from 'react'
import { useMarkers } from '../../contexts/MarkerContext'

const MarkerOverlay = ({ canvasRef, containerRef, scale, offsetX, offsetY }) => {
  const overlayRef = useRef(null)
  const { markers } = useMarkers()

  // 同步覆盖层的大小和位置，并绘制标记点
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

    // 绘制标记点
    const ctx = overlay.getContext('2d')
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    // 绘制所有标记点
    markers.forEach(marker => {
      // 绘制标记点（圆形标记）
      ctx.fillStyle = marker.color
      ctx.beginPath()
      ctx.arc(marker.x, marker.y, marker.size / 2, 0, Math.PI * 2)
      ctx.fill()

      // 绘制白色边框
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()

      // 如果有文字，绘制文字
      if (marker.text) {
        ctx.fillStyle = marker.textColor
        ctx.font = `${marker.fontSize}px Arial`
        ctx.textBaseline = 'bottom'
        ctx.fillText(marker.text, marker.x + marker.size / 2 + 5, marker.y)
      }
    })
  }, [markers, canvasRef, containerRef, scale, offsetX, offsetY])

  return (
    <canvas
      ref={overlayRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 15,
        backgroundColor: 'transparent'
      }}
    />
  )
}

export default MarkerOverlay
