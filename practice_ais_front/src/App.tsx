import { useState } from 'react'
import axios from 'axios'
import { useDropzone } from 'react-dropzone'
import './App.css'

interface DetectionResult {
  video_url: string
  counts: number[]
}

export default function App() {
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'video/*': ['.mp4', '.mov']
    },
    multiple: false,
    onDrop: async (files) => {
      if (files.length === 0) return
      await processVideo(files[0])
    }
  })

  const processVideo = async (file: File) => {
    try {
      setLoading(true)
      setProgress(0)
      
      const formData = new FormData()
      formData.append('video', file)

      const { data } = await axios.post<DetectionResult>(
        'http://localhost:5000/process',
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            )
            setProgress(percent)
          },
          responseType: 'json'
        }
      )

      setResult(data)
    } catch (error) {
      console.error("Детали ошибки:", error.response?.data || error.message);
      alert("Ошибка: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setResult(null)
    setProgress(0)
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🚢 Распознавание кораблей в порту</h1>
        <p className="description">
          Загрузите видео портовой зоны для анализа. Наш алгоритм автоматически определит 
          количество судов в кадре и предоставит подробную статистику!
        </p>
      </header>

      {!result && (
        <div 
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          {loading ? (
            <div className="progress-container">
              <div className="progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${progress}%` }}
                >
                  {progress}%
                </div>
              </div>
              <button 
                className="button cancel-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setLoading(false)
                }}
              >
                Отменить
              </button>
            </div>
          ) : (
            <div className="dropzone-content">
              <div className="upload-icon">📤</div>
              <p>Перетащите видео сюда или кликните для выбора</p>
              <small>Поддерживаемые форматы: MP4, MOV</small>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="result">
          <div className="result-header">
            <h2>🎉 Результаты распознавания</h2>
            <button className="button new-file-btn" onClick={resetForm}>
              Начать заново
            </button>
          </div>
          
          <div className="video-container">
            <video 
              controls 
              src={`http://localhost:5000${result.video_url}`}
            />
          </div>

          <div className="stats">
            <h3>📊 Статистика распознавания</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{Math.max(...result.counts)}</div>
                <div className="stat-label">Максимум в кадре</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {(result.counts.reduce((a, b) => a + b, 0) / result.counts.length).toFixed(1)}
                </div>
                <div className="stat-label">Среднее значение</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}