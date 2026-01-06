import React, { useEffect, useRef, useState } from 'react'
import './TextInput.css'

const TextInput = ({ x, y, text, fontSize, color, onSave, onCancel, onDelete, isEdit }) => {
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const [inputText, setInputText] = useState(text || '')
  const isMouseInsideRef = useRef(false)
  const blurTimeoutRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      // 延迟聚焦，确保组件完全渲染
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      }, 50)
    }
    
    return () => {
      // 清理定时器
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
      }
    }
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleSave = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    if (inputText.trim() || text) {
      onSave(inputText.trim() || text)
    } else {
      onCancel()
    }
  }

  const handleCancel = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    onCancel()
  }

  const handleBlur = (e) => {
    // 检查鼠标是否在容器内
    if (isMouseInsideRef.current) {
      return // 如果鼠标在容器内，不处理 blur
    }
    
    // 检查是否点击了保存或取消按钮
    const relatedTarget = e.relatedTarget
    if (relatedTarget && (
      relatedTarget.classList.contains('text-input-btn') ||
      relatedTarget.closest('.text-input-container')
    )) {
      return // 如果点击的是按钮或容器内的元素，不处理
    }
    
    // 延迟处理，给鼠标移动到输入框的时间
    blurTimeoutRef.current = setTimeout(() => {
      // 再次检查鼠标是否在容器内
      if (!isMouseInsideRef.current && inputRef.current) {
        handleSave()
      }
      blurTimeoutRef.current = null
    }, 200)
  }

  const handleMouseEnter = () => {
    isMouseInsideRef.current = true
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
  }

  const handleMouseLeave = () => {
    isMouseInsideRef.current = false
  }

  const handleContainerClick = (e) => {
    // 阻止事件冒泡到画布
    e.stopPropagation()
  }

  const handleContainerMouseDown = (e) => {
    // 阻止事件冒泡到画布，防止触发画布的鼠标事件
    e.stopPropagation()
  }

  return (
    <div 
      ref={containerRef}
      className="text-input-container"
      style={{
        left: `${x}px`,
        top: `${y}px`
      }}
      onClick={handleContainerClick}
      onMouseDown={handleContainerMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <input
        ref={inputRef}
        type="text"
        className="text-input"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          fontSize: `${fontSize}px`,
          color: color
        }}
        placeholder="输入文字..."
      />
      <div className="text-input-buttons">
        {isEdit && onDelete && (
          <button
            className="text-input-btn delete"
            onClick={(e) => {
              e.stopPropagation()
              handleCancel()
              onDelete()
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title="删除"
          >
            🗑
          </button>
        )}
        <button
          className="text-input-btn save"
          onClick={(e) => {
            e.stopPropagation()
            handleSave()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="保存 (Enter)"
        >
          ✓
        </button>
        <button
          className="text-input-btn cancel"
          onClick={(e) => {
            e.stopPropagation()
            handleCancel()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="取消 (Esc)"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default TextInput
