/**
 * 服务端存储管理工具
 * 使用 API 调用将数据存储到服务端
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// 获取项目 ID（从 URL 参数或使用默认值）
function getProjectId() {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('projectId') || 'default'
}

export const apiStorageManager = {
  /**
   * 保存数据到服务端
   */
  async saveData(mapImage, layers, canvasWidth, canvasHeight) {
    try {
      // 将图片转换为 base64
      let mapImageData = null
      if (mapImage) {
        const canvas = document.createElement('canvas')
        canvas.width = mapImage.width
        canvas.height = mapImage.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(mapImage, 0, 0)
        mapImageData = canvas.toDataURL('image/png')
      }

      const data = {
        version: '1.0.0',
        mapImage: mapImageData,
        canvasWidth: canvasWidth || (mapImage ? mapImage.width : 0),
        canvasHeight: canvasHeight || (mapImage ? mapImage.height : 0),
        layers: layers.map(layer => ({
          id: layer.id,
          name: layer.name,
          visible: layer.visible,
          markers: layer.markers || [],
          drawings: layer.drawings || [],
          texts: layer.texts || []
        })),
        projectId: getProjectId()
      }

      const response = await fetch(`${API_BASE_URL}/save?projectId=${getProjectId()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '保存数据失败')
      }

      const result = await response.json()
      console.log('数据已保存到服务端:', result)
      return true
    } catch (error) {
      console.error('保存数据失败:', error)
      // 如果是连接错误，提示用户启动后端服务
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        alert('无法连接到后端服务！\n\n请确保后端服务已启动：\n运行命令: npm run server\n\n数据将无法保存到服务器。')
        return false
      }
      // 其他错误显示提示
      alert('保存数据失败: ' + error.message)
      return false
    }
  },

  /**
   * 从服务端加载数据
   */
  async loadData() {
    try {
      const response = await fetch(`${API_BASE_URL}/load?projectId=${getProjectId()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '加载数据失败')
      }

      const result = await response.json()
      
      if (!result.data) {
        return null
      }

      // 检查版本兼容性
      if (result.data.version !== '1.0.0') {
        console.warn('数据版本不匹配，可能无法正常加载')
      }

      return result.data
    } catch (error) {
      // 如果是连接错误，静默处理（第一次加载可能是新项目，不需要提示）
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        // 只在控制台记录，不显示错误（第一次使用可能是新项目）
        console.warn('后端服务未运行，无法加载数据。如果是新项目，这是正常的。')
        return null
      }
      console.error('加载数据失败:', error)
      return null
    }
  },

  /**
   * 清除服务端的数据
   */
  async clearData() {
    try {
      const response = await fetch(`${API_BASE_URL}/delete?projectId=${getProjectId()}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '清除数据失败')
      }

      const result = await response.json()
      console.log('服务端数据已清除:', result)
      return true
    } catch (error) {
      console.error('清除数据失败:', error)
      // 如果是连接错误，提示用户启动后端服务
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        alert('无法连接到后端服务！\n\n请确保后端服务已启动：\n运行命令: npm run server')
        return false
      }
      alert('清除数据失败: ' + error.message)
      return false
    }
  },

  /**
   * 检查是否有保存的数据
   */
  async hasData() {
    try {
      const data = await this.loadData()
      return data !== null
    } catch {
      return false
    }
  }
}

