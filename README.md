# 地图编辑器 - 多图层标记工具

一个基于 React 的现代化地图标记编辑器，支持多图层管理、标记点、画笔绘制、橡皮擦等功能。

## 功能特性

- 🗺️ **地图导入** - 支持导入各种格式的地图图片
- 📍 **标记点** - 在地图上放置标记点，可自定义颜色和大小
- ✏️ **画笔绘制** - 自由绘制路径，支持自定义颜色和粗细
- 🧹 **橡皮擦** - 擦除绘制内容，可调整大小
- 📑 **多图层管理** - 创建、切换、显示/隐藏、删除图层
- 🔍 **缩放浏览** - 鼠标滚轮缩放，支持拖拽浏览
- 💾 **数据保存** - 导出/导入图层数据，支持数据持久化

## 技术栈

- **React 18** - 前端框架
- **Vite** - 构建工具
- **Context API** - 状态管理
- **Custom Hooks** - 逻辑复用
- **Canvas API** - 画布绘制

## 项目结构

```
map_editor/
├── index.html              # HTML 入口文件
├── package.json            # 项目配置
├── vite.config.js         # Vite 配置
├── src/
│   ├── main.jsx           # React 入口
│   ├── App.jsx            # 主应用组件
│   ├── components/        # 组件目录
│   │   ├── Sidebar.jsx    # 侧边栏组件
│   │   ├── Canvas.jsx     # 画布组件
│   │   ├── sidebar/       # 侧边栏子组件
│   │   │   ├── FileOperations.jsx
│   │   │   ├── ToolSelector.jsx
│   │   │   ├── LayerManager.jsx
│   │   │   ├── LayerList.jsx
│   │   │   └── ToolOptions.jsx
│   │   └── canvas/        # 画布子组件
│   │       └── ZoomControls.jsx
│   ├── contexts/          # Context 上下文
│   │   ├── LayerContext.jsx   # 图层状态管理
│   │   └── ToolContext.jsx    # 工具状态管理
│   ├── hooks/             # 自定义 Hooks
│   │   └── useCanvas.js   # 画布相关逻辑
│   ├── utils/             # 工具函数
│   │   ├── canvasUtils.js # 画布绘制工具
│   │   └── fileManager.js # 文件管理工具
│   └── styles/            # 样式文件
│       ├── index.css
│       ├── App.css
│       ├── Sidebar.css
│       └── Canvas.css
└── README.md
```

## 安装和运行

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 使用说明

1. **导入地图**：点击"导入地图图片"按钮，选择地图图片文件
2. **选择工具**：在工具栏中选择需要的工具（拖拽、标记点、画笔、橡皮擦）
3. **创建图层**：点击"新建图层"创建新的图层
4. **切换图层**：点击图层列表中的图层项切换当前图层
5. **编辑内容**：在当前图层上使用工具进行标记和绘制
6. **缩放浏览**：使用鼠标滚轮或右上角按钮进行缩放
7. **保存数据**：点击"导出所有图层"保存当前工作
8. **加载数据**：点击"导入图层数据"恢复之前的工作

## 模块说明

### 组件模块

- **Sidebar** - 侧边栏容器，包含所有操作面板
- **Canvas** - 画布组件，处理绘制和交互
- **FileOperations** - 文件操作（导入/导出）
- **ToolSelector** - 工具选择器
- **LayerManager** - 图层管理容器
- **LayerList** - 图层列表显示
- **ToolOptions** - 工具选项配置
- **ZoomControls** - 缩放控制按钮

### 状态管理

- **LayerContext** - 管理图层数据、当前图层、图层操作
- **ToolContext** - 管理当前工具、工具选项

### 自定义 Hooks

- **useCanvas** - 封装画布相关的所有逻辑（缩放、绘制、交互）

### 工具函数

- **canvasUtils** - 画布绘制相关工具函数
- **fileManager** - 文件导入导出相关工具函数

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 许可证

MIT License
