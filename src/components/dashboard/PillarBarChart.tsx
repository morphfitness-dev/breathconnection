"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PillarWeek {
  week: number;
  biomechanics: number;
  biochemistry: number;
  neurophysiology: number;
}

interface Props {
  data: PillarWeek[];
}

export default function PillarBarChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: `Week ${d.week}`,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={formatted}
        margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#6B7280" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6B7280" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar
          dataKey="biomechanics"
          stackId="pillar"
          fill="#0D9488"
          name="Biomechanics"
          isAnimationActive
          animationDuration={600}
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="biochemistry"
          stackId="pillar"
          fill="#D85A30"
          name="Biochemistry"
          isAnimationActive
          animationDuration={700}
        />
        <Bar
          dataKey="neurophysiology"
          stackId="pillar"
          fill="#7F77DD"
          name="Neurophysiology"
          isAnimationActive
          animationDuration={800}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
