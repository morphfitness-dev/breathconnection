"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], refetch } =
    trpc.gamification.getNotifications.useQuery();

  const markRead = trpc.gamification.markNotificationRead.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = notifications.length;
  const preview = notifications.slice(0, 5);

  function handleMarkAll() {
    for (const n of notifications) {
      markRead.mutate({ notificationId: n.id });
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-[#1D9E75]/10 transition-colors"
      >
        {/* Bell SVG */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#085041]"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#1D9E75]/10 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
            <span className="text-sm font-semibold text-[#085041]">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-[#1D9E75] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {preview.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#085041]/50">
              No new notifications
            </div>
          ) : (
            <ul>
              {preview.map((n) => (
                <li
                  key={n.id}
                  className="px-4 py-3 border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#085041] leading-snug">
                        {n.title}
                      </p>
                      <p className="text-xs text-[#085041]/60 mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-[#085041]/40 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        markRead.mutate({ notificationId: n.id })
                      }
                      aria-label="Dismiss"
                      className="mt-0.5 text-[#085041]/30 hover:text-[#085041]/60 flex-shrink-0"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
