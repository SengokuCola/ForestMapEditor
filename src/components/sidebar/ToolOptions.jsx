import React from 'react'
import { useTool } from '../../contexts/ToolContext'
import './ToolOptions.css'

const ToolOptions = () => {
  const { currentTool, toolOptions, updateToolOption } = useTool()
  const options = toolOptions[currentTool]

  if (!options) return null

  return (
    <div className="tool-options-section">
      <h3>工具选项</h3>
      <div className="tool-options">
        {currentTool === 'pen' && (
          <>
            <label>
              画笔大小: <span>{options.size}</span>px
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={options.size}
              onChange={(e) => updateToolOption('pen', 'size', parseInt(e.target.value))}
            />
          </>
        )}

        {currentTool === 'eraser' && (
          <>
            <label>
              橡皮擦大小: <span>{options.size}</span>px
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className={`eraser-size-btn ${options.size === 5 ? 'active' : ''}`}
                onClick={() => updateToolOption('eraser', 'size', 5)}
              >
                小
              </button>
              <button
                className={`eraser-size-btn ${options.size === 10 ? 'active' : ''}`}
                onClick={() => updateToolOption('eraser', 'size', 10)}
              >
                中
              </button>
              <button
                className={`eraser-size-btn ${options.size === 30 ? 'active' : ''}`}
                onClick={() => updateToolOption('eraser', 'size', 30)}
              >
                大
              </button>
              <button
                className={`eraser-size-btn ${options.size === 60 ? 'active' : ''}`}
                onClick={() => updateToolOption('eraser', 'size', 60)}
              >
                特大
              </button>
            </div>
          </>
        )}

        {currentTool === 'coordinate' && (
          <>
            <label>
              坐标点大小: <span>{options.size}</span>px
            </label>
            <input
              type="range"
              min="5"
              max="30"
              value={options.size}
              onChange={(e) => updateToolOption('coordinate', 'size', parseInt(e.target.value))}
            />
            <label>坐标点颜色:</label>
            <input
              type="color"
              value={options.color}
              onChange={(e) => updateToolOption('coordinate', 'color', e.target.value)}
            />
            <label>
              附加文字大小: <span>{options.fontSize}</span>px
            </label>
            <input
              type="range"
              min="10"
              max="72"
              value={options.fontSize}
              onChange={(e) => updateToolOption('coordinate', 'fontSize', parseInt(e.target.value))}
            />
            <label>文字颜色:</label>
            <input
              type="color"
              value={options.textColor}
              onChange={(e) => updateToolOption('coordinate', 'textColor', e.target.value)}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default ToolOptions
