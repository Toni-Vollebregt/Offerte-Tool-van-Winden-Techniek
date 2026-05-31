'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import StepIndicator from '@/components/StepIndicator'
import type { Factuur } from '@/types'
import { formatCurrency } from '@/lib/calculations'

const FactuurActions = dynamic(() => import('@/components/FactuurActions'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white" style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)', opacity: 0.7 }}>
      PDF laden...
    </div>
  ),
})

const FactuurPreviewPanel = dynamic(() => import('@/components/FactuurPreviewPanel'), { ssr: false })

export default function FactuurFinalizePage() {
  const router = useRouter()
  const [factuur, setFactuur] = useState<Factuur | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSendingSnelstart, setIsSendingSnelstart] = useState(false)
  const [snelstartFactuurnummer, setSnelstartFactuurnummer] = useState<number | null>(null)
  const [snelstartError, setSnelstartError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('factuur')
    if (!stored) { router.push('/factuur'); return }
    setFactuur(JSON.parse(stored))
  }, [router])

  const handleOpslaan = async () => {
    if (!factuur) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const response = await fetch('/api/facturen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(factuur),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Opslaan mislukt')
      }
      const data = await response.json()
      setSavedId(data.id || 'opgeslagen')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendSnelstart = async () => {
    if (!factuur) return
    setIsSendingSnelstart(true)
    setSnelstartError(null)
    try {
      const response = await fetch('/api/snelstart/factuur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factuur }),
      })
      const data = await response.json()
      if (!response.ok) {
        setSnelstartError(data.error ?? 'Versturen naar Snelstart mislukt.')
        return
      }
      setSnelstartFactuurnummer(data.factuurnummer)
    } catch {
      setSnelstartError('Verbindingsfout — probeer opnieuw.')
    } finally {
      setIsSendingSnelstart(false)
    }
  }

  const handleTerug = () => router.push('/factuur/review')
  const handleNieuweFactuur = () => { sessionStorage.removeItem('factuur'); router.push('/factuur') }

  if (!factuur) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#2D2D2D' }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00E8FF', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const fileName = `Factuur_VanWindenTechniek_${factuur.maand}_${factuur.jaar}.pdf`

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#2D2D2D' }}>
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <StepIndicator currentStep={4} flow="factuur" />

        <div className="mt-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Definitieve factuur</h1>
              <p style={{ color: '#9D9D9D' }} className="mt-1 text-sm">
                {factuur.maand} {factuur.jaar} &bull; {factuur.klussen.length} werkbonnen
              </p>
            </div>
            <button onClick={handleTerug} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors" style={{ color: '#9D9D9D', backgroundColor: '#3D3D3D' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Aanpassen
            </button>
          </div>

          <div className="rounded-xl p-5 grid grid-cols-2 gap-4 md:grid-cols-4" style={{ backgroundColor: '#3D3D3D' }}>
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-xs">Arbeidskosten</p>
              <p className="text-white font-semibold">{formatCurrency(factuur.subtotaalArbeid)}</p>
            </div>
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-xs">Reiskosten km</p>
              <p className="text-white font-semibold">{formatCurrency(factuur.subtotaalReisKm)}</p>
            </div>
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-xs">Totaal excl. BTW</p>
              <p className="text-white font-semibold">{formatCurrency(factuur.totaal)}</p>
              <p style={{ color: '#6D6D6D' }} className="text-xs">BTW: {formatCurrency(factuur.btw)}</p>
            </div>
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-xs">Totaal incl. BTW</p>
              <p className="font-bold text-xl" style={{ color: '#00E8FF' }}>{formatCurrency(factuur.totaalInclBTW)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* PDF Download */}
            <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#3D3D3D' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)' }}>
                  <svg className="w-5 h-5" style={{ color: '#00E8FF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">PDF Downloaden</p>
                  <p style={{ color: '#9D9D9D' }} className="text-xs">Factuur als PDF opslaan</p>
                </div>
              </div>
              <FactuurActions factuur={factuur} fileName={fileName} />
            </div>

            {/* Save to Supabase */}
            <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#3D3D3D' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0, 85, 255, 0.1)' }}>
                  <svg className="w-5 h-5" style={{ color: '#0055FF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Opslaan in database</p>
                  <p style={{ color: '#9D9D9D' }} className="text-xs">Factuur bewaren in Supabase</p>
                </div>
              </div>
              {savedId ? (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)', color: '#00E8FF' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Opgeslagen
                </div>
              ) : (
                <>
                  <button onClick={handleOpslaan} disabled={isSaving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50" style={{ backgroundColor: '#4D4D4D', color: '#ffffff' }}>
                    {isSaving ? (
                      <><div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />Opslaan...</>
                    ) : 'Opslaan in Supabase'}
                  </button>
                  {saveError && <p className="text-xs" style={{ color: '#FF4444' }}>{saveError}</p>}
                </>
              )}
            </div>

            {/* Snelstart */}
            <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#3D3D3D' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0, 85, 255, 0.1)' }}>
                  <svg className="w-5 h-5" style={{ color: '#0055FF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Versturen naar Snelstart</p>
                  <p style={{ color: '#9D9D9D' }} className="text-xs">Factuur aanmaken in boekhoudpakket</p>
                </div>
              </div>
              {snelstartFactuurnummer ? (
                <div className="w-full flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)', color: '#00E8FF' }}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Aangemaakt in Snelstart
                  </div>
                  <p className="text-xs font-mono" style={{ color: '#9D9D9D' }}>Factuurnummer: {snelstartFactuurnummer}</p>
                </div>
              ) : (
                <>
                  <button onClick={handleSendSnelstart} disabled={isSendingSnelstart} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50" style={{ backgroundColor: '#4D4D4D', color: '#ffffff' }}>
                    {isSendingSnelstart ? (
                      <><div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />Versturen...</>
                    ) : 'Versturen naar Snelstart'}
                  </button>
                  {snelstartError && <p className="text-xs" style={{ color: '#FF4444' }}>{snelstartError}</p>}
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ backgroundColor: showPreview ? '#3D3D3D' : 'transparent', color: showPreview ? '#00E8FF' : '#9D9D9D', border: `1px solid ${showPreview ? '#00E8FF' : '#4D4D4D'}` }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPreview ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
            </svg>
            {showPreview ? 'Verberg PDF voorbeeld' : 'Toon PDF voorbeeld'}
          </button>

          {showPreview && <FactuurPreviewPanel factuur={factuur} />}

          <div className="flex justify-center pt-4">
            <button onClick={handleNieuweFactuur} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm transition-colors" style={{ color: '#9D9D9D', backgroundColor: '#3D3D3D' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nieuwe factuur starten
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
