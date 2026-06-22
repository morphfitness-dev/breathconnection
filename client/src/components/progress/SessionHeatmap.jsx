const PILLAR_COLORS = {
  biomechanics: '#3B82F6',
  biochemistry: '#8B5CF6',
  neurophysiology: '#F59E0B',
  integration: '#0D5C63',
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function SessionHeatmap({ completions }) {
  // Build a map of date string → pillar
  const dateMap = {}
  for (const c of completions) {
    const d = new Date(c.completed_at)
    const key = d.toISOString().slice(0, 10)
    dateMap[key] = c.pillar
  }

  // Build 8 weeks of days, ending today
  const today = new Date()
  // Find last Sunday (or today if Sunday)
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon...
  // We want weeks Mon–Sun. Find the Monday 8 weeks ago.
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const lastMonday = new Date(today)
  lastMonday.setDate(today.getDate() - mondayOffset)

  // Start = 8 weeks before lastMonday
  const startDate = new Date(lastMonday)
  startDate.setDate(lastMonday.getDate() - 7 * 7) // 7 weeks back = 8 weeks total

  // Build weeks array: 8 weeks, each with 7 days
  const weeks = []
  for (let w = 0; w < 8; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + w * 7 + d)
      const key = date.toISOString().slice(0, 10)
      week.push({ date: key, pillar: dateMap[key] || null, isFuture: date > today })
    }
    weeks.push(week)
  }

  // Week labels (show month/day of Monday of each week)
  const weekLabels = weeks.map(week => {
    const d = new Date(week[0].date)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  })

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1.5 min-w-max">
        {/* Day labels column */}
        <div className="flex flex-col gap-1.5 pt-7">
          {DAY_LABELS.map(label => (
            <div key={label} className="h-8 flex items-center">
              <span className="font-sans text-xs text-gray-400 w-8">{label}</span>
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5">
            <span className="font-sans text-xs text-gray-400 mb-0.5 whitespace-nowrap" style={{ height: 20 }}>
              {weekLabels[wi]}
            </span>
            {week.map((day, di) => {
              const color = day.pillar ? PILLAR_COLORS[day.pillar] : null
              return (
                <div
                  key={di}
                  title={day.date + (day.pillar ? ` — ${day.pillar}` : '')}
                  className="w-8 h-8 rounded-md"
                  style={{
                    backgroundColor: color || (day.isFuture ? '#f9fafb' : '#e5e7eb'),
                    border: day.isFuture ? '1px dashed #d1d5db' : 'none',
                    opacity: day.isFuture ? 0.4 : 1,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Pillar legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {Object.entries(PILLAR_COLORS).map(([pillar, color]) => (
          <div key={pillar} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="font-sans text-xs text-gray-500 capitalize">{pillar}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-200" />
          <span className="font-sans text-xs text-gray-500">No session</span>
        </div>
      </div>
    </div>
  )
}
