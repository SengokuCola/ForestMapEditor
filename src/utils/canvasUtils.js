/**
 * 画布绘制工具函数
 */

/**
 * 将十六进制颜色转换为 rgba 格式
 * @param {string} hex - 十六进制颜色值，如 '#ff0000' 或 '#f00'
 * @param {number} opacity - 透明度，0-1 之间
 * @returns {string} rgba 颜色字符串，如 'rgba(255, 0, 0, 0.5)'
 */
function hexToRgba(hex, opacity = 1.0) {
  // 移除 # 号
  hex = hex.replace('#', '')
  
  // 处理 3 位十六进制颜色（如 #f00 -> #ff0000）
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  // 解析 RGB 值
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export const canvasUtils = {
  /**
   * 绘制地图图片
   */
  drawMap(ctx, mapImage, width, height) {
    ctx.clearRect(0, 0, width, height)
    if (mapImage) {
      ctx.drawImage(mapImage, 0, 0)
    }
  },

  /**
   * 快速绘制单个绘制操作（用于实时绘制）
   */
  drawSingleDrawing(ctx, drawing) {
    if (!drawing) return

    if (drawing.type === 'pen') {
      if (!drawing.points || drawing.points.length < 2) return

      const opacity = drawing.opacity !== undefined ? drawing.opacity : 1.0
      const color = drawing.color || '#e74c3c'
      const rgbaColor = hexToRgba(color, opacity)

      ctx.strokeStyle = rgbaColor
      ctx.lineWidth = drawing.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(drawing.points[0].x, drawing.points[0].y)

      for (let i = 1; i < drawing.points.length; i++) {
        ctx.lineTo(drawing.points[i].x, drawing.points[i].y)
      }
      ctx.stroke()
    } else if (drawing.type === 'line') {
      if (!drawing.start || !drawing.end) return

      const opacity = drawing.opacity !== undefined ? drawing.opacity : 1.0
      const color = drawing.color || '#e74c3c'
      const rgbaColor = hexToRgba(color, opacity)

      ctx.strokeStyle = rgbaColor
      ctx.lineWidth = drawing.size
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(drawing.start.x, drawing.start.y)
      ctx.lineTo(drawing.end.x, drawing.end.y)
      ctx.stroke()
    } else if (drawing.type === 'eraser') {
      if (!drawing.points || drawing.points.length < 2) return

      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = drawing.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(drawing.points[0].x, drawing.points[0].y)

      for (let i = 1; i < drawing.points.length; i++) {
        ctx.lineTo(drawing.points[i].x, drawing.points[i].y)
      }
      ctx.stroke()
      ctx.restore()
    }
  },

  /**
   * 绘制图层内容（高性能版本）
   * 直接在目标 ctx 上绘制，避免创建额外的离屏画布
   * 这是性能优化的关键：消除了创建临时 canvas 的开销
   */
  drawLayer(ctx, layer, canvasWidth, canvasHeight) {
    if (!layer || !layer.visible) return

    // 使用图层颜色和透明度进行动态着色
    const layerColor = layer.color || null
    const layerOpacity = layer.opacity !== undefined ? layer.opacity : 1.0

    // 设置图层透明度
    ctx.globalAlpha = layerOpacity

    // 直接在目标 ctx 上绘制，不需要额外的离屏画布
    // 这消除了创建和复制多个临时 canvas 的巨大开销
    if (layer.drawings && layer.drawings.length > 0) {
      layer.drawings.forEach((drawing) => {
        if (drawing.type === 'pen') {
          if (!drawing.points || drawing.points.length < 2) return

          // 优先使用图层颜色，实现动态着色
          const color = layerColor || drawing.color || '#e74c3c'
          const rgbaColor = hexToRgba(color, 1.0) // 使用图层透明度，不使用绘制时的透明度

          ctx.strokeStyle = rgbaColor
          ctx.lineWidth = drawing.size
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          ctx.moveTo(drawing.points[0].x, drawing.points[0].y)

          for (let i = 1; i < drawing.points.length; i++) {
            ctx.lineTo(drawing.points[i].x, drawing.points[i].y)
          }
          ctx.stroke()
        } else if (drawing.type === 'line') {
          if (!drawing.start || !drawing.end) return

          const color = layerColor || drawing.color || '#e74c3c'
          const rgbaColor = hexToRgba(color, 1.0)

          ctx.strokeStyle = rgbaColor
          ctx.lineWidth = drawing.size
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(drawing.start.x, drawing.start.y)
          ctx.lineTo(drawing.end.x, drawing.end.y)
          ctx.stroke()
        } else if (drawing.type === 'eraser') {
          if (!drawing.points || drawing.points.length < 2) return

          ctx.save()
          ctx.globalCompositeOperation = 'destination-out'
          ctx.lineWidth = drawing.size
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          ctx.moveTo(drawing.points[0].x, drawing.points[0].y)

          for (let i = 1; i < drawing.points.length; i++) {
            ctx.lineTo(drawing.points[i].x, drawing.points[i].y)
          }
          ctx.stroke()
          ctx.restore()
        }
      })
    }

    // 绘制标记点
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

    // 绘制文字
    if (layer.texts && layer.texts.length > 0) {
      layer.texts.forEach(text => {
        if (!text.text) return

        ctx.fillStyle = text.color
        ctx.font = `${text.fontSize}px Arial`
        ctx.textBaseline = 'bottom'
        ctx.fillText(text.text, text.x, text.y)
      })
    }

    // 重置透明度
    ctx.globalAlpha = 1.0
  },

  /**
   * 添加标记点
   */
  addMarker(layer, x, y, options) {
    if (!layer.markers) {
      layer.markers = []
    }
    layer.markers.push({
      x,
      y,
      color: options.color,
      size: options.size
    })
  }
}
