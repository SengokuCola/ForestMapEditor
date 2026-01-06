import React, { useState, useEffect, useRef } from 'react'
import './TextInput.css'

const CoordinateInput = ({ coordinate, onSave, onDelete, onClose, containerRef, canvasRef, scale, offsetX, offsetY }) => {
  const [text, setText] = useState(coordinate?.text || '')
  const [size, setSize] = useState(coordinate?.size || 10)
  const [fontSize, setFontSize] = useState(coordinate?.fontSize || 16)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const inputRef = useRef(null)
  const containerRefLocal = useRef(null)

  // 计算屏幕位置
  useEffect(() => {
    if (coordinate && containerRef && canvasRef) {
      const container = containerRef.current
      const canvas = canvasRef.current
      if (container && canvas) {
        const rect = container.getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2

        // 计算画布左上角在容器中的位置
        const canvasLeft = centerX + offsetX - (canvas.width * scale) / 2
        const canvasTop = centerY + offsetY - (canvas.height * scale) / 2

        // 计算坐标点在屏幕上的位置
        const screenX = canvasLeft + coordinate.x * scale
        const screenY = canvasTop + coordinate.y * scale

        setPosition({
          x: screenX,
          y: screenY - coordinate.fontSize * scale
        })
      }
    }
  }, [coordinate, containerRef, canvasRef, scale, offsetX, offsetY])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRefLocal.current && !containerRefLocal.current.contains(e.target)) {
        handleSave()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (coordinate && !text) {
        handleDelete()
      }
    }
  }

  const handleSave = () => {
    onSave({ text, size, fontSize })
  }

  const handleDelete = () => {
    onDelete()
  }

  if (!coordinate) return null

  return (
    <div
      ref={containerRefLocal}
      className="text-input-container coordinate-input-panel"
      style={{
        position: 'absolute',
        left: position.x + coordinate.size * scale / 2 + 5,
        top: position.y,
        zIndex: 1000
      }}
    >
      <div className="coordinate-input-content">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-input-field"
          placeholder="输入标记点说明（按 Enter 保存，Esc 取消）"
          style={{
            fontSize: `${coordinate.fontSize * scale}px`,
            color: coordinate.textColor,
            minWidth: '200px'
          }}
        />
        <div className="coordinate-input-controls">
          <div className="coordinate-input-row">
            <label className="coordinate-input-label">
              标记大小: <span>{size}</span>px
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="coordinate-input-slider"
              style={{ width: '120px' }}
            />
          </div>
          <div className="coordinate-input-row">
            <label className="coordinate-input-label">
              文字大小: <span>{fontSize}</span>px
            </label>
            <input
              type="range"
              min="10"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="coordinate-input-slider"
              style={{ width: '120px' }}
            />
          </div>
        </div>
        {coordinate && (
          <div className="text-input-actions">
            <button onClick={handleDelete} className="text-input-btn delete" title="删除 (Delete)">
              🗑️
            </button>
            <button onClick={handleSave} className="text-input-btn save" title="保存 (Enter)">
              ✓
            </button>
            <button onClick={onClose} className="text-input-btn cancel" title="取消 (Esc)">
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CoordinateInput
