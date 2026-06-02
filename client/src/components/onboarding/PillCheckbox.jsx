export default function PillCheckbox({ label, selected, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-full border text-sm font-sans transition-colors text-left
        ${selected
          ? 'bg-[#0D5C63] text-white border-[#0D5C63]'
          : 'bg-white text-gray-700 border-gray-200 hover:border-[#0D5C63]'}
        ${disabled && !selected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {label}
    </button>
  )
}
