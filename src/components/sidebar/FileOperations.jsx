import React, { useRef, useEffect, useCallback } from 'react'
import { useLayers } from '../../contexts/LayerContext'
import { fileManager } from '../../utils/fileManager'
import { storageManager } from '../../utils/localStorage'
import './FileOperations.css'

const FileOperations = ({ mapImage, canvasSize }) => {
  const imageInputRef = useRef(null)
  const dataInputRef = useRef(null)
  const saveTimerRef = useRef(null)
  const { layers, setLayers, createLayer } = useLayers()

  // 防抖保存：当图片或图层变化时，延迟保存到本地存储
  useEffect(() => {
    if (mapImage && layers.length > 0) {
      // 清除之前的定时器
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      
      // 延迟 500ms 保存，避免频繁保存
      saveTimerRef.current = setTimeout(() => {
        storageManager.saveData(
          mapImage, 
          layers, 
          canvasSize.width, 
          canvasSize.height
        )
      }, 500)
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [mapImage, layers, canvasSize])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      fileManager.loadImage(file, (image, width, height) => {
        // 如果没有图层，先创建一个
        if (layers.length === 0) {
          createLayer('图层1')
        }
        // 触发父组件更新
        window.dispatchEvent(new CustomEvent('imageLoaded', { 
          detail: { image, width, height } 
        }))
      })
    }
  }

  const handleExport = () => {
    if (layers.length === 0) {
      alert('没有可导出的图层数据！')
      return
    }
    fileManager.exportData(layers, mapImage)
  }

  const handleImport = () => {
    dataInputRef.current?.click()
  }

  const handleDataImport = (e) => {
    const file = e.target.files[0]
    if (file) {
      fileManager.importData(file, (data) => {
        setLayers(data.layers || [])
        if (data.mapImage) {
          const img = new Image()
          img.onload = () => {
            window.dispatchEvent(new CustomEvent('imageLoaded', {
              detail: { 
                image: img, 
                width: data.canvasWidth || img.width, 
                height: data.canvasHeight || img.height 
              }
            }))
          }
          img.src = data.mapImage
        }
      })
    }
  }

  return (
    <div className="file-operations">
      <h3>文件操作</h3>
      <div className="file-buttons-row">
        <button
          className="file-btn file-btn-primary"
          onClick={() => imageInputRef.current?.click()}
          title="导入地图图片"
        >
          📁
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>
      <div className="file-buttons-row">
        <button className="file-btn file-btn-secondary" onClick={handleExport} title="导出所有图层">
          💾
        </button>
        <button className="file-btn file-btn-secondary" onClick={handleImport} title="导入图层数据">
          📥
        </button>
        <input
          ref={dataInputRef}
          type="file"
          accept=".json"
          onChange={handleDataImport}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}

export default FileOperations
