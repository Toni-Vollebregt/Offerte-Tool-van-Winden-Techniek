'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import StepIndicator from '@/components/StepIndicator'
import type { Offerte } from '@/types'
import { berekenOfferteTotalen, formatCurrency } from '@/lib/calculations'

const PdfActions = dynamic(() => import('@/components/PdfActions'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white" style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)', opacity: 0.7 }}>
      PDF laden...
    </div>
  ),
})

const PdfPreviewPanel = dynamic(() => import('@/components/PdfPreviewPanel'), { ssr: false })

type TechState = {
  isSaving: boolean
  savedId: string | null
  saveError: string | null
  isSending: boolean
  snelstartNummer: number | null
  snelstartError: string | null
}

function defaultTechState(): TechState {
  return { isSaving: false, savedId: null, saveError: null, isSending: false, snelstartNummer: null, snelstartError: null }
}

function subsetOfferte(offerte: Offerte, tech: string): Offerte {
  const klussen = offerte.klussen.filter(k => (k.technicianName ?? '') === tech)
  return { ...offerte, klussen, ...berekenOfferteTotalen(klussen) }
}

export default function OfferteFinalizePage() {
  const router = useRouter()
  const [offerte, setOfferte] = useState<Offerte | null>(null)
  const [techStates, setTechStates] = useState<Record<string, TechState>>({})
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('offerte')
    if (!stored) { router.push('/offerte'); return }
    const parsed: Offerte = JSON.parse(stored)
    setOfferte(parsed)

    const techs = [...new Set(parsed.klussen.map(k => k.technicianName ?? ''))].filter(Boolean)
    const initial: Record<string, TechState> = {}
    const key = techs.length >= 2 ? techs : ['']
    for (const t of key) initial[t] = defaultTechState()
    setTechStates(initial)
  }, [router])

  const updateTechState = (tech: string, patch: Partial<TechState>) => {
    setTechStates(prev => ({ ...prev, [tech]: { ...prev[tech], ...patch } }))
  }

  const handleOpslaan = async (tech: string, subset: Offerte) => {
    updateTechState(tech, { isSaving: true, saveError: null })
    try {
      const response = await fetch('/api/offertes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subset),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Opslaan mislukt')
      }
      const data = await response.json()
      updateTechState(tech, { savedId: data.id || 'opgeslagen' })
    } catch (err) {
      updateTechState(tech, { saveError: err instanceof Error ? err.message : 'Onbekende fout' })
    } finally {
      updateTechState(tech, { isSaving: false })
    }
  }

  const handleSendSnelstart = async (tech: string, subset: Offerte) => {
    updateTechState(tech, { isSending: true, snelstartError: null })
    try {
      const response = await fetch('/api/snelstart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerte: subset }),
      })
      const data = await response.json()
      if (!response.ok) {
        updateTechState(tech, { snelstartError: data.error ?? 'Versturen naar Snelstart mislukt.' })
        return
      }
      updateTechState(tech, { snelstartNummer: data.offertenummer })
    } catch {
      updateTechState(tech, { snelstartError: 'Verbindingsfout — probeer opnieuw.' })
    } finally {
      updateTechState(tech, { isSending: false })
    }
  }

  const handleTerug = () => router.push('/offerte/review')
  const handleNieuweOfferte = () => { sessionStorage.removeItem('offerte'); router.push('/offerte') }

  if (!offerte) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#2D2D2D' }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00E8FF', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const techGroups = [...new Set(offerte.klussen.map(k => k.technicianName ?? ''))].filter(Boolean)
  const hasMultipleTechs = techGroups.length >= 2
  const displayGroups: string[] = hasMultipleTechs ? techGroups : ['']

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#2D2D2D' }}>
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <StepIndicator currentStep={4} flow="offerte" />

        <div className="mt-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Definitieve offerte</h1>
              <p style={{ color: '#9D9D9D' }} className="mt-1 text-sm">
                {offerte.maand} {offerte.jaar} &bull; {offerte.klussen.length} werkbonnen{hasMultipleTechs ? ` • ${techGroups.length} monteurs` : ''}
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
              <p className="text-white font-semibold">{formatCurrency(offerte.subtotaalArbeid)}</p>
            </div>
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-xs">Reiskosten km</p>
              <p className="text-white font-semibold">{formatCurrency(offerte.subtotaalReisKm)}</p>
            </div>
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-xs">Totaal excl. BTW</p>
              <p className="text-white font-semibold">{formatCurrency(offerte.totaal)}</p>
              <p style={{ color: '#6D6D6D' }} className="text-xs">BTW: {formatCurrency(offerte.btw)}</p>
            </div>
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-xs">Totaal incl. BTW</p>
              <p className="font-bold text-xl" style={{ color: '#00E8FF' }}>{formatCurrency(offerte.totaalInclBTW)}</p>
            </div>
          </div>

          {displayGroups.map(tech => {
            const subset = tech ? subsetOfferte(offerte, tech) : offerte
            const ts = techStates[tech] ?? defaultTechState()
            const techLabel = tech || undefined
            const fileName = tech
              ? `Offerte_VanWindenTechniek_${offerte.maand}_${offerte.jaar}_${tech.replace(/\s+/g, '_')}.pdf`
              : `Offerte_VanWindenTechniek_${offerte.maand}_${offerte.jaar}.pdf`

            return (
              <div key={tech || '__all__'} className="space-y-4">
                {hasMultipleTechs && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-px flex-1" style={{ backgroundColor: '#4D4D4D' }} />
                    <span className="text-sm font-semibold px-4 py-1.5 rounded-full" style={{ backgroundColor: '#3D3D3D', color: '#00E8FF', border: '1px solid #4D4D4D' }}>
                      {tech}
                    </span>
                    <div className="h-px flex-1" style={{ backgroundColor: '#4D4D4D' }} />
                  </div>
                )}

                {hasMultipleTechs && (
                  <div className="rounded-xl px-4 py-3 flex gap-6" style={{ backgroundColor: '#333333' }}>
                    <div>
                      <p style={{ color: '#9D9D9D' }} className="text-xs">Werkbonnen</p>
                      <p className="text-white font-semibold text-sm">{subset.klussen.length}</p>
                    </div>
                    <div>
                      <p style={{ color: '#9D9D9D' }} className="text-xs">Totaal excl. BTW</p>
                      <p className="text-white font-semibold text-sm">{formatCurrency(subset.totaal)}</p>
                    </div>
                    <div>
                      <p style={{ color: '#9D9D9D' }} className="text-xs">Totaal incl. BTW</p>
                      <p className="font-bold text-sm" style={{ color: '#00E8FF' }}>{formatCurrency(subset.totaalInclBTW)}</p>
                    </div>
                  </div>
                )}

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
                        <p style={{ color: '#9D9D9D' }} className="text-xs">Offerte als PDF opslaan</p>
                      </div>
                    </div>
                    <PdfActions offerte={subset} fileName={fileName} technicianName={techLabel} />
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
                        <p style={{ color: '#9D9D9D' }} className="text-xs">Offerte bewaren in Supabase</p>
                      </div>
                    </div>
                    {ts.savedId ? (
                      <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)', color: '#00E8FF' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Opgeslagen
                      </div>
                    ) : (
                      <>
                        <button onClick={() => handleOpslaan(tech, subset)} disabled={ts.isSaving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50" style={{ backgroundColor: '#4D4D4D', color: '#ffffff' }}>
                          {ts.isSaving ? (
                            <><div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />Opslaan...</>
                          ) : 'Opslaan in Supabase'}
                        </button>
                        {ts.saveError && <p className="text-xs" style={{ color: '#FF4444' }}>{ts.saveError}</p>}
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
                        <p style={{ color: '#9D9D9D' }} className="text-xs">Offerte aanmaken in boekhoudpakket</p>
                      </div>
                    </div>
                    {ts.snelstartNummer ? (
                      <div className="w-full flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)', color: '#00E8FF' }}>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Aangemaakt in Snelstart
                        </div>
                        <p className="text-xs font-mono" style={{ color: '#9D9D9D' }}>Offertenummer: {ts.snelstartNummer}</p>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => handleSendSnelstart(tech, subset)} disabled={ts.isSending} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50" style={{ backgroundColor: '#4D4D4D', color: '#ffffff' }}>
                          {ts.isSending ? (
                            <><div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />Versturen...</>
                          ) : 'Versturen naar Snelstart'}
                        </button>
                        {ts.snelstartError && <p className="text-xs" style={{ color: '#FF4444' }}>{ts.snelstartError}</p>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

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

          {showPreview && <PdfPreviewPanel offerte={offerte} />}

          <div className="flex justify-center pt-4">
            <button onClick={handleNieuweOfferte} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm transition-colors" style={{ color: '#9D9D9D', backgroundColor: '#3D3D3D' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nieuwe offerte starten
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
