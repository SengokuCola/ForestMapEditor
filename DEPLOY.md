# 服务器部署指南

## 概述

在服务器上部署地图编辑器需要：
1. 部署后端服务（Node.js）
2. 部署前端应用（静态文件）
3. 配置环境变量
4. 配置反向代理（推荐）

## 部署步骤

### 方案一：前后端分离部署（推荐）

#### 1. 部署后端服务

**在服务器上：**

```bash
# 1. 上传项目文件到服务器
# 2. 安装依赖
npm install

# 3. 启动后端服务（使用 PM2 保持运行）
npm install -g pm2
pm2 start server.js --name map-editor-api
pm2 save
pm2 startup  # 设置开机自启
```

**后端服务将运行在：** `http://your-server-ip:3001`

#### 2. 配置前端环境变量

**在本地或构建服务器上：**

创建 `.env.production` 文件：

```env
VITE_API_URL=http://your-server-ip:3001/api
```

或者如果使用域名：

```env
VITE_API_URL=https://your-domain.com/api
```

#### 3. 构建前端

```bash
npm run build
```

这会生成 `dist/` 目录，包含所有前端静态文件。

#### 4. 部署前端

将 `dist/` 目录的内容上传到：
- Nginx 静态文件目录
- Apache 静态文件目录
- 或其他静态文件服务器

### 方案二：使用 Nginx 反向代理（推荐用于生产环境）

#### 1. Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 你的域名或 IP

    # 前端静态文件
    location / {
        root /path/to/map_editor/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 支持大文件上传（base64 图片可能很大）
        client_max_body_size 50M;
    }
}
```

#### 2. 前端环境变量配置

使用反向代理时，前端 API URL 应该设置为：

```env
VITE_API_URL=/api
```

或者完整路径：

```env
VITE_API_URL=https://your-domain.com/api
```

#### 3. 重启 Nginx

```bash
sudo nginx -t  # 测试配置
sudo systemctl reload nginx  # 重新加载配置
```

## 服务器要求

### 必需条件

1. **Node.js 环境**
   - Node.js 版本 >= 14.0.0
   - 已安装 npm

2. **端口开放**
   - 后端服务端口：3001（或你配置的其他端口）
   - 如果使用 Nginx，需要开放 80（HTTP）和 443（HTTPS）

3. **文件系统权限**
   - `data/` 目录需要有写入权限
   - 后端服务需要有创建目录的权限

### 可选但推荐

1. **进程管理器**
   - PM2：保持后端服务运行，自动重启
   - 安装：`npm install -g pm2`
   - 使用：`pm2 start server.js`

2. **反向代理**
   - Nginx 或 Apache
   - 统一端口访问
   - SSL/HTTPS 支持

3. **防火墙配置**
   - 开放必要端口
   - 限制访问来源（可选）

## 环境变量配置

### 后端环境变量

在服务器上设置（或使用 `.env` 文件）：

```bash
PORT=3001  # 后端服务端口
```

### 前端环境变量

在构建前端时设置（`.env.production`）：

```env
# 如果使用反向代理，使用相对路径
VITE_API_URL=/api

# 或者使用完整 URL
VITE_API_URL=https://your-domain.com/api

# 或者直接使用 IP
VITE_API_URL=http://your-server-ip:3001/api
```

## 访问方式

### 方式一：直接访问（不使用反向代理）

- 前端：`http://your-server-ip:8080`（或其他端口）
- 后端：`http://your-server-ip:3001`
- 需要配置前端 `VITE_API_URL=http://your-server-ip:3001/api`

### 方式二：使用反向代理（推荐）

- 统一访问：`http://your-domain.com` 或 `https://your-domain.com`
- 前端和后端通过路径区分：
  - 前端：`/`
  - 后端 API：`/api`

## 多项目支持

通过 URL 参数指定项目：

```
http://your-domain.com/?projectId=project1
http://your-domain.com/?projectId=project2
```

如果不指定，默认使用 `default` 项目。

## 安全检查清单

1. ✅ 后端服务正常运行
2. ✅ 前端可以访问后端 API（检查 CORS）
3. ✅ `data/` 目录有写入权限
4. ✅ 防火墙端口已开放
5. ✅ 如果使用 HTTPS，SSL 证书已配置
6. ⚠️ **注意**：当前版本没有身份验证，所有用户都可以访问和修改数据

## 常见问题

### 1. 前端无法连接到后端

**检查：**
- 后端服务是否运行：`pm2 list` 或 `ps aux | grep node`
- 端口是否正确：检查 `VITE_API_URL` 配置
- 防火墙是否开放端口
- CORS 是否配置（后端已启用 CORS）

### 2. 数据保存失败

**检查：**
- `data/` 目录是否存在且有写入权限
- 服务器磁盘空间是否充足
- 查看后端日志：`pm2 logs map-editor-api`

### 3. 跨域问题

后端已启用 CORS，如果仍有问题：
- 检查 Nginx 配置中的 `proxy_set_header` 设置
- 确认前端请求的 URL 正确

## 快速部署脚本示例

```bash
#!/bin/bash
# deploy.sh

# 1. 安装依赖
npm install

# 2. 构建前端
npm run build

# 3. 启动后端（使用 PM2）
pm2 start server.js --name map-editor-api

# 4. 保存 PM2 配置
pm2 save

echo "部署完成！"
echo "前端文件在: dist/"
echo "后端服务运行在: http://localhost:3001"
```

## 总结

**最简单的部署方式：**

1. 在服务器上运行：`npm run server`（或使用 PM2）
2. 构建前端：`npm run build`
3. 将 `dist/` 目录部署到静态文件服务器
4. 配置前端 `VITE_API_URL` 指向你的服务器地址
5. 访问前端即可使用

**推荐的生产环境部署：**

1. 使用 PM2 管理后端服务
2. 使用 Nginx 作为反向代理
3. 配置 HTTPS（SSL 证书）
4. 设置防火墙规则
5. 定期备份 `data/` 目录

