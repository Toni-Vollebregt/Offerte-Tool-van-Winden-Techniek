'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#2D2D2D' }}>
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Kies een flow</h1>
            <p style={{ color: '#9D9D9D' }} className="mt-2 text-sm">
              Upload een ExcelAir weekplanning PDF en genereer een document
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Offerte */}
            <button
              onClick={() => router.push('/offerte')}
              className="rounded-xl p-6 text-left transition-all duration-200 hover:scale-[1.02] focus:outline-none"
              style={{ backgroundColor: '#3D3D3D', border: '1px solid #4D4D4D' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)' }}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg">Offerte</p>
              <p style={{ color: '#9D9D9D' }} className="text-sm mt-1">
                Maandplanning omzetten naar een offerte voor ExcelAir
              </p>
              <div className="mt-4 flex items-center gap-1" style={{ color: '#00E8FF' }}>
                <span className="text-sm font-medium">Starten</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </button>

            {/* Factuur */}
            <button
              onClick={() => router.push('/factuur')}
              className="rounded-xl p-6 text-left transition-all duration-200 hover:scale-[1.02] focus:outline-none"
              style={{ backgroundColor: '#3D3D3D', border: '1px solid #4D4D4D' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)' }}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg">Factuur</p>
              <p style={{ color: '#9D9D9D' }} className="text-sm mt-1">
                Weekplanning omzetten naar een factuur voor ExcelAir
              </p>
              <div className="mt-4 flex items-center gap-1" style={{ color: '#00E8FF' }}>
                <span className="text-sm font-medium">Starten</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
