# 地图编辑器 - 服务端存储说明

## 概述

地图编辑器现在支持将数据存储到服务端，允许多个用户通过公网访问和编辑同一个地图项目。

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动后端服务

```bash
npm run server
# 或
node server.js
```

后端服务默认运行在 `http://localhost:3001`

### 3. 启动前端开发服务器

```bash
npm run dev
```

前端默认运行在 `http://localhost:3000`

## 配置

### 环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
# API 服务地址
VITE_API_URL=http://localhost:3001/api

# 是否使用服务端存储
VITE_USE_SERVER_STORAGE=true

# 后端服务端口
PORT=3001
```

### 多项目支持

通过 URL 参数指定项目 ID：

```
http://localhost:3000/?projectId=project1
http://localhost:3000/?projectId=project2
```

如果不指定 `projectId`，默认使用 `default` 项目。

## API 接口

### 保存数据
```
POST /api/save?projectId=xxx
Content-Type: application/json

{
  "version": "1.0.0",
  "mapImage": "data:image/png;base64,...",
  "canvasWidth": 1920,
  "canvasHeight": 1080,
  "layers": [...]
}
```

### 加载数据
```
GET /api/load?projectId=xxx
```

### 删除数据
```
DELETE /api/delete?projectId=xxx
```

### 列出所有项目
```
GET /api/projects
```

### 健康检查
```
GET /api/health
```

## 数据存储

- 数据存储在服务端的 `data/` 目录
- 每个项目对应一个 JSON 文件：`data/{projectId}.json`
- 数据以 JSON 格式存储，包含 base64 编码的图片

## 部署到公网

### 1. 修改环境变量

将 `VITE_API_URL` 设置为你的公网 API 地址：

```env
VITE_API_URL=https://your-domain.com/api
```

### 2. 构建前端

```bash
npm run build
```

### 3. 部署

- **前端**：将 `dist/` 目录部署到静态文件服务器（如 Nginx）
- **后端**：使用 PM2 或其他进程管理器运行 `server.js`

### 4. 反向代理配置（Nginx 示例）

```nginx
# 前端
location / {
    root /path/to/dist;
    try_files $uri $uri/ /index.html;
}

# 后端 API
location /api {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 注意事项

1. **数据安全**：当前实现没有身份验证，所有用户都可以访问和修改数据。生产环境建议添加认证机制。

2. **存储限制**：服务端存储没有大小限制（受服务器磁盘空间限制），但建议监控 `data/` 目录大小。

3. **并发访问**：多个用户同时编辑同一项目时，后保存的数据会覆盖先保存的数据。建议添加版本控制或锁定机制。

4. **备份**：定期备份 `data/` 目录，防止数据丢失。

## 故障排除

### 前端无法连接到后端

1. 检查后端服务是否运行
2. 检查 `VITE_API_URL` 配置是否正确
3. 检查 CORS 设置（后端已启用 CORS）

### 数据保存失败

1. 检查 `data/` 目录是否有写入权限
2. 检查服务器磁盘空间
3. 查看后端日志

