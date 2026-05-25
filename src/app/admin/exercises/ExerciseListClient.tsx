"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Pillar = "BIOMECHANICS" | "BIOCHEMISTRY" | "NEUROPHYSIOLOGY" | "MULTI";
type MuxStatus = "PENDING" | "PROCESSING" | "READY" | "ERRORED";

interface ExerciseRow {
  id: string;
  code: string;
  name: string;
  pillar: Pillar;
  tier: number;
  video: {
    id: string;
    muxStatus: MuxStatus;
    isPublished: boolean;
    muxPlaybackId: string | null;
  } | null;
}

interface ExerciseListClientProps {
  initialExercises: ExerciseRow[];
}

const pillarBadge: Record<Pillar, { label: string; className: string }> = {
  BIOMECHANICS: { label: "Biomechanics", className: "bg-blue-100 text-blue-700" },
  BIOCHEMISTRY: { label: "Biochemistry", className: "bg-purple-100 text-purple-700" },
  NEUROPHYSIOLOGY: { label: "Neurophysiology", className: "bg-orange-100 text-orange-700" },
  MULTI: { label: "Multi", className: "bg-[#E1F5EE] text-[#085041]" },
};

interface CreateFormData {
  code: string;
  name: string;
  description: string;
  pillar: Pillar;
  tier: number;
  durationSeconds: number;
  instructorStyle: "WARM" | "CLINICAL" | "ENERGISING" | "CALM";
  primaryGoal: string;
  contraindications: string;
  breathHoldMax: number;
  positionRequired: string;
  biometricFeedbackType: string;
  nervousSystemScoreMin: number;
  gamificationEvent: string;
  fourWeekAnchor: boolean;
}

const defaultForm: CreateFormData = {
  code: "",
  name: "",
  description: "",
  pillar: "BIOMECHANICS",
  tier: 1,
  durationSeconds: 300,
  instructorStyle: "WARM",
  primaryGoal: "",
  contraindications: "",
  breathHoldMax: 0,
  positionRequired: "seated",
  biometricFeedbackType: "",
  nervousSystemScoreMin: 0,
  gamificationEvent: "",
  fourWeekAnchor: false,
};

export default function ExerciseListClient({ initialExercises }: ExerciseListClientProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState<CreateFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/trpc/exercise.create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            ...form,
            primaryGoal: form.primaryGoal
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            contraindications: form.contraindications
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            biometricFeedbackType: form.biometricFeedbackType
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            gamificationEvent: form.gamificationEvent.trim() || undefined,
          },
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Failed to create exercise");
      }

      setForm(defaultForm);
      setShowDrawer(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exercise");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1C1C1A]">Exercises</h1>
        <button
          onClick={() => setShowDrawer(true)}
          className="px-4 py-2 text-sm font-medium bg-[#1D9E75] text-white rounded-lg hover:bg-[#085041] transition-colors"
        >
          New exercise
        </button>
      </div>

      {initialExercises.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">No exercises yet. Create your first exercise.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pillar</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tier</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Video</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialExercises.map((exercise) => {
                const badge = pillarBadge[exercise.pillar];
                const hasVideo = !!exercise.video;
                const videoReady = exercise.video?.muxStatus === "READY";
                return (
                  <tr key={exercise.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{exercise.code}</td>
                    <td className="px-4 py-3 font-medium text-[#1C1C1A]">{exercise.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{exercise.tier}</td>
                    <td className="px-4 py-3">
                      {!hasVideo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                          Unlinked
                        </span>
                      ) : videoReady ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                          {exercise.video?.muxStatus ?? "Linked"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create exercise drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="flex-1 bg-black/40"
            onClick={() => !saving && setShowDrawer(false)}
          />
          {/* Drawer */}
          <div className="w-full max-w-md bg-white shadow-xl overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-[#1C1C1A]">New Exercise</h2>
              <button
                onClick={() => setShowDrawer(false)}
                disabled={saving}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    disabled={saving}
                    placeholder="DIAPHRAGM_BASIC"
                    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.tier}
                    onChange={(e) => setForm({ ...form, tier: Number(e.target.value) })}
                    disabled={saving}
                    min={1}
                    max={5}
                    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={saving}
                  placeholder="Diaphragmatic Breathing"
                  className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={saving}
                  rows={3}
                  placeholder="Describe the exercise..."
                  className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Pillar</label>
                  <select
                    value={form.pillar}
                    onChange={(e) => setForm({ ...form, pillar: e.target.value as Pillar })}
                    disabled={saving}
                    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50"
                  >
                    <option value="BIOMECHANICS">Biomechanics</option>
                    <option value="BIOCHEMISTRY">Biochemistry</option>
                    <option value="NEUROPHYSIOLOGY">Neurophysiology</option>
                    <option value="MULTI">Multi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Instructor Style
                  </label>
                  <select
                    value={form.instructorStyle}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        instructorStyle: e.target.value as CreateFormData["instructorStyle"],
                      })
                    }
                    disabled={saving}
                    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50"
                  >
                    <option value="WARM">Warm</option>
                    <option value="CLINICAL">Clinical</option>
                    <option value="ENERGISING">Energising</option>
                    <option value="CALM">Calm</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={form.durationSeconds}
                    onChange={(e) =>
                      setForm({ ...form, durationSeconds: Number(e.target.value) })
                    }
                    disabled={saving}
                    min={1}
                    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Position Required
                  </label>
                  <input
                    type="text"
                    value={form.positionRequired}
                    onChange={(e) => setForm({ ...form, positionRequired: e.target.value })}
                    disabled={saving}
                    placeholder="seated"
                    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Primary Goals <span className="text-gray-400">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={form.primaryGoal}
                  onChange={(e) => setForm({ ...form, primaryGoal: e.target.value })}
                  disabled={saving}
                  placeholder="stress_reduction, sleep_improvement"
                  className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contraindications <span className="text-gray-400">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={form.contraindications}
                  onChange={(e) => setForm({ ...form, contraindications: e.target.value })}
                  disabled={saving}
                  placeholder="cardiovascular, epilepsy"
                  className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Biometric Feedback Types <span className="text-gray-400">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={form.biometricFeedbackType}
                  onChange={(e) => setForm({ ...form, biometricFeedbackType: e.target.value })}
                  disabled={saving}
                  placeholder="HRV_RMSSD, RESPIRATORY_RATE"
                  className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Breath Hold Max (s)
                  </label>
                  <input
                    type="number"
                    value={form.breathHoldMax}
                    onChange={(e) => setForm({ ...form, breathHoldMax: Number(e.target.value) })}
                    disabled={saving}
                    min={0}
                    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    NS Score Min
                  </label>
                  <input
                    type="number"
                    value={form.nervousSystemScoreMin}
                    onChange={(e) =>
                      setForm({ ...form, nervousSystemScoreMin: Number(e.target.value) })
                    }
                    disabled={saving}
                    min={0}
                    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Gamification Event <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.gamificationEvent}
                  onChange={(e) => setForm({ ...form, gamificationEvent: e.target.value })}
                  disabled={saving}
                  placeholder="first_breath_hold"
                  className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fourWeekAnchor"
                  checked={form.fourWeekAnchor}
                  onChange={(e) => setForm({ ...form, fourWeekAnchor: e.target.checked })}
                  disabled={saving}
                  className="rounded border-gray-300 text-[#1D9E75] focus:ring-[#1D9E75]"
                />
                <label htmlFor="fourWeekAnchor" className="text-sm text-gray-700">
                  Four-week anchor exercise
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-2 pb-4">
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-[#1D9E75] text-white rounded-lg hover:bg-[#085041] transition-colors disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
