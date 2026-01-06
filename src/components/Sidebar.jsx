import React from 'react'
import FileOperations from './sidebar/FileOperations'
import ToolSelector from './sidebar/ToolSelector'
import LayerManager from './sidebar/LayerManager'
import ToolOptions from './sidebar/ToolOptions'
import BackgroundColor from './sidebar/BackgroundColor'
import MarkerList from './sidebar/MarkerList'
import ClearData from './sidebar/ClearData'
import { useTool } from '../contexts/ToolContext'
import '../styles/Sidebar.css'

const Sidebar = ({ mapImage, canvasSize, onJumpToMarker }) => {
  const { currentTool } = useTool()

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <h2>🗺️ 地图编辑器</h2>

        <FileOperations mapImage={mapImage} canvasSize={canvasSize} />
        <ToolSelector />
        <MarkerList onJumpToMarker={onJumpToMarker} />
        <LayerManager />
        {currentTool !== 'pan' && <ToolOptions />}
        <BackgroundColor />
      </div>

      <ClearData />
    </div>
  )
}

export default Sidebar
