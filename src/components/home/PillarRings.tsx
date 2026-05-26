"use client";

import { motion } from "framer-motion";
import type { PillarRingData } from "@/server/routers/home";

interface PillarRingsProps {
  pillarRings: PillarRingData;
}

const RING_SIZE = 80;
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface RingProps {
  label: string;
  sessions: number;
  target: number;
  colour: string;
}

function Ring({ label, sessions, target, colour }: RingProps) {
  const pct = Math.min(sessions / target, 1);
  const offset = CIRCUMFERENCE * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        {/* Track */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={STROKE_WIDTH}
        />
        {/* Progress */}
        <motion.circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={colour}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill={colour}
        >
          {sessions}
        </text>
      </svg>
      <div className="text-center">
        <p className="text-xs font-semibold text-[#085041]">{label}</p>
        <p className="text-xs text-[#085041]/50">{sessions}/{target} sessions</p>
      </div>
    </div>
  );
}

export default function PillarRings({ pillarRings }: PillarRingsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-6">
      <p className="text-sm font-semibold text-[#085041] mb-5">This week</p>
      <div className="flex justify-around">
        <Ring
          label="Biomechanics"
          sessions={pillarRings.biomechanics}
          target={pillarRings.target}
          colour="#1D9E75"
        />
        <Ring
          label="Biochemistry"
          sessions={pillarRings.biochemistry}
          target={pillarRings.target}
          colour="#D85A30"
        />
        <Ring
          label="Neurophysiology"
          sessions={pillarRings.neurophysiology}
          target={pillarRings.target}
          colour="#7F77DD"
        />
      </div>
    </div>
  );
}
