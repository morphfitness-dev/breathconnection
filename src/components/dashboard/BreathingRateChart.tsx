"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MetricPoint {
  recordedAt: string | Date;
  value: number;
}

interface Props {
  data: MetricPoint[];
}

export default function BreathingRateChart({ data }: Props) {
  const formatted = data.map((d) => ({
    date: new Date(d.recordedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    value: d.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart
        data={formatted}
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
          unit="/min"
        />
        <Tooltip
          formatter={(value) => [`${String(value)}/min`, "Breathing Rate"]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#0D9488"
          strokeWidth={2}
          dot={{ r: 3, fill: "#0D9488" }}
          activeDot={{ r: 5 }}
          isAnimationActive
          animationDuration={600}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
