export default function SliderInput({ label, value, onChange, min = 1, max = 5, labelMap }) {
  return (
    <div className="mb-6">
      <label className="block font-sans text-sm font-medium text-gray-700 mb-3">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#0D5C63] h-2 cursor-pointer"
      />
      <div className="flex justify-between font-sans text-xs text-gray-400 mt-1">
        <span>{labelMap[min]}</span>
        <span className="text-[#0D5C63] font-medium">{labelMap[value]}</span>
        <span>{labelMap[max]}</span>
      </div>
    </div>
  )
}
