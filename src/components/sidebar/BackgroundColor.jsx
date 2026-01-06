import React from 'react'
import { useTool } from '../../contexts/ToolContext'
import './BackgroundColor.css'

const BackgroundColor = () => {
  const { backgroundColor, setBackgroundColor } = useTool()

  const handleColorChange = (e) => {
    setBackgroundColor(e.target.value)
  }

  const presetColors = [
    '#ffffff', // 白色
    '#f5f5dc', // 米色
    '#ffefd5', // 番茄色
    '#ffe4e1', // 迷雾玫瑰
    '#e6e6fa', // 淡紫色
    '#f0fff0', // 蜜瓜色
    '#f0f8ff', // 爱丽丝蓝
    '#000000'  // 黑色
  ]

  return (
    <div className="background-color">
      <h3>背景颜色</h3>
      <div className="color-controls">
        <div className="color-picker-wrapper">
          <input
            type="color"
            value={backgroundColor}
            onChange={handleColorChange}
            className="color-picker"
          />
          <span className="color-value">{backgroundColor}</span>
        </div>
        <div className="preset-colors">
          <div className="preset-colors-grid">
            {presetColors.map(color => (
              <button
                key={color}
                className={`preset-color-btn ${backgroundColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setBackgroundColor(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BackgroundColor
