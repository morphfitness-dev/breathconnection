import { useState, useEffect, useRef } from 'react'

export default function BreathPacer({ pillarColor = '#0D5C63', defaultInhale = 4, defaultExhale = 6 }) {
  const [inhale, setInhale] = useState(defaultInhale)
  const [exhale, setExhale] = useState(defaultExhale)
  const [phase, setPhase] = useState('inhale')
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(true)
  const frameRef = useRef()
  const startRef = useRef(Date.now())
  const phaseRef = useRef('inhale')
  const inhaleRef = useRef(inhale)
  const exhaleRef = useRef(exhale)

  useEffect(() => { inhaleRef.current = inhale }, [inhale])
  useEffect(() => { exhaleRef.current = exhale }, [exhale])

  useEffect(() => {
    if (!running) { cancelAnimationFrame(frameRef.current); return }
    startRef.current = Date.now()

    function tick() {
      const elapsed = (Date.now() - startRef.current) / 1000
      const duration = phaseRef.current === 'inhale' ? inhaleRef.current : exhaleRef.current
      const p = Math.min(elapsed / duration, 1)
      setProgress(p)

      if (p >= 1) {
        phaseRef.current = phaseRef.current === 'inhale' ? 'exhale' : 'inhale'
        setPhase(phaseRef.current)
        startRef.current = Date.now()
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [running])

  const size = phase === 'inhale'
    ? 160 + progress * 80
    : 240 - progress * 80

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      {/* Pacer circle */}
      <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
        <div
          className="rounded-full transition-none"
          style={{
            width: size,
            height: size,
            backgroundColor: pillarColor,
            opacity: 0.15,
            position: 'absolute',
          }}
        />
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: size * 0.7,
            height: size * 0.7,
            backgroundColor: pillarColor,
            position: 'absolute',
          }}
        >
          <span className="text-white font-sans font-medium text-lg select-none">
            {phase === 'inhale' ? 'Inhale' : 'Exhale'}
          </span>
        </div>
      </div>

      {/* Pause/resume */}
      <button
        onClick={() => setRunning(r => !r)}
        className="px-6 py-2 rounded-full border border-white/30 text-white font-sans text-sm hover:bg-white/10 transition-colors"
      >
        {running ? '⏸ Pause' : '▶ Resume'}
      </button>

      {/* Timing controls */}
      <div className="flex gap-8 text-white font-sans text-sm">
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/60 text-xs uppercase tracking-wide">Inhale</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setInhale(i => Math.max(2, i - 1))} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">−</button>
            <span className="w-8 text-center">{inhale}s</span>
            <button onClick={() => setInhale(i => Math.min(10, i + 1))} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">+</button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/60 text-xs uppercase tracking-wide">Exhale</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setExhale(e => Math.max(2, e - 1))} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">−</button>
            <span className="w-8 text-center">{exhale}s</span>
            <button onClick={() => setExhale(e => Math.min(12, e + 1))} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">+</button>
          </div>
        </div>
      </div>
    </div>
  )
}
