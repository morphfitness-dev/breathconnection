import { Session } from '@supabase/supabase-js'

interface DashboardPageProps {
  session: Session
}

export default function DashboardPage({ session }: DashboardPageProps) {
  const firstName = session.user.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-offwhite">
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl text-teal-primary mb-2">
            Welcome back, {firstName}.
          </h1>
          <p className="text-gray-500">
            Your breath practice dashboard — coming soon.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              label: 'Biomechanics',
              icon: '🫁',
              desc: 'Diaphragm activation & ribcage mechanics',
            },
            {
              label: 'Biochemistry',
              icon: '⚗️',
              desc: 'CO₂ tolerance & BOLT score training',
            },
            {
              label: 'Neurophysiology',
              icon: '🧠',
              desc: 'HRV, vagal tone & nervous system balance',
            },
          ].map(pillar => (
            <div
              key={pillar.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3"
            >
              <span className="text-3xl">{pillar.icon}</span>
              <h3 className="text-lg text-teal-primary">{pillar.label}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{pillar.desc}</p>
              <span className="mt-auto inline-block text-xs font-medium text-amber-accent">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
