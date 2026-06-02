import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ProgressBar from '../components/onboarding/ProgressBar'
import SafetyGate from '../components/onboarding/SafetyGate'
import ModuleA from '../components/onboarding/ModuleA'
import ModuleB from '../components/onboarding/ModuleB'
import ModuleC from '../components/onboarding/ModuleC'
import ModuleD from '../components/onboarding/ModuleD'
import ModuleE from '../components/onboarding/ModuleE'

const MODULE_INDEX = { A: 1, B: 2, C: 3, D: 4, E: 5 }

const initialFormData = {
  contraindications: [],
  bolt_score: null,
  symptoms: [],
  stress_level: 3,
  anxiety_level: 3,
  sleep_quality: 3,
  energy_level: 3,
  panic_frequency: null,
  goals: [],
  activity_level: null,
  time_commitment: null,
  prior_experience: null,
}

export default function OnboardingPage() {
  const { setAssessmentCompleted, assessmentCompleted } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState('safety')
  const [formData, setFormData] = useState(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [deferred, setDeferred] = useState(false)

  if (assessmentCompleted) {
    navigate('/dashboard', { replace: true })
    return null
  }

  function updateField(key, val) {
    setFormData(prev => ({ ...prev, [key]: val }))
  }

  function handleSafetyClear(ids) {
    setFormData(prev => ({ ...prev, contraindications: ids }))
    setStep('A')
  }

  function handleDefer() {
    setDeferred(true)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session.access_token
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setAssessmentCompleted(true)
        navigate('/dashboard')
      } else {
        const json = await res.json().catch(() => ({}))
        setError(json.error || 'Something went wrong. Please try again.')
        setStep('E')
        setSubmitting(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setStep('E')
      setSubmitting(false)
    }
  }

  if (deferred) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h2 className="font-serif text-3xl text-[#0D5C63] mb-4">We'll be here when you're ready</h2>
          <p className="font-sans text-gray-600 text-sm leading-relaxed">
            Once you've spoken with your healthcare provider and have medical clearance, come back and we'll get you started on your breathwork journey.
          </p>
        </div>
      </div>
    )
  }

  const showProgress = ['A', 'B', 'C', 'D', 'E'].includes(step) || step === 'submitting'
  const currentProgress = step === 'submitting' ? 5 : MODULE_INDEX[step] ?? 0

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {step === 'safety' ? (
        <SafetyGate onClear={handleSafetyClear} onDefer={handleDefer} />
      ) : (
        <div className="px-4 py-12">
          {showProgress && (
            <ProgressBar current={currentProgress} total={5} />
          )}

          {error && (
            <div className="max-w-xl mx-auto mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="font-sans text-sm text-red-700">{error}</p>
            </div>
          )}

          {step === 'A' && (
            <ModuleA
              value={formData.bolt_score}
              onChange={val => updateField('bolt_score', val)}
              onNext={() => setStep('B')}
            />
          )}

          {step === 'B' && (
            <ModuleB
              selected={formData.symptoms}
              onChange={val => updateField('symptoms', val)}
              onNext={() => setStep('C')}
              onBack={() => setStep('A')}
            />
          )}

          {step === 'C' && (
            <ModuleC
              data={{
                stress_level: formData.stress_level,
                anxiety_level: formData.anxiety_level,
                sleep_quality: formData.sleep_quality,
                energy_level: formData.energy_level,
                panic_frequency: formData.panic_frequency,
              }}
              onChange={(key, val) => updateField(key, val)}
              onNext={() => setStep('D')}
              onBack={() => setStep('B')}
            />
          )}

          {step === 'D' && (
            <ModuleD
              selected={formData.goals}
              onChange={val => updateField('goals', val)}
              onNext={() => setStep('E')}
              onBack={() => setStep('C')}
            />
          )}

          {(step === 'E' || step === 'submitting') && (
            <ModuleE
              data={{
                activity_level: formData.activity_level,
                time_commitment: formData.time_commitment,
                prior_experience: formData.prior_experience,
              }}
              onChange={(key, val) => updateField(key, val)}
              onSubmit={handleSubmit}
              onBack={() => setStep('D')}
              submitting={submitting}
            />
          )}
        </div>
      )}
    </div>
  )
}
