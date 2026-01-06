/**
 * 存储管理工具
 * 强制使用服务端存储，不使用浏览器缓存
 */

import { apiStorageManager } from './apiStorage'

// 导出统一的存储管理器（强制使用服务端存储）
export const storageManager = {
  async saveData(...args) {
    // 强制使用服务端存储，不使用浏览器缓存
    return await apiStorageManager.saveData(...args)
  },
  
  async loadData() {
    // 强制从服务端加载数据，不使用浏览器缓存
    return await apiStorageManager.loadData()
  },
  
  async clearData() {
    // 清除服务端数据
    return await apiStorageManager.clearData()
  },
  
  async hasData() {
    // 检查服务端是否有数据
    return await apiStorageManager.hasData()
  }
}
