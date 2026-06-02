import MuxPlayer from '@mux/mux-player-react'

export default function PreviewModal({ session, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-black rounded-2xl overflow-hidden w-full max-w-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div>
            <h2 className="font-serif text-white text-lg">{session.title}</h2>
            <p className="font-sans text-white/50 text-xs">Preview</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="aspect-video">
          <MuxPlayer
            playbackId={session.mux_playback_id}
            streamType="on-demand"
            accentColor="#0D5C63"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  )
}
