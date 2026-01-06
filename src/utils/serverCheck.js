/**
 * 后端服务检查工具
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

let serverStatus = null
let lastCheckTime = 0
const CHECK_INTERVAL = 5000 // 5秒内不重复检查

/**
 * 检查后端服务是否可用
 */
export async function checkServerStatus() {
  const now = Date.now()
  // 如果最近检查过，直接返回缓存结果
  if (serverStatus !== null && (now - lastCheckTime) < CHECK_INTERVAL) {
    return serverStatus
  }

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000) // 2秒超时
    })
    serverStatus = response.ok
    lastCheckTime = now
    return serverStatus
  } catch (error) {
    serverStatus = false
    lastCheckTime = now
    return false
  }
}

/**
 * 显示后端服务状态提示
 */
export function showServerStatusMessage() {
  checkServerStatus().then(available => {
    if (!available) {
      console.warn(`
╔══════════════════════════════════════════════════════════╗
║  后端服务未运行                                           ║
║                                                          ║
║  请运行以下命令启动后端服务：                              ║
║  npm run server                                          ║
║                                                          ║
║  或者：                                                   ║
║  node server.js                                          ║
║                                                          ║
║  后端服务将运行在: http://localhost:3001                 ║
╚══════════════════════════════════════════════════════════╝
      `)
    }
  })
}

