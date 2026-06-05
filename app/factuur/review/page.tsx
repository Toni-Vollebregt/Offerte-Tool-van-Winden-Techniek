'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import StepIndicator from '@/components/StepIndicator'
import type { Klus, Rit, Factuur, Tarief } from '@/types'
import { berekenKlus, berekenRit, berekenOfferteTotalen, formatCurrency, formatNumber } from '@/lib/calculations'

// ─── Helpers ────────────────────────────────────────────────────────────────

function datumSortKey(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('-')
  return `${y}-${m}-${d}`
}

function datumLang(ddmmyyyy: string): string {
  if (!ddmmyyyy) return ''
  const [d, m, y] = ddmmyyyy.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
}

type TimelineItem =
  | { type: 'rit'; rit: Rit }
  | { type: 'klus'; klus: Klus }

function buildTimeline(dagKlussen: Klus[], dagRits: Rit[]): TimelineItem[] {
  const items: TimelineItem[] = []
  const usedRitIds = new Set<string>()
  const usedKlusIds = new Set<string>()
  let currentLoc = 'naaldwijk'
  let safety = 0

  while (safety < 40) {
    safety++
    const nextRit = dagRits.find(r => r.van.toLowerCase() === currentLoc && !usedRitIds.has(r.id))
    if (!nextRit) break
    usedRitIds.add(nextRit.id)
    items.push({ type: 'rit', rit: nextRit })
    const locKlussen = dagKlussen.filter(k => k.locatie === nextRit.naar && !usedKlusIds.has(k.id))
    for (const k of locKlussen) {
      usedKlusIds.add(k.id)
      items.push({ type: 'klus', klus: k })
    }
    currentLoc = nextRit.naar.toLowerCase()
  }

  // Wees-items die niet in de keten zitten
  for (const r of dagRits) {
    if (!usedRitIds.has(r.id)) items.push({ type: 'rit', rit: r })
  }
  for (const k of dagKlussen) {
    if (!usedKlusIds.has(k.id)) items.push({ type: 'klus', klus: k })
  }
  return items
}

// ─── Inline KlusRij ─────────────────────────────────────────────────────────

