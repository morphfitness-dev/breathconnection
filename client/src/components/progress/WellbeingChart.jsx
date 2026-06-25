import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function WellbeingChart({ data }) {
  const chartData = data.map(d => ({
    date: formatDate(d.created_at),
    wellbeing: d.wellbeing_score,
    energy: d.energy_score,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#9ca3af' }} />
        <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(val, name) => [val, name === 'wellbeing' ? 'Wellbeing' : 'Energy']}
        />
        <Line type="monotone" dataKey="wellbeing" stroke="#0D5C63" strokeWidth={2.5}
          dot={{ fill: '#0D5C63', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="energy" stroke="#E8A87C" strokeWidth={2}
          dot={{ fill: '#E8A87C', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} strokeDasharray="4 4" />
      </LineChart>
    </ResponsiveContainer>
  )
}
