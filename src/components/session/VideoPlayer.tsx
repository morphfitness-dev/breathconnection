"use client";

import { useRef, useCallback } from "react";
import MuxPlayer from "@mux/mux-player-react";

interface VideoPlayerProps {
  playbackId: string | null;
  exerciseDescription: string;
  onProgress?: (pct: number) => void;
  onComplete?: () => void;
}

export default function VideoPlayer({
  playbackId,
  exerciseDescription,
  onProgress,
  onComplete,
}: VideoPlayerProps) {
  const lastReportedPct = useRef<number>(0);
  const completedFired = useRef<boolean>(false);

  const handleTimeUpdate = useCallback(
    (event: Event) => {
      const video = event.target as HTMLVideoElement;
      if (!video || !video.duration || video.duration === 0) return;

      const pct = (video.currentTime / video.duration) * 100;

      // Report progress every ~10 seconds worth
      const currentSecond = Math.floor(video.currentTime);
      const lastSecond = Math.floor((lastReportedPct.current / 100) * video.duration);

      if (currentSecond - lastSecond >= 10) {
        lastReportedPct.current = pct;
        onProgress?.(pct);
      }

      // Fire onComplete at 90% watched
      if (pct >= 90 && !completedFired.current) {
        completedFired.current = true;
        onComplete?.();
      }
    },
    [onProgress, onComplete]
  );

  if (!playbackId) {
    return (
      <div className="rounded-xl bg-[#E1F5EE] border border-[#1D9E75]/20 p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-[#1D9E75]/10 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-[#1D9E75]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[#085041] mb-1">Exercise Guide</p>
            <p className="text-sm text-[#1C1C1A] leading-relaxed">{exerciseDescription}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden bg-black aspect-video">
      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
      />
    </div>
  );
}
