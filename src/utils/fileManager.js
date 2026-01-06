/**
 * 文件管理工具函数
 */

export const fileManager = {
  /**
   * 加载图片文件
   */
  loadImage(file, callback) {
    const reader = new FileReader()
    reader.onload = function(event) {
      const img = new Image()
      img.onload = function() {
        callback(img, img.width, img.height)
      }
      img.onerror = function() {
        alert('图片加载失败，请检查文件格式')
      }
      img.src = event.target.result
    }
    reader.onerror = function() {
      alert('文件读取失败')
    }
    reader.readAsDataURL(file)
  },

  /**
   * 导出图层数据
   */
  exportData(layers, mapImage) {
    if (layers.length === 0) {
      throw new Error('没有可导出的图层数据！')
    }

    // 获取画布数据
    let mapImageData = null
    let canvasWidth = 0
    let canvasHeight = 0
    
    if (mapImage) {
      const canvas = document.createElement('canvas')
      canvas.width = mapImage.width
      canvas.height = mapImage.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(mapImage, 0, 0)
      mapImageData = canvas.toDataURL()
      canvasWidth = canvas.width
      canvasHeight = canvas.height
    }

    const data = {
      mapImage: mapImageData,
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
      layers: layers.map(layer => ({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        markers: layer.markers || [],
        drawings: layer.drawings || [],
        texts: layer.texts || []
      })),
      exportTime: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `map_editor_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  /**
   * 导入图层数据
   */
  importData(file, callback) {
    const reader = new FileReader()
    reader.onload = function(event) {
      try {
        const data = JSON.parse(event.target.result)
        
        if (!data.layers) {
          throw new Error('数据格式错误：缺少图层信息')
        }

        callback(data)
      } catch (error) {
        alert('导入数据失败：' + error.message)
        console.error('Import error:', error)
      }
    }
    reader.onerror = function() {
      alert('文件读取失败')
    }
    reader.readAsText(file)
  }
}
