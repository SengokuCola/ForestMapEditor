import React, { useState, useRef } from 'react'
import { useMarkers } from '../../contexts/MarkerContext'
import './MarkerList.css'

const MarkerList = ({ onJumpToMarker }) => {
  const { markers, selectedMarkerId, selectMarker, deleteMarker, updateMarker } = useMarkers()
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const inputRef = useRef(null)

  const handleStartEdit = (marker, e) => {
    e.stopPropagation()
    setEditingId(marker.id)
    setEditingText(marker.text || '')
  }

  const handleSaveEdit = (id, e) => {
    e.stopPropagation()
    updateMarker(id, { text: editingText })
    setEditingId(null)
    setEditingText('')
  }

  const handleCancelEdit = (e) => {
    e.stopPropagation()
    setEditingId(null)
    setEditingText('')
  }

  const handleKeyDown = (id, e) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id, e)
    } else if (e.key === 'Escape') {
      handleCancelEdit(e)
    }
  }

  const handleDelete = (id, e) => {
    e.stopPropagation()
    if (confirm('确定要删除这个标记点吗？')) {
      deleteMarker(id)
    }
  }

  const handleJump = (marker, e) => {
    e.stopPropagation()
    if (onJumpToMarker) {
      onJumpToMarker(marker)
    }
  }

  return (
    <div className="marker-list-section">
      <h3>标记点列表 ({markers.length})</h3>
      <div className="marker-list">
        {markers.length === 0 ? (
          <div className="empty-markers">
            <p>暂无标记点</p>
            <p className="hint">使用坐标点工具在地图上点击添加标记</p>
          </div>
        ) : (
          markers.map(marker => (
            <div
              key={marker.id}
              className={`marker-item ${selectedMarkerId === marker.id ? 'active' : ''}`}
              onClick={() => selectMarker(marker.id)}
            >
              <div
                className="marker-color-indicator"
                style={{ backgroundColor: marker.color }}
              />
              <div className="marker-info">
                {editingId === marker.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    className="marker-text-input"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(marker.id, e)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => handleSaveEdit(marker.id, e)}
                    autoFocus
                  />
                ) : (
                  <span className="marker-text">
                    {marker.text || `标记点 #${marker.id}`}
                  </span>
                )}
              </div>
              <div className="marker-controls">
                <button
                  className="marker-btn"
                  onClick={(e) => handleJump(marker, e)}
                  title="跳转到标记"
                >
                  📍
                </button>
                <button
                  className="marker-btn"
                  onClick={(e) => handleStartEdit(marker, e)}
                  title="编辑"
                >
                  ✏️
                </button>
                <button
                  className="marker-btn"
                  onClick={(e) => handleDelete(marker.id, e)}
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MarkerList
