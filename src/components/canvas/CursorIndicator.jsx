import React from 'react'
import './CursorIndicator.css'

const CursorIndicator = ({ size, type, scale = 1, style }) => {
  if (!size || size <= 0) return null

  const displaySize = size * scale

  return (
    <div
      className={`cursor-indicator cursor-indicator-${type}`}
      style={{
        ...style,
        width: `${displaySize}px`,
        height: `${displaySize}px`,
        marginLeft: `-${displaySize / 2}px`,
        marginTop: `-${displaySize / 2}px`
      }}
    />
  )
}

export default CursorIndicator
