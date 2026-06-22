const PILLAR_STYLES = {
  biomechanics:    { label: 'Biomechanics',    bg: 'bg-blue-100',   text: 'text-blue-700' },
  biochemistry:    { label: 'Biochemistry',    bg: 'bg-purple-100', text: 'text-purple-700' },
  neurophysiology: { label: 'Neurophysiology', bg: 'bg-amber-100',  text: 'text-amber-700' },
  integration:     { label: 'Integration',     bg: 'bg-teal-100',   text: 'text-[#0D5C63]' },
}

export default function PillarBadge({ pillar }) {
  const s = PILLAR_STYLES[pillar] || PILLAR_STYLES.integration
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-sans font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}
