"use client";

interface HoldRecord {
  id: string;
  durationSeconds: number;
  isPersonalRecord: boolean;
  achievedAt: string | Date;
  exerciseId: string | null;
  sessionId: string | null;
}

interface Props {
  records: HoldRecord[];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default function HoldRecordTimeline({ records }: Props) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-[#085041]/50 text-center py-6">
        No breath hold records yet.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-[#1D9E75]/20" />

      <ol className="space-y-4">
        {records.map((record) => (
          <li key={record.id} className="flex items-start gap-4 pl-10 relative">
            {/* Dot */}
            <div className="absolute left-[13px] top-1 w-3 h-3 rounded-full bg-[#1D9E75] border-2 border-white shadow-sm" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#085041] text-sm">
                  {formatDuration(record.durationSeconds)}
                </span>
                {record.isPersonalRecord && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F59E0B]/15 text-[#D97706]">
                    PR
                  </span>
                )}
              </div>
              <p className="text-xs text-[#085041]/50 mt-0.5">
                {new Date(record.achievedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
