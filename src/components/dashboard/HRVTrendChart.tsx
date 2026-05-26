"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MetricPoint {
  recordedAt: string | Date;
  value: number;
}

interface Props {
  data: MetricPoint[];
}

function computeRolling7(
  data: { date: string; value: number }[]
): (number | null)[] {
  return data.map((_, i) => {
    const window = data.slice(Math.max(0, i - 6), i + 1);
    if (window.length === 0) return null;
    const avg = window.reduce((sum, d) => sum + d.value, 0) / window.length;
    return Math.round(avg * 10) / 10;
  });
}

export default function HRVTrendChart({ data }: Props) {
  const formatted = data.map((d) => ({
    date: new Date(d.recordedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    value: d.value,
  }));

  const rolling = computeRolling7(formatted);

  const chartData = formatted.map((d, i) => ({
    ...d,
    rolling7: rolling[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#6B7280" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6B7280" }}
          tickLine={false}
          axisLine={false}
          unit="ms"
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value: string) =>
            value === "value" ? "HRV RMSSD" : "7-day avg"
          }
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#7F77DD"
          strokeWidth={2}
          dot={{ r: 3, fill: "#7F77DD" }}
          activeDot={{ r: 5 }}
          name="value"
          isAnimationActive
          animationDuration={600}
        />
        <Line
          type="monotone"
          dataKey="rolling7"
          stroke="#C4C1F0"
          strokeWidth={2}
          dot={false}
          name="rolling7"
          strokeDasharray="5 3"
          isAnimationActive
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
