import React from 'react'
import { useLayers } from '../../contexts/LayerContext'
import LayerList from './LayerList'
import './LayerManager.css'

const LayerManager = () => {
  const { createLayer, layers } = useLayers()

  const handleCreateLayer = () => {
    // 自动生成图层名称：图层1、图层2、图层3...
    // 由于新图层在数组开头，需要计算正确的编号
    const defaultName = `图层${layers.length + 1}`
    createLayer(defaultName)
  }

  return (
    <div className="layer-manager">
      <h3>图层管理</h3>
      <button className="btn btn-secondary" onClick={handleCreateLayer}>
        ➕ 新建图层
      </button>
      <LayerList />
    </div>
  )
}

export default LayerManager
