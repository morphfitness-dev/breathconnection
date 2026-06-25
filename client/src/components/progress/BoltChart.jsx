import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Label,
} from 'recharts'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function BoltChart({ data }) {
  const chartData = data.map(d => ({
    date: formatDate(d.date),
    score: d.score,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#9ca3af' }} />
        <YAxis domain={[0, 'auto']} tick={{ fontFamily: 'DM Sans', fontSize: 11, fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(val) => [`${val}s`, 'BOLT Score']}
        />
        <ReferenceLine y={20} stroke="#F59E0B" strokeDasharray="4 4">
          <Label value="Average" position="right" fill="#F59E0B" fontSize={11} fontFamily="DM Sans" />
        </ReferenceLine>
        <ReferenceLine y={30} stroke="#0D5C63" strokeDasharray="4 4">
          <Label value="Good" position="right" fill="#0D5C63" fontSize={11} fontFamily="DM Sans" />
        </ReferenceLine>
        <Line
          type="monotone"
          dataKey="score"
          stroke="#0D5C63"
          strokeWidth={2.5}
          dot={{ fill: '#0D5C63', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
