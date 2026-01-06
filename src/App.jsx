import React, { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import { LayerProvider } from './contexts/LayerContext'
import { ToolProvider } from './contexts/ToolContext'
import { HistoryProvider } from './contexts/HistoryContext'
import { CoordinateProvider } from './contexts/CoordinateContext'
import { MarkerProvider } from './contexts/MarkerContext'
import { storageManager } from './utils/localStorage'
import { showServerStatusMessage } from './utils/serverCheck'
import './styles/App.css'

function App() {
  const [mapImage, setMapImage] = useState(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const canvasRef = useRef(null)

  const handleImageLoad = (image, width, height) => {
    setMapImage(image)
    setCanvasSize({ width, height })
  }

  // 跳转到指定标记点
  const handleJumpToMarker = (marker) => {
    if (canvasRef.current) {
      // 触发跳转事件，Canvas 组件会处理
      window.dispatchEvent(new CustomEvent('jumpToMarker', {
        detail: { marker }
      }))
    }
  }

  // 应用启动时检查后端服务状态
  useEffect(() => {
    showServerStatusMessage()
  }, [])

  // 应用启动时自动加载保存的数据
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedData = await storageManager.loadData()
      if (savedData && savedData.mapImage) {
        const img = new Image()
        img.onload = () => {
          setMapImage(img)
          setCanvasSize({
            width: savedData.canvasWidth || img.width,
            height: savedData.canvasHeight || img.height
          })

          // 触发图层加载事件
          if (savedData.layers && savedData.layers.length > 0) {
            window.dispatchEvent(new CustomEvent('layersLoaded', {
              detail: { layers: savedData.layers }
            }))
          }

          setIsLoading(false)
        }
        img.onerror = () => {
          console.error('加载保存的图片失败')
          setIsLoading(false)
        }
        img.src = savedData.mapImage
      } else {
        setIsLoading(false)
      }
      } catch (error) {
        console.error('加载数据失败:', error)
        setIsLoading(false)
      }
    }

    loadSavedData()
  }, [])

  // 监听清除数据事件
  useEffect(() => {
    const handleImageCleared = () => {
      setMapImage(null)
      setCanvasSize({ width: 0, height: 0 })
      setIsLoading(false)
    }

    window.addEventListener('imageCleared', handleImageCleared)
    return () => window.removeEventListener('imageCleared', handleImageCleared)
  }, [])

  return (
    <ToolProvider>
      <HistoryProvider>
        <CoordinateProvider>
          <MarkerProvider>
            <LayerProvider>
              <KeyboardShortcuts />
              <div className="app-container">
                <Sidebar
                  mapImage={mapImage}
                  canvasSize={canvasSize}
                  onJumpToMarker={handleJumpToMarker}
                />
                <div className="main-content">
                  {isLoading ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      color: '#7f8c8d'
                    }}>
                      <div>
                        <h3>正在加载保存的数据...</h3>
                      </div>
                    </div>
                  ) : (
                    <Canvas
                      mapImage={mapImage}
                      canvasSize={canvasSize}
                      onImageLoad={handleImageLoad}
                      ref={canvasRef}
                    />
                  )}
                </div>
              </div>
            </LayerProvider>
          </MarkerProvider>
        </CoordinateProvider>
      </HistoryProvider>
    </ToolProvider>
  )
}

export default App
