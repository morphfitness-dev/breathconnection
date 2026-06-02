import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function UploadModal({ session, onClose, onUploaded }) {
  const [step, setStep] = useState('idle') // 'idle' | 'uploading' | 'done' | 'error'
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef()

  async function getToken() {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token
  }

  async function handleUpload() {
    if (!file) return
    setStep('uploading')
    setProgress(0)
    try {
      const token = await getToken()
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/videos/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: session.id }),
      })
      if (!res.ok) throw new Error('Failed to get upload URL')
      const { upload_url } = await res.json()

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload failed: ${xhr.status}`))
        })
        xhr.addEventListener('error', () => reject(new Error('Network error')))
        xhr.open('PUT', upload_url)
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
        xhr.send(file)
      })

      setStep('done')
    } catch (e) {
      console.error('Upload error:', e)
      setStep('error')
    }
  }

  function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-serif text-xl text-[#0D5C63]">Upload Video</h2>
            <p className="font-sans text-sm text-gray-500 mt-0.5">{session.title}</p>
          </div>
          {step !== 'uploading' && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4">×</button>
          )}
        </div>

        {step === 'idle' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#0D5C63] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div>
                  <p className="font-sans font-medium text-gray-700">{file.name}</p>
                  <p className="font-sans text-sm text-gray-400 mt-1">{formatBytes(file.size)}</p>
                </div>
              ) : (
                <div>
                  <p className="font-sans text-gray-500 text-sm">Click to select a video file</p>
                  <p className="font-sans text-gray-400 text-xs mt-1">.mp4, .mov, .avi</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.mov,.avi,video/*"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            <button
              onClick={handleUpload}
              disabled={!file}
              className="w-full bg-[#0D5C63] text-white font-sans font-medium py-3 rounded-xl hover:bg-[#094a50] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Upload Video
            </button>
          </div>
        )}

        {step === 'uploading' && (
          <div className="space-y-4">
            <p className="font-sans text-sm text-gray-600 text-center">Uploading… {progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-[#0D5C63] h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="font-sans text-xs text-gray-400 text-center">Please don't close this window</p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="text-3xl">✓</div>
            <p className="font-sans font-medium text-gray-700">Uploaded — Mux is processing your video.</p>
            <p className="font-sans text-sm text-gray-500">This usually takes 1–5 minutes.</p>
            <p className="font-sans text-sm text-gray-500">The session will show 🟡 Processing until ready.</p>
            <button
              onClick={() => { onUploaded(); onClose() }}
              className="bg-[#0D5C63] text-white font-sans font-medium py-2.5 px-6 rounded-xl hover:bg-[#094a50] transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center space-y-4">
            <p className="font-sans font-medium text-red-600">Upload failed. Please try again.</p>
            <button
              onClick={() => { setStep('idle'); setProgress(0) }}
              className="bg-[#0D5C63] text-white font-sans font-medium py-2.5 px-6 rounded-xl hover:bg-[#094a50] transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
