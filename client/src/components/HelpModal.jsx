import { useState } from 'react'

export default function HelpModal({ onClose }) {
  const [tab, setTab] = useState('bolt')
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        <h2 className="font-serif text-2xl text-[#0D5C63] mb-4">Help</h2>
        <div className="flex gap-2 mb-6">
          {[['bolt', 'BOLT Score'], ['contact', 'Contact']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`font-sans text-sm px-4 py-1.5 rounded-full transition-colors ${tab === t ? 'bg-[#0D5C63] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'bolt' && (
          <div className="font-sans text-sm text-gray-600 leading-relaxed space-y-3">
            <p><strong className="text-gray-800">What is the BOLT score?</strong></p>
            <p>The Body Oxygen Level Test (BOLT) measures your CO₂ tolerance — a key indicator of breathing efficiency and overall breathing health.</p>
            <p><strong>How to measure it:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Breathe in and out normally through your nose.</li>
              <li>After a relaxed exhale, pinch your nose closed.</li>
              <li>Start a timer and hold until you feel the first definite urge to breathe.</li>
              <li>Release and breathe normally. Record the time in seconds.</li>
            </ol>
            <p className="text-xs text-gray-400 mt-2">Stop the hold at the first urge — not when you feel desperate. The test should not cause discomfort.</p>
            <div className="bg-gray-50 rounded-xl p-4 mt-2 space-y-1 text-xs">
              <p><span className="text-amber-600 font-medium">Below 10s</span> — Very low</p>
              <p><span className="text-amber-500 font-medium">10–20s</span> — Below average</p>
              <p><span className="text-[#0D5C63] font-medium">20–30s</span> — Average</p>
              <p><span className="text-green-600 font-medium">Above 30s</span> — Good</p>
            </div>
          </div>
        )}
        {tab === 'contact' && (
          <div className="font-sans text-sm text-gray-600 leading-relaxed space-y-3">
            <p><strong className="text-gray-800">Contact us</strong></p>
            <p>For support or questions about your programme, email us at:</p>
            <a href="mailto:support@breathconnection.com"
              className="inline-block bg-[#0D5C63]/10 text-[#0D5C63] font-medium px-4 py-2 rounded-lg hover:bg-[#0D5C63]/20 transition-colors">
              support@breathconnection.com
            </a>
            <p className="text-xs text-gray-400 mt-4">
              The Breath Connection is a wellness practice tool. For medical concerns, please consult your healthcare provider.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
