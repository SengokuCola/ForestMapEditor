import React from 'react'
import { useTool } from '../../contexts/ToolContext'
import './ToolSelector.css'

const tools = [
  { id: 'pan', icon: '✋', name: '拖拽' },
  { id: 'coordinate', icon: '📍', name: '坐标点' },
  { id: 'pen', icon: '✏️', name: '画笔' },
  { id: 'eraser', icon: '🧽', name: '橡皮擦' }
]

const ToolSelector = () => {
  const { currentTool, setCurrentTool } = useTool()

  return (
    <div className="tool-selector">
      <h3>工具</h3>
      <div className="tool-buttons-grid">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
            onClick={() => setCurrentTool(tool.id)}
            title={tool.name}
          >
            <span className="tool-icon">{tool.icon}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ToolSelector
