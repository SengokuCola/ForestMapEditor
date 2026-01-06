import React from 'react'
import './ZoomControls.css'

const ZoomControls = ({ scale, onZoomIn, onZoomOut, onReset }) => {
  return (
    <div className="zoom-controls">
      <button className="zoom-btn" onClick={onZoomIn}>+</button>
      <div className="zoom-info">{Math.round(scale * 100)}%</div>
      <button className="zoom-btn" onClick={onZoomOut}>-</button>
      <button className="zoom-btn" onClick={onReset} style={{ marginTop: '10px' }}>
        ⌂
      </button>
    </div>
  )
}

export default ZoomControls
