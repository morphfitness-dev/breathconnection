"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import BreathingPacer from "./BreathingPacer";
import VideoPlayer from "./VideoPlayer";
import type { Exercise, SessionExercise } from "@prisma/client";

type SessionExerciseWithExercise = SessionExercise & {
  exercise: Exercise & {
    video: { muxPlaybackId: string | null } | null;
  };
};

interface SessionPlayerProps {
  sessionId: string;
  exercises: SessionExerciseWithExercise[];
}

const MAX_RATING = 5;

export default function SessionPlayer({ sessionId, exercises }: SessionPlayerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"exercise" | "hold" | "done">("exercise");
  const [holdSecondsLeft, setHoldSecondsLeft] = useState(0);
  const [holdStarted, setHoldStarted] = useState(false);
  const [comfortMessage, setComfortMessage] = useState("");
  const [pacerRunning, setPacerRunning] = useState(false);
  const [sessionStartedAt] = useState(Date.now());
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdActualSecondsRef = useRef(0);

  const logExercise = trpc.session.logExercise.useMutation();
  const completeSession = trpc.session.complete.useMutation({
    onSuccess() {
      router.push("/home");
    },
  });

  const current = exercises[currentIndex];

  const totalElapsedSeconds = Math.floor((Date.now() - sessionStartedAt) / 1000);
  const totalDurationSeconds = exercises.reduce(
    (sum, se) => sum + se.exercise.durationSeconds,
    0
  );
  const progressPct = Math.min(
    (totalElapsedSeconds / (totalDurationSeconds || 1)) * 100,
    100
  );

  // Start pacer when we change exercise
  useEffect(() => {
    if (phase === "exercise") {
      setPacerRunning(true);
    }
    return () => {
      setPacerRunning(false);
    };
  }, [currentIndex, phase]);

  function startHold() {
    if (!current) return;
    const maxHold = current.exercise.breathHoldMax;
    if (maxHold <= 0) return;
    holdActualSecondsRef.current = 0;
    setHoldSecondsLeft(maxHold);
    setHoldStarted(true);
    setPhase("hold");
    setPacerRunning(false);

    holdIntervalRef.current = setInterval(() => {
      holdActualSecondsRef.current += 1;
      setHoldSecondsLeft((prev) => {
        if (prev <= 1) {
          stopHold();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopHold() {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    const held = holdActualSecondsRef.current;
    if (current) {
      logExercise.mutate({
        sessionId,
        exerciseId: current.exerciseId,
        order: current.order,
        maxHoldSeconds: held,
      });
    }
    setHoldStarted(false);
    setPhase("exercise");
    setPacerRunning(true);
  }

  function handleComfort() {
    stopHold();
    setComfortMessage("Rest taken — we've noted this");
    setTimeout(() => setComfortMessage(""), 3000);
  }

  function markExerciseComplete() {
    if (!current) return;
    // Log the exercise as complete
    logExercise.mutate({
      sessionId,
      exerciseId: current.exerciseId,
      order: current.order,
    });

    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((i) => i + 1);
      setPhase("exercise");
      setComfortMessage("");
    } else {
      setPhase("done");
      setPacerRunning(false);
    }
  }

  function handleSaveAndFinish() {
    const durationSeconds = Math.floor((Date.now() - sessionStartedAt) / 1000);
    completeSession.mutate({
      sessionId,
      durationSeconds,
      subjectiveRating: rating > 0 ? rating : undefined,
      userNotes: notes.trim() || undefined,
    });
  }

  if (phase === "done") {
    return (
      <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-8 space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🌿</div>
            <h1 className="text-2xl font-bold text-[#085041]">Session complete</h1>
            <p className="text-sm text-[#085041]/60 mt-2">Well done on showing up today.</p>
          </div>

          <div>
            <p className="text-sm font-medium text-[#085041] mb-3">How did that feel?</p>
            <div className="flex justify-center gap-3">
              {["😖", "😕", "😐", "🙂", "😊"].map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  className={`text-2xl w-12 h-12 rounded-full transition-all ${
                    rating === i + 1
                      ? "bg-[#1D9E75]/20 scale-110"
                      : "hover:bg-[#F5F3EE]"
                  }`}
                  aria-label={`Rating ${i + 1} of ${MAX_RATING}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#085041] block mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was your session?"
              rows={3}
              className="w-full border border-[#1D9E75]/20 rounded-xl p-3 text-sm text-[#1C1C1A] placeholder-[#085041]/30 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 resize-none"
            />
          </div>

          <button
            onClick={handleSaveAndFinish}
            disabled={completeSession.isPending}
            className="w-full bg-[#1D9E75] hover:bg-[#085041] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {completeSession.isPending ? "Saving…" : "Save & finish"}
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center">
        <p className="text-[#085041]/60">No exercises in this session.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      {/* Progress bar */}
      <div className="h-1 bg-[#E5E7EB]">
        <div
          className="h-full bg-[#1D9E75] transition-all duration-1000"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Exercise queue */}
        <div className="bg-white rounded-2xl border border-[#1D9E75]/10 overflow-hidden">
          {exercises.map((se, i) => (
            <div
              key={se.id}
              className={`flex items-center justify-between px-4 py-3 border-b border-[#F5F3EE] last:border-0 transition-colors ${
                i === currentIndex
                  ? "bg-[#E1F5EE]"
                  : i < currentIndex
                    ? "opacity-50"
                    : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 text-xs flex items-center justify-center">
                  {i < currentIndex ? "✓" : i === currentIndex ? "▶" : String(i + 1)}
                </span>
                <span className={`text-sm ${i === currentIndex ? "font-semibold text-[#085041]" : "text-[#1C1C1A]/70"}`}>
                  {se.exercise.name}
                </span>
              </div>
              <span className="text-xs text-[#085041]/40">
                {Math.round(se.exercise.durationSeconds / 60)} min
              </span>
            </div>
          ))}
        </div>

        {/* Current exercise */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#1D9E75]/10 p-6 space-y-5">
          <div>
            <p className="text-xs text-[#085041]/50 uppercase tracking-wide">Now</p>
            <h2 className="text-xl font-bold text-[#085041] mt-0.5">{current.exercise.name}</h2>
            <p className="text-sm text-[#1C1C1A]/60 mt-1 leading-relaxed">
              {current.exercise.description}
            </p>
          </div>

          {/* Video or description */}
          <VideoPlayer
            playbackId={current.exercise.video?.muxPlaybackId ?? null}
            exerciseDescription={current.exercise.description}
          />

          {/* Breathing pacer */}
          <BreathingPacer running={pacerRunning && phase === "exercise"} />

          {/* Hold section */}
          {current.exercise.breathHoldMax > 0 && phase === "exercise" && !holdStarted && (
            <button
              onClick={startHold}
              className="w-full border-2 border-[#7F77DD] text-[#7F77DD] font-semibold py-3 rounded-xl hover:bg-[#7F77DD]/10 transition-colors"
            >
              Start hold ({current.exercise.breathHoldMax}s max)
            </button>
          )}

          {phase === "hold" && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-xs text-[#085041]/50 uppercase tracking-wide">Hold</p>
                <p className="text-5xl font-bold text-[#7F77DD] tabular-nums">{holdSecondsLeft}</p>
              </div>
              <button
                onClick={stopHold}
                className="w-full bg-[#7F77DD] hover:bg-[#6B64C8] text-white font-semibold py-3 rounded-xl transition-colors text-lg"
                aria-label="Stop hold"
              >
                Stop hold
              </button>
              <button
                onClick={handleComfort}
                className="w-full border border-[#F97316] text-[#F97316] font-medium py-2 rounded-xl hover:bg-[#F97316]/10 transition-colors text-sm"
              >
                I need rest
              </button>
            </div>
          )}

          {comfortMessage && (
            <p className="text-sm text-center text-[#085041]/70 bg-[#E1F5EE] rounded-lg py-2">
              {comfortMessage}
            </p>
          )}

          <button
            onClick={markExerciseComplete}
            className="w-full bg-[#1D9E75] hover:bg-[#085041] text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {currentIndex < exercises.length - 1 ? "Next exercise" : "Finish session"}
          </button>
        </div>
      </div>
    </div>
  );
}
