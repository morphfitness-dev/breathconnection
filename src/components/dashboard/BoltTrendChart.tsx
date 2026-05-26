"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { DotItemDotProps } from "recharts";
import type { ReactNode } from "react";

interface BoltDataPoint {
  id: string;
  testedAt: string | Date;
  seconds: number;
  isPersonalRecord: boolean;
}

interface ChartRow extends BoltDataPoint {
  date: string;
}

interface Props {
  data: BoltDataPoint[];
}

function CustomBoltDot(props: DotItemDotProps): ReactNode {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined) return null;

  const row = payload as ChartRow | undefined;
  const isPR = row?.isPersonalRecord ?? false;

  if (isPR) {
    return (
      <circle
        key={`dot-pr-${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={7}
        fill="#F59E0B"
        stroke="#fff"
        strokeWidth={2}
      />
    );
  }
  return (
    <circle
      key={`dot-${cx}-${cy}`}
      cx={cx}
      cy={cy}
      r={4}
      fill="#1D9E75"
      stroke="#fff"
      strokeWidth={1.5}
    />
  );
}

export default function BoltTrendChart({ data }: Props) {
  const formatted: ChartRow[] = data.map((d) => ({
    ...d,
    date: new Date(d.testedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
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
          domain={["auto", "auto"]}
          tick={{ fontSize: 11, fill: "#6B7280" }}
          tickLine={false}
          axisLine={false}
          unit="s"
        />
        <Tooltip
          formatter={(value) => [`${String(value)}s`, "BOLT"]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            fontSize: 12,
          }}
        />
        <ReferenceLine
          y={15}
          stroke="#F59E0B"
          strokeDasharray="4 3"
          label={{ value: "15s", position: "right", fontSize: 10, fill: "#F59E0B" }}
        />
        <ReferenceLine
          y={25}
          stroke="#1D9E75"
          strokeDasharray="4 3"
          label={{ value: "25s", position: "right", fontSize: 10, fill: "#1D9E75" }}
        />
        <ReferenceLine
          y={35}
          stroke="#085041"
          strokeDasharray="4 3"
          label={{ value: "35s", position: "right", fontSize: 10, fill: "#085041" }}
        />
        <Line
          type="monotone"
          dataKey="seconds"
          stroke="#1D9E75"
          strokeWidth={2}
          dot={CustomBoltDot}
          activeDot={{ r: 6 }}
          isAnimationActive
          animationDuration={600}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
