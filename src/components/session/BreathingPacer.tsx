"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "inhale" | "hold" | "exhale" | "holdOut";

interface BreathingPacerProps {
  inhaleSeconds?: number;
  holdSeconds?: number;
  exhaleSeconds?: number;
  holdOutSeconds?: number;
  running: boolean;
}

const PHASE_LABELS: Record<Phase, string> = {
  inhale: "Inhale",
  hold: "Hold",
  exhale: "Exhale",
  holdOut: "Hold",
};

export default function BreathingPacer({
  inhaleSeconds = 4,
  holdSeconds = 0,
  exhaleSeconds = 6,
  holdOutSeconds = 0,
  running,
}: BreathingPacerProps) {
  const [phase, setPhase] = useState<Phase>("inhale");
  const [timeLeft, setTimeLeft] = useState(inhaleSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>("inhale");
  const timeRef = useRef(inhaleSeconds);

  const phases: { phase: Phase; duration: number }[] = (
    [
      { phase: "inhale" as Phase, duration: inhaleSeconds },
      ...(holdSeconds > 0 ? [{ phase: "hold" as Phase, duration: holdSeconds }] : []),
      { phase: "exhale" as Phase, duration: exhaleSeconds },
      ...(holdOutSeconds > 0 ? [{ phase: "holdOut" as Phase, duration: holdOutSeconds }] : []),
    ] as { phase: Phase; duration: number }[]
  ).filter((p) => p.duration > 0);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Reset to inhale
    phaseRef.current = "inhale";
    timeRef.current = inhaleSeconds;
    setPhase("inhale");
    setTimeLeft(inhaleSeconds);

    intervalRef.current = setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);

      if (timeRef.current <= 0) {
        // Advance to next phase
        const currentIndex = phases.findIndex((p) => p.phase === phaseRef.current);
        const nextIndex = (currentIndex + 1) % phases.length;
        const next = phases[nextIndex];
        phaseRef.current = next.phase;
        timeRef.current = next.duration;
        setPhase(next.phase);
        setTimeLeft(next.duration);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const isExpanded = phase === "inhale" || phase === "hold";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 160,
            height: 160,
            background: "radial-gradient(circle, #1D9E7530 0%, transparent 70%)",
          }}
          animate={{ scale: isExpanded ? 1.15 : 0.85, opacity: isExpanded ? 1 : 0.4 }}
          transition={{ duration: isExpanded ? inhaleSeconds : exhaleSeconds, ease: "easeInOut" }}
        />
        {/* Main circle */}
        <motion.div
          className="rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1D9E75, #5DCAA5)" }}
          animate={{
            width: isExpanded ? 140 : 90,
            height: isExpanded ? 140 : 90,
          }}
          transition={{
            duration:
              phase === "inhale"
                ? inhaleSeconds
                : phase === "exhale"
                  ? exhaleSeconds
                  : 0.3,
            ease: "easeInOut",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="text-center text-white select-none"
            >
              <p className="text-xs font-semibold opacity-90">{PHASE_LABELS[phase]}</p>
              <p className="text-2xl font-bold tabular-nums">{timeLeft}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
      <p className="text-sm text-[#085041]/60">
        {inhaleSeconds}s inhale
        {holdSeconds > 0 ? ` · ${holdSeconds}s hold` : ""}
        {" "}· {exhaleSeconds}s exhale
        {holdOutSeconds > 0 ? ` · ${holdOutSeconds}s hold` : ""}
      </p>
    </div>
  );
}
