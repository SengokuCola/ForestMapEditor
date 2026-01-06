/**
 * 地图编辑器后端服务
 * 提供数据存储和加载 API
 */

import express from 'express'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'

// ES 模块中获取 __dirname 的方式
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const DATA_DIR = path.join(__dirname, 'data')

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// 中间件
app.use(cors())
app.use(express.json({ limit: '50mb' })) // 支持大文件（base64 图片）

// 获取项目 ID（从查询参数或使用默认值）
function getProjectId(req) {
  return req.query.projectId || req.body.projectId || 'default'
}

// 获取数据文件路径
function getDataFilePath(projectId) {
  return path.join(DATA_DIR, `${projectId}.json`)
}

// 保存数据
app.post('/api/save', async (req, res) => {
  try {
    const projectId = getProjectId(req)
    const data = req.body

    // 验证数据格式
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: '无效的数据格式' })
    }

    // 添加保存时间
    data.saveTime = new Date().toISOString()
    data.projectId = projectId

    // 保存到文件
    const filePath = getDataFilePath(projectId)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')

    console.log(`数据已保存: ${projectId} at ${new Date().toISOString()}`)
    res.json({ success: true, message: '数据已保存', projectId })
  } catch (error) {
    console.error('保存数据失败:', error)
    res.status(500).json({ error: '保存数据失败: ' + error.message })
  }
})

// 加载数据
app.get('/api/load', async (req, res) => {
  try {
    const projectId = getProjectId(req)
    const filePath = getDataFilePath(projectId)

    // 检查文件是否存在
    try {
      await fs.access(filePath)
    } catch {
      return res.json({ data: null, message: '没有找到保存的数据' })
    }

    // 读取文件
    const fileContent = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(fileContent)

    console.log(`数据已加载: ${projectId}`)
    res.json({ success: true, data })
  } catch (error) {
    console.error('加载数据失败:', error)
    res.status(500).json({ error: '加载数据失败: ' + error.message })
  }
})

// 删除数据
app.delete('/api/delete', async (req, res) => {
  try {
    const projectId = getProjectId(req)
    const filePath = getDataFilePath(projectId)

    // 检查文件是否存在
    try {
      await fs.access(filePath)
    } catch {
      return res.json({ success: true, message: '数据不存在' })
    }

    // 删除文件
    await fs.unlink(filePath)

    console.log(`数据已删除: ${projectId}`)
    res.json({ success: true, message: '数据已删除' })
  } catch (error) {
    console.error('删除数据失败:', error)
    res.status(500).json({ error: '删除数据失败: ' + error.message })
  }
})

// 列出所有项目
app.get('/api/projects', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR)
    const projects = files
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        id: file.replace('.json', ''),
        name: file.replace('.json', '')
      }))

    res.json({ success: true, projects })
  } catch (error) {
    console.error('列出项目失败:', error)
    res.status(500).json({ error: '列出项目失败: ' + error.message })
  }
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 启动服务器
async function startServer() {
  await ensureDataDir()
  app.listen(PORT, () => {
    console.log(`地图编辑器后端服务运行在 http://localhost:${PORT}`)
    console.log(`数据存储目录: ${DATA_DIR}`)
  })
}

startServer().catch(console.error)

