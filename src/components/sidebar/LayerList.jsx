import React, { useState, useCallback, useRef } from 'react'
import { useLayers } from '../../contexts/LayerContext'
import './LayerList.css'

const LayerList = () => {
  const {
    layers,
    currentLayerIndex,
    setCurrentLayer,
    toggleLayerVisibility,
    deleteLayer,
    renameLayer,
    updateLayerColor,
    updateLayerOpacity,
    moveLayer
  } = useLayers()

  const [editingIndex, setEditingIndex] = useState(null)
  const [editingName, setEditingName] = useState('')
  const colorChangeTimeoutRef = useRef(null)
  const opacityChangeTimeoutRef = useRef(null)
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const handleDelete = (index, e) => {
    e.stopPropagation()
    if (layers.length <= 1) {
      alert('至少需要保留一个图层！')
      return
    }
    if (confirm(`确定要删除图层"${layers[index].name}"吗？`)) {
      try {
        deleteLayer(index)
      } catch (error) {
        alert(error.message)
      }
    }
  }

  const handleStartRename = (index, e) => {
    e.stopPropagation()
    setEditingIndex(index)
    setEditingName(layers[index].name)
  }

  const handleRename = (index, e) => {
    e.stopPropagation()
    if (editingName.trim() === '') {
      alert('图层名称不能为空')
      return
    }
    try {
      renameLayer(index, editingName)
      setEditingIndex(null)
      setEditingName('')
    } catch (error) {
      alert(error.message)
    }
  }

  const handleCancelRename = (e) => {
    e.stopPropagation()
    setEditingIndex(null)
    setEditingName('')
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Enter') {
      handleRename(index, e)
    } else if (e.key === 'Escape') {
      handleCancelRename(e)
    }
  }

  // 防抖处理颜色变化
  const handleColorChange = useCallback((index, color) => {
    // 清除之前的定时器
    if (colorChangeTimeoutRef.current) {
      clearTimeout(colorChangeTimeoutRef.current)
    }

    // 立即更新状态（不触发重绘）
    // 使用防抖延迟触发重绘事件
    colorChangeTimeoutRef.current = setTimeout(() => {
      updateLayerColor(index, color)
    }, 100) // 100ms 防抖
  }, [updateLayerColor])

  // 防抖处理透明度变化
  const handleOpacityChange = useCallback((index, opacity) => {
    // 清除之前的定时器
    if (opacityChangeTimeoutRef.current) {
      clearTimeout(opacityChangeTimeoutRef.current)
    }

    // 立即更新状态（不触发重绘）
    // 使用防抖延迟触发重绘事件
    opacityChangeTimeoutRef.current = setTimeout(() => {
      updateLayerOpacity(index, opacity)
    }, 100) // 100ms 防抖
  }, [updateLayerOpacity])

  // 拖拽开始
  const handleDragStart = useCallback((index) => {
    setDraggingIndex(index)
  }, [])

  // 拖拽经过
  const handleDragOver = useCallback((e, index) => {
    e.preventDefault()
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }, [dragOverIndex])

  // 拖拽离开
  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  // 拖拽结束
  const handleDrop = useCallback((index) => {
    if (draggingIndex !== null && draggingIndex !== index) {
      moveLayer(draggingIndex, index)
    }
    setDraggingIndex(null)
    setDragOverIndex(null)
  }, [draggingIndex, moveLayer])

  // 拖拽结束（未放置）
  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null)
    setDragOverIndex(null)
  }, [])

  // 组件卸载时清理定时器
  React.useEffect(() => {
    return () => {
      if (colorChangeTimeoutRef.current) {
        clearTimeout(colorChangeTimeoutRef.current)
      }
      if (opacityChangeTimeoutRef.current) {
        clearTimeout(opacityChangeTimeoutRef.current)
      }
    }
  }, [])

  // 反转数组顺序显示，最新的图层显示在最上面
  const reversedLayers = [...layers].reverse()

  return (
    <div className="layers-list">
      {reversedLayers.map((layer, displayIndex) => {
        // 计算实际数组索引（反转后的索引）
        const actualIndex = layers.length - 1 - displayIndex
        const isEditing = editingIndex === actualIndex

        return (
          <div
            key={layer.id}
            className={`layer-item ${actualIndex === currentLayerIndex ? 'active' : ''} ${draggingIndex === actualIndex ? 'dragging' : ''} ${dragOverIndex === actualIndex ? 'drag-over' : ''}`}
            onClick={() => setCurrentLayer(actualIndex)}
            draggable
            onDragStart={() => handleDragStart(actualIndex)}
            onDragOver={(e) => handleDragOver(e, actualIndex)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(actualIndex)}
            onDragEnd={handleDragEnd}
          >
            <div className="layer-name-container">
              {isEditing ? (
                <input
                  type="text"
                  className="layer-name-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(actualIndex, e)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => handleRename(actualIndex, e)}
                  autoFocus
                />
              ) : (
                <span className="layer-name">{layer.name}</span>
              )}
            </div>
            <div className="layer-controls">
              <input
                type="color"
                className="layer-color-picker"
                value={layer.color || '#000000'}
                onChange={(e) => {
                  e.stopPropagation()
                  handleColorChange(actualIndex, e.target.value)
                }}
                title="更改图层颜色"
                onClick={(e) => e.stopPropagation()}
              />
              <input
                type="range"
                className="layer-opacity-slider"
                min="0"
                max="100"
                value={(layer.opacity || 1) * 100}
                onChange={(e) => {
                  e.stopPropagation()
                  handleOpacityChange(actualIndex, parseInt(e.target.value) / 100)
                }}
                title={`透明度: ${Math.round((layer.opacity || 1) * 100)}%`}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                className="layer-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLayerVisibility(actualIndex)
                }}
                title="显示/隐藏"
              >
                {layer.visible ? '👁️' : '🚫'}
              </button>
              <button
                className="layer-btn"
                onClick={(e) => handleStartRename(actualIndex, e)}
                title="重命名"
              >
                ✏️
              </button>
              <button
                className="layer-btn"
                onClick={(e) => handleDelete(actualIndex, e)}
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default LayerList
