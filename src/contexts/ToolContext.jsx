import React, { createContext, useContext, useState } from 'react'

const ToolContext = createContext()

export const useTool = () => {
  const context = useContext(ToolContext)
  if (!context) {
    throw new Error('useTool must be used within a ToolProvider')
  }
  return context
}

export const ToolProvider = ({ children }) => {
  const [currentTool, setCurrentTool] = useState('pan')
  const [toolOptions, setToolOptions] = useState({
    pen: { size: 4 },
    text: { fontSize: 16, color: '#e74c3c' },
    eraser: { size: 5 },
    coordinate: { size: 10, color: '#e74c3c', fontSize: 16, textColor: '#e74c3c' }
  })
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')

  const updateToolOption = (tool, option, value) => {
    setToolOptions(prev => ({
      ...prev,
      [tool]: {
        ...prev[tool],
        [option]: value
      }
    }))
  }

  const value = {
    currentTool,
    setCurrentTool,
    toolOptions,
    updateToolOption,
    backgroundColor,
    setBackgroundColor
  }

  return (
    <ToolContext.Provider value={value}>
      {children}
    </ToolContext.Provider>
  )
}
