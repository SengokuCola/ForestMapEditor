import React, { useRef } from 'react'
import { useLayers } from '../../contexts/LayerContext'
import { storageManager } from '../../utils/localStorage'
import './ClearData.css'

const ClearData = () => {
  const imageInputRef = useRef(null)
  const dataInputRef = useRef(null)
  const { setLayers } = useLayers()

  const handleClear = async () => {
    if (confirm('确定要清除保存的数据吗？')) {
      await storageManager.clearData()
      // 清除当前状态
      setLayers([])
      // 重置文件输入框
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
      if (dataInputRef.current) {
        dataInputRef.current.value = ''
      }
      // 触发图片清除事件
      window.dispatchEvent(new CustomEvent('imageCleared'))
      alert('数据已清除')
    }
  }

  return (
    <div className="clear-data">
      <button
        className="clear-data-btn"
        onClick={handleClear}
        title="清除本地数据"
      >
        🗑️ 清除所有数据
      </button>
    </div>
  )
}

export default ClearData
