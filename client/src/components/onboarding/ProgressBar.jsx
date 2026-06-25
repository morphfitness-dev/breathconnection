export default function ProgressBar({ current, total }) {
  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300
              ${i < current ? 'bg-[#0D5C63]' : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className="font-sans text-xs text-gray-400 mt-2 text-right">Step {current} of {total}</p>
    </div>
  )
}