function KlusRij({
  klus,
  onUpdate,
  onDelete,
}: {
  klus: Klus
  onUpdate: (k: Klus) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [local, setLocal] = useState(klus)

  useEffect(() => { setLocal(klus) }, [klus])

  const handleField = (field: 'duur' | 'uurtarief' | 'locatie', value: string | number) => {
    const updated = { ...local, [field]: value }
    if (field === 'duur' || field === 'uurtarief') {
      const duur = field === 'duur' ? Number(value) : updated.duur
      const uur = field === 'uurtarief' ? Number(value) : updated.uurtarief
      updated.arbeidskosten = Math.round((duur * uur + (updated.rivgToeslag ?? 0)) * 100) / 100
      updated.totaal = updated.arbeidskosten
    }
    setLocal(updated)
    onUpdate(updated)
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#3D3D3D', border: '1px solid #4D4D4D' }}>
      {/* Header rij */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: '#00E8FF' }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{local.werkzaamhedenOmschrijving || local.projectNaam}</p>
          <p className="text-xs" style={{ color: '#6D6D6D' }}>
            {local.werkbonNummer} · {local.projectCode}
            {local.mapsError && <span style={{ color: '#FFAA00' }}> · {local.mapsError}</span>}
          </p>
        </div>
        <p className="text-sm font-semibold flex-shrink-0" style={{ color: '#00E8FF' }}>
          {formatNumber(local.duur)} u × €{local.uurtarief} = {formatCurrency(local.arbeidskosten)}
        </p>
        {local.rivgToeslag ? (
          <p className="text-xs flex-shrink-0" style={{ color: '#9D9D9D' }}>+€{local.rivgToeslag}</p>
        ) : null}
        <button
          onClick={() => setExpanded(e => !e)}
          className="p-1 rounded transition-opacity hover:opacity-70 flex-shrink-0"
          style={{ color: '#9D9D9D' }}
          title="Bewerken"
        >
          <svg className="w-4 h-4 transition-transform duration-150" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(local.id)}
          className="p-1 rounded transition-opacity hover:opacity-70 flex-shrink-0"
          style={{ color: '#FF5050' }}
          title="Verwijder klus"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t" style={{ borderColor: '#4D4D4D' }}>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs" style={{ color: '#9D9D9D' }}>Uren</label>
              <input
                type="number" step="0.25" min="0"
                value={local.duur}
                onChange={e => handleField('duur', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 rounded text-sm border focus:outline-none"
                style={{ backgroundColor: '#2D2D2D', borderColor: '#4D4D4D', color: '#fff' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs" style={{ color: '#9D9D9D' }}>Tarief (€/u)</label>
              <input
                type="number" step="0.50" min="0"
                value={local.uurtarief}
                onChange={e => handleField('uurtarief', parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 rounded text-sm border focus:outline-none"
                style={{ backgroundColor: '#2D2D2D', borderColor: '#4D4D4D', color: '#fff' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs" style={{ color: '#9D9D9D' }}>Locatie</label>
              <input
                type="text"
                value={local.locatie}
                onChange={e => handleField('locatie', e.target.value)}
                className="w-full px-2 py-1.5 rounded text-sm border focus:outline-none"
                style={{ backgroundColor: '#2D2D2D', borderColor: '#4D4D4D', color: '#fff' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inline RitRij ──────────────────────────────────────────────────────────

function RitRij({
  rit,
  onUpdate,
  onDelete,
}: {
  rit: Rit
  onUpdate: (r: Rit) => void
  onDelete: (id: string) => void
}) {
  const [local, setLocal] = useState(rit)

  useEffect(() => { setLocal(rit) }, [rit])

  const handleField = (field: 'afstandKm' | 'reisUren', value: number) => {
    const updated = { ...local, [field]: value }
    updated.reiskostenKm = Math.round(updated.afstandKm * 0.50 * 100) / 100
    updated.reiskostenUur = Math.round(updated.reisUren * 55 * 1.15 * 100) / 100
    updated.totaal = Math.round((updated.reiskostenKm + updated.reiskostenUur) * 100) / 100
    setLocal(updated)
    onUpdate(updated)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#333333', border: '1px solid #444444' }}>
      <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9D9D9D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
      <span className="text-sm flex-shrink-0" style={{ color: '#9D9D9D' }}>
        {local.van} → {local.naar}
      </span>
      {local.locatieError && (
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,170,0,0.15)', color: '#FFAA00' }}>
          {local.locatieError}
        </span>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <input
          type="number" step="1" min="0"
          value={local.afstandKm}
          onChange={e => handleField('afstandKm', parseFloat(e.target.value) || 0)}
          className="w-16 px-2 py-1 rounded text-xs border text-right focus:outline-none"
          style={{ backgroundColor: '#2D2D2D', borderColor: '#4D4D4D', color: '#fff' }}
          title="Kilometers"
        />
        <span className="text-xs" style={{ color: '#6D6D6D' }}>km</span>
        <input
          type="number" step="0.25" min="0"
          value={local.reisUren}
          onChange={e => handleField('reisUren', parseFloat(e.target.value) || 0)}
          className="w-14 px-2 py-1 rounded text-xs border text-right focus:outline-none"
          style={{ backgroundColor: '#2D2D2D', borderColor: '#4D4D4D', color: '#fff' }}
          title="Reisuren (enkel)"
        />
        <span className="text-xs" style={{ color: '#6D6D6D' }}>u</span>
        <span className="text-xs font-medium" style={{ color: '#9D9D9D' }}>{formatCurrency(local.totaal)}</span>
      </div>
      <button
        onClick={() => onDelete(local.id)}
        className="p-1 rounded transition-opacity hover:opacity-70 flex-shrink-0"
        style={{ color: '#666666' }}
        title="Verwijder rit"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ─── Loose project toevoegen ─────────────────────────────────────────────────

async function fetchKm(query: string): Promise<{ km: number; uren: number; error?: string }> {
  try {
    const resp = await fetch(`/api/maps?locatie=${encodeURIComponent(query)}`)
    if (!resp.ok) return { km: 0, uren: 0 }
    return await resp.json()
  } catch {
    return { km: 0, uren: 0 }
  }
}

// ─── Hoofdpagina ─────────────────────────────────────────────────────────────

export default function FactuurReviewPage() {
  const router = useRouter()
  const [factuur, setFactuur] = useState<Factuur | null>(null)
  const [klussen, setKlussen] = useState<Klus[]>([])
  const [rits, setRits] = useState<Rit[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [addProjectError, setAddProjectError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('factuur')
    if (!stored) { router.push('/factuur'); return }
    const parsed: Factuur = JSON.parse(stored)
    setFactuur(parsed)
    setKlussen(parsed.klussen)
    setRits(parsed.rits ?? [])
  }, [router])

  const handleKlusUpdate = useCallback((updated: Klus) => {
    setKlussen(prev => prev.map(k => k.id === updated.id ? updated : k))
  }, [])

  const handleRitUpdate = useCallback((updated: Rit) => {
    setRits(prev => prev.map(r => r.id === updated.id ? updated : r))
  }, [])

  const handleDeleteKlus = useCallback((id: string) => {
    setKlussen(prev => prev.filter(k => k.id !== id))
  }, [])

  const handleDeleteRit = useCallback((id: string) => {
    setRits(prev => prev.filter(r => r.id !== id))
  }, [])

  const handleDeleteDag = useCallback((datum: string, tech: string) => {
    setKlussen(prev => prev.filter(k => !(k.datum === datum && (k.technicianName ?? '') === tech)))
    setRits(prev => prev.filter(r => !(r.datum === datum && (r.technicianName ?? '') === tech)))
  }, [])

  const totalen = berekenOfferteTotalen(klussen, rits)

  // Groepeer per monteur → per datum
  const techDagGroepen = useMemo(() => {
    type DagInfo = { datum: string; klussen: Klus[]; rits: Rit[] }
    const techMap = new Map<string, Map<string, DagInfo>>()

    const ensureDag = (tech: string, datum: string) => {
      if (!techMap.has(tech)) techMap.set(tech, new Map())
      const dagMap = techMap.get(tech)!
      if (!dagMap.has(datum)) dagMap.set(datum, { datum, klussen: [], rits: [] })
      return dagMap.get(datum)!
    }

    for (const k of klussen) {
      const tech = k.technicianName ?? ''
      const dag = ensureDag(tech, k.datum)
      dag.klussen.push(k)
    }
    for (const r of rits) {
      const tech = r.technicianName ?? ''
      const dag = ensureDag(tech, r.datum)
      dag.rits.push(r)
    }

    return [...techMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([tech, dagMap]) => ({
      tech,
      dagen: [...dagMap.values()].sort((a, b) => datumSortKey(a.datum).localeCompare(datumSortKey(b.datum))),
    }))
  }, [klussen, rits])

  const handleProjectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setIsAddingProject(true)
    setAddProjectError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const parseResponse = await fetch('/api/parse-project', { method: 'POST', body: formData })
      if (!parseResponse.ok) {
        const err = await parseResponse.json()
        setAddProjectError(err.error ?? 'Fout bij verwerken van project PDF.')
        return
      }
      const { klus: parsedKlus } = await parseResponse.json() as { klus: Partial<Klus> }

      const tarievenResponse = await fetch('/api/tarieven')
      const tarieven: Tarief[] = await tarievenResponse.json()
      let uurtarief = 60
      if (parsedKlus.werkzaamhedenCodes && parsedKlus.werkzaamhedenCodes.length > 0) {
        const matched = parsedKlus.werkzaamhedenCodes.map(c => tarieven.find(t => t.code === c)).filter(Boolean) as Tarief[]
        if (matched.length > 0) uurtarief = Math.max(...matched.map(t => t.uurtarief))
      }

      let mapsError: string | undefined
      const newRits: Rit[] = []
      const mapsTarget = parsedKlus.mapsQuery || parsedKlus.locatie
      if (mapsTarget) {
        const result = await fetchKm(mapsTarget)
        if (result.error) {
          mapsError = result.error
        } else {
          const locatie = parsedKlus.locatie ?? mapsTarget
          const datum = parsedKlus.datum ?? ''
          const tech = parsedKlus.technicianName
          newRits.push(berekenRit(datum, 'Naaldwijk', locatie, result.km, result.uren, tech))
          newRits.push(berekenRit(datum, locatie, 'Naaldwijk', result.km, result.uren, tech))
        }
      }

      const klus = berekenKlus(parsedKlus, 0, 0, uurtarief)
      if (parsedKlus.mapsQuery) klus.mapsQuery = parsedKlus.mapsQuery
      if (mapsError) klus.mapsError = mapsError

      setKlussen(prev => [...prev, klus])
      setRits(prev => [...prev, ...newRits])
    } catch {
      setAddProjectError('Verbindingsfout — probeer opnieuw.')
    } finally {
      setIsAddingProject(false)
    }
  }

  const handleDoorgaan = () => {
    if (!factuur) return
    setIsSaving(true)
    const updatedTotalen = berekenOfferteTotalen(klussen, rits)
    const updatedFactuur: Factuur = { ...factuur, klussen, rits, ...updatedTotalen }
    sessionStorage.setItem('factuur', JSON.stringify(updatedFactuur))
    router.push('/factuur/finalize')
  }

  const handleTerug = () => router.push('/factuur')

  if (!factuur) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#2D2D2D' }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00E8FF', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#2D2D2D' }}>
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <StepIndicator currentStep={3} flow="factuur" />

        <div className="mt-8 space-y-6">
          {/* Paginaheader */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Factuur controleren</h1>
              <p style={{ color: '#9D9D9D' }} className="mt-1 text-sm">
                {factuur.maand} {factuur.jaar} &bull; {klussen.length} klussen &bull; {rits.length} ritten
              </p>
            </div>
            <button onClick={handleTerug} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors" style={{ color: '#9D9D9D', backgroundColor: '#3D3D3D' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Terug
            </button>
          </div>

          {/* Totalen balk */}
          <div className="rounded-xl p-4 grid grid-cols-2 gap-4 md:grid-cols-4" style={{ backgroundColor: '#3D3D3D' }}>
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-xs">Arbeidskosten</p>
              <p className="text-white font-semibold text-lg">{formatCurrency(totalen.subtotaalArbeid)}</p>
            </div>
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-xs">Reiskosten</p>
              <p className="text-white font-semibold text-lg">{formatCurrency(totalen.subtotaalReisKm + totalen.subtotaalReisUur)}</p>
            </div>
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-xs">Totaal excl. BTW</p>
              <p className="text-white font-semibold text-lg">{formatCurrency(totalen.totaal)}</p>
            </div>
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-xs">Totaal incl. BTW</p>
              <p className="font-bold text-xl" style={{ color: '#00E8FF' }}>{formatCurrency(totalen.totaalInclBTW)}</p>
            </div>
          </div>

          {/* Per monteur → per dag */}
          {techDagGroepen.map(({ tech, dagen }) => (
            <div key={tech} className="space-y-4">
              {/* Monteur sectieheader */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1" style={{ backgroundColor: '#4D4D4D' }} />
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#3D3D3D', color: '#00E8FF' }}>
                  {tech || 'Onbekend'}
                </span>
                <div className="h-px flex-1" style={{ backgroundColor: '#4D4D4D' }} />
              </div>

              {/* Dagen */}
              {dagen.map(dag => {
                const dagArbeid = dag.klussen.reduce((s, k) => s + k.arbeidskosten, 0)
                const dagReis = dag.rits.reduce((s, r) => s + r.totaal, 0)
                const dagTotaal = Math.round((dagArbeid + dagReis) * 100) / 100
                const timeline = buildTimeline(dag.klussen, dag.rits)

                return (
                  <div key={dag.datum} className="rounded-xl overflow-hidden" style={{ border: '1px solid #4D4D4D' }}>
                    {/* Dagheader */}
                    <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: '#3A3A3A' }}>
                      <div>
                        <p className="text-white font-semibold text-sm">{datumLang(dag.datum)}</p>
                        <p className="text-xs" style={{ color: '#9D9D9D' }}>
                          {dag.klussen.length} klus(sen) · {dag.rits.length} rit(ten)
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold" style={{ color: '#00E8FF' }}>{formatCurrency(dagTotaal)}</p>
                        <button
                          onClick={() => handleDeleteDag(dag.datum, tech)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-opacity hover:opacity-70"
                          style={{ color: '#FF5050', backgroundColor: 'rgba(255,80,80,0.1)' }}
                          title="Verwijder volledige dag"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Dag
                        </button>
                      </div>
                    </div>

                    {/* Timeline: ritten en klussen afwisselend */}
                    <div className="p-3 space-y-1.5">
                      {timeline.map(item =>
                        item.type === 'rit' ? (
                          <RitRij key={item.rit.id} rit={item.rit} onUpdate={handleRitUpdate} onDelete={handleDeleteRit} />
                        ) : (
                          <KlusRij key={item.klus.id} klus={item.klus} onUpdate={handleKlusUpdate} onDelete={handleDeleteKlus} />
                        )
                      )}
                      {timeline.length === 0 && (
                        <p className="text-xs text-center py-2" style={{ color: '#6D6D6D' }}>Geen items</p>
                      )}
                    </div>

                    {/* Dag subtotaal balk */}
                    <div className="px-4 py-2 flex gap-6 text-xs border-t" style={{ borderColor: '#4D4D4D', backgroundColor: '#333333' }}>
                      <span style={{ color: '#9D9D9D' }}>Arbeid: {formatCurrency(dagArbeid)}</span>
                      <span style={{ color: '#9D9D9D' }}>Reiskosten: {formatCurrency(dagReis)}</span>
                      <span className="ml-auto font-semibold" style={{ color: '#ffffff' }}>Dag totaal: {formatCurrency(dagTotaal)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Los project toevoegen */}
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleProjectFileChange} />
            {addProjectError && (
              <p className="text-xs mb-2" style={{ color: '#FF5050' }}>{addProjectError}</p>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAddingProject}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: '#3D3D3D', color: '#9D9D9D', border: '1px solid #4D4D4D' }}
            >
              {isAddingProject ? 'Project inlezen...' : '+ Voeg los project toe'}
            </button>
          </div>

          {/* Sticky footer */}
          <div
            className="rounded-xl p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky bottom-4"
            style={{ backgroundColor: '#3D3D3D', boxShadow: '0 -4px 20px rgba(0,0,0,0.5)' }}
          >
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-sm">Maandtotaal</p>
              <p className="text-3xl font-bold" style={{ color: '#00E8FF' }}>{formatCurrency(totalen.totaalInclBTW)}</p>
              <p style={{ color: '#6D6D6D' }} className="text-xs mt-1">
                excl. BTW {formatCurrency(totalen.totaal)} · BTW {formatCurrency(totalen.btw)}
              </p>
              <p style={{ color: '#6D6D6D' }} className="text-xs">
                {klussen.length} werkbonnen · {formatNumber(klussen.reduce((s, k) => s + k.duur, 0), 2)} uur
              </p>
            </div>
            <button
              onClick={handleDoorgaan}
              disabled={isSaving}
              className="flex items-center justify-center gap-3 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)', minWidth: '220px' }}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
                  Even geduld...
                </>
              ) : (
                <>
                  Doorgaan naar factuur
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
