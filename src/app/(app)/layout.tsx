import NotificationBell from "@/components/layout/NotificationBell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#1D9E75]/10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <a href="/home" className="flex items-center gap-2">
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              className="text-[#1D9E75]"
            >
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M10 16c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="16" cy="16" r="2" fill="currentColor" />
            </svg>
            <span className="text-sm font-semibold text-[#085041] hidden sm:block">
              Breath Connection
            </span>
          </a>

          {/* Right side */}
          <div className="flex items-center gap-1">
            <a
              href="/dashboard"
              className="px-3 py-1.5 text-xs font-medium text-[#085041]/70 hover:text-[#085041] rounded-lg hover:bg-[#1D9E75]/10 transition-colors"
            >
              Progress
            </a>
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
