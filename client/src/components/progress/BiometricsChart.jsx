import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function BiometricsChart({ data }) {
  const chartData = data.map(d => ({
    date: formatDate(d.recorded_at),
    restingHeartRate: d.resting_heart_rate,
    sleepHours: d.sleep_hours,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#9ca3af' }} />
        <YAxis yAxisId="left" tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#9ca3af' }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(val, name) => [val, name === 'restingHeartRate' ? 'Resting HR (bpm)' : 'Sleep (hrs)']}
        />
        <Line yAxisId="left" type="monotone" dataKey="restingHeartRate" stroke="#0D5C63" strokeWidth={2.5}
          dot={{ fill: '#0D5C63', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls />
        <Line yAxisId="right" type="monotone" dataKey="sleepHours" stroke="#E8A87C" strokeWidth={2}
          dot={{ fill: '#E8A87C', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} strokeDasharray="4 4" connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}
