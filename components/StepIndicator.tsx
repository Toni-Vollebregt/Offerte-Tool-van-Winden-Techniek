'use client'

const STEPS_OFFERTE = [
  { label: 'Upload', description: 'PDF inladen' },
  { label: 'Berekening', description: 'Prijzen berekenen' },
  { label: 'Review', description: 'Controleren' },
  { label: 'Definitief', description: 'Offerte genereren' },
]

const STEPS_FACTUUR = [
  { label: 'Upload', description: 'PDF inladen' },
  { label: 'Berekening', description: 'Prijzen berekenen' },
  { label: 'Review', description: 'Controleren' },
  { label: 'Definitief', description: 'Factuur genereren' },
]

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4
  flow?: 'offerte' | 'factuur'
}

export default function StepIndicator({ currentStep, flow = 'offerte' }: StepIndicatorProps) {
  const STEPS = flow === 'factuur' ? STEPS_FACTUUR : STEPS_OFFERTE
  return (
    <div className="w-full py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative">
          {/* Connector line */}
          <div
            className="absolute top-5 left-0 right-0 h-0.5"
            style={{ backgroundColor: '#3D3D3D', zIndex: 0 }}
          />
          <div
            className="absolute top-5 left-0 h-0.5 transition-all duration-500"
            style={{
              backgroundColor: '#00E8FF',
              width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
              zIndex: 1,
            }}
          />

          {STEPS.map((step, index) => {
            const stepNum = index + 1
            const isCompleted = stepNum < currentStep
            const isCurrent = stepNum === currentStep
            const isPending = stepNum > currentStep

            return (
              <div
                key={step.label}
                className="flex flex-col items-center gap-2"
                style={{ zIndex: 2 }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300"
                  style={{
                    backgroundColor: isCompleted
                      ? '#00E8FF'
                      : isCurrent
                        ? '#0055FF'
                        : '#3D3D3D',
                    borderColor: isCompleted
                      ? '#00E8FF'
                      : isCurrent
                        ? '#00E8FF'
                        : '#4D4D4D',
                    color: isCompleted || isCurrent ? '#ffffff' : '#9D9D9D',
                  }}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <div className="text-center">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: isCurrent ? '#00E8FF' : isCompleted ? '#00E8FF' : '#9D9D9D' }}
                  >
                    {step.label}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: isPending ? '#6D6D6D' : '#9D9D9D' }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
