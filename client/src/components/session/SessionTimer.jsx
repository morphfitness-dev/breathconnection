import { useState, useEffect, useRef } from 'react'

export default function SessionTimer({ durationMinutes = 10, onComplete }) {
  const totalSeconds = durationMinutes * 60
  const [remaining, setRemaining] = useState(totalSeconds)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef()

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { clearInterval(intervalRef.current); onComplete?.(); return 0 }
          return r - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div className="flex items-center gap-3">
      <span className="font-sans text-lg font-medium tabular-nums">{mm}:{ss}</span>
      <button
        onClick={() => setRunning(r => !r)}
        className="text-sm px-3 py-1 rounded-full border border-current opacity-70 hover:opacity-100"
      >
        {running ? 'Pause' : 'Start'}
      </button>
    </div>
  )
}
