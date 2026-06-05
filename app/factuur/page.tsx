'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import StepIndicator from '@/components/StepIndicator'
import PdfUpload from '@/components/PdfUpload'
import type { Klus, Rit, Factuur, Tarief } from '@/types'
import { berekenKlus, berekenRit, berekenOfferteTotalen, formatCurrency } from '@/lib/calculations'

const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

interface ParsedKlus {
  id?: string
  dag?: string
  datum?: string
  duur?: number
  projectNaam?: string
  locatie?: string
  mapsQuery?: string
  projectCode?: string
  werkbonNummer?: string
  werkzaamhedenOmschrijving?: string
  werkzaamhedenCodes?: string[]
  technicianName?: string
}

interface SlimmeKilometersResult {
  rits: Rit[]
  locatieErrors: Map<string, string>
}

interface ValidationWarning {
  type: 'error' | 'warning' | 'info'
  veld?: string
  opdracht?: string
  bericht: string
}

interface ValidatieResultaat {
  aantalOpdrachten: number
  meldingen: ValidationWarning[]
  factuur: Factuur
}

async function fetchKm(query: string, origin?: string, verwachtLocatie?: string): Promise<{ km: number; uren: number; error?: string }> {
  try {
    const base = origin
      ? `/api/maps?origin=${encodeURIComponent(origin)}&locatie=${encodeURIComponent(query)}`
      : `/api/maps?locatie=${encodeURIComponent(query)}`
    const url = !origin && verwachtLocatie
      ? `${base}&verwachtLocatie=${encodeURIComponent(verwachtLocatie)}`
      : base
    const resp = await fetch(url)
    if (!resp.ok) return { km: 0, uren: 0, error: `HTTP-fout bij opzoeken: "${query}"` }
    return await resp.json()
  } catch {
    return { km: 0, uren: 0, error: `Netwerkfout bij opzoeken: "${query}"` }
  }
}

async function berekenSlimmeKilometers(
  klussen: ParsedKlus[],
  onProgress: (msg: string) => void
): Promise<SlimmeKilometersResult> {
  const locatieErrors = new Map<string, string>()
  const rits: Rit[] = []

  // Unieke locaties → mapsQuery mapping
  const mapsQueryPerLocatie = new Map<string, string>()
  for (const klus of klussen) {
    if (klus.locatie && !mapsQueryPerLocatie.has(klus.locatie)) {
      mapsQueryPerLocatie.set(klus.locatie, klus.mapsQuery || klus.locatie)
    }
  }

  // Afstand Naaldwijk → elke unieke locatie
  const uniqueLocaties = [...mapsQueryPerLocatie.keys()]
  onProgress(`Afstanden ophalen voor ${uniqueLocaties.length} locatie(s)...`)
  const naaldwijkData = new Map<string, { km: number; uren: number }>()
  for (const loc of uniqueLocaties) {
    const query = mapsQueryPerLocatie.get(loc)!
    onProgress(`Afstand berekenen: ${query}...`)
    const result = await fetchKm(query, undefined, loc)
    if (result.error) locatieErrors.set(loc, result.error)
    naaldwijkData.set(loc, result)
  }

  // Groepeer klussen per technicus per dag
  const dagGroepen = new Map<string, number[]>()
  for (let i = 0; i < klussen.length; i++) {
    const tech = klussen[i].technicianName || ''
    const key = `${tech}|||${klussen[i].datum || 'onbekend'}`
    if (!dagGroepen.has(key)) dagGroepen.set(key, [])
    dagGroepen.get(key)!.push(i)
  }

  // Tussenafstanden voor consecutieve locaties per dag
  const tussenData = new Map<string, { km: number; uren: number }>()
  for (const [, indices] of dagGroepen) {
    const locatieReeks: string[] = []
    for (const idx of indices) {
      const loc = klussen[idx].locatie
      if (loc && (locatieReeks.length === 0 || locatieReeks[locatieReeks.length - 1] !== loc)) {
        locatieReeks.push(loc)
      }
    }
    for (let i = 0; i < locatieReeks.length - 1; i++) {
      const paarSleutel = `${locatieReeks[i]}|||${locatieReeks[i + 1]}`
      if (!tussenData.has(paarSleutel)) {
        const originQuery = mapsQueryPerLocatie.get(locatieReeks[i]) || locatieReeks[i]
        const destQuery = mapsQueryPerLocatie.get(locatieReeks[i + 1]) || locatieReeks[i + 1]
        onProgress(`Tussenafstand berekenen: ${originQuery} → ${destQuery}...`)
        const result = await fetchKm(destQuery, originQuery)
        if ((result.km === 0 || result.error) && !locatieErrors.has(locatieReeks[i + 1])) {
          locatieErrors.set(locatieReeks[i + 1], result.error ?? `Tussenafstand is 0 km — controleer handmatig`)
        }
        tussenData.set(paarSleutel, result)
      }
    }
  }

  // Bouw expliciete Rit-objecten per dag per technicus
  for (const [key, indices] of dagGroepen) {
    const keyParts = key.split('|||')
    const tech = keyParts[0]
    const datum = keyParts[1]

    // Groepeer klus-indices per locatie (behoud volgorde)
    const groepen: { locatie: string; indices: number[] }[] = []
    for (const idx of indices) {
      const loc = klussen[idx].locatie || ''
      if (groepen.length === 0 || groepen[groepen.length - 1].locatie !== loc) {
        groepen.push({ locatie: loc, indices: [idx] })
      } else {
        groepen[groepen.length - 1].indices.push(idx)
      }
    }

    for (let gi = 0; gi < groepen.length; gi++) {
      const loc = groepen[gi].locatie
      if (!loc) continue

      if (gi === 0) {
        // Rit Naaldwijk → eerste locatie
        const data = naaldwijkData.get(loc) ?? { km: 0, uren: 0 }
        rits.push(berekenRit(datum, 'Naaldwijk', loc, data.km, data.uren, tech || undefined, locatieErrors.get(loc)))
      } else {
        // Tussenrit vorige → huidige locatie
        const prevLoc = groepen[gi - 1].locatie
        if (prevLoc) {
          const paarSleutel = `${prevLoc}|||${loc}`
          const data = tussenData.get(paarSleutel) ?? { km: 0, uren: 0 }
          rits.push(berekenRit(datum, prevLoc, loc, data.km, data.uren, tech || undefined, locatieErrors.get(loc)))
        }
      }
    }

    // Rit laatste locatie → Naaldwijk
    const lastLoc = groepen.length > 0 ? groepen[groepen.length - 1].locatie : ''
    if (lastLoc) {
      const data = naaldwijkData.get(lastLoc) ?? { km: 0, uren: 0 }
      rits.push(berekenRit(datum, lastLoc, 'Naaldwijk', data.km, data.uren, tech || undefined))
    }
  }

  return { rits, locatieErrors }
}

function valideerFactuur(klussen: Klus[], rits: Rit[], factuur: Factuur): ValidationWarning[] {
  const meldingen: ValidationWarning[] = []

  for (const klus of klussen) {
    if (klus.duur <= 0) {
      meldingen.push({
        type: 'error',
        veld: 'arbeidsuren',
        opdracht: klus.projectNaam,
        bericht: `Arbeidsuren zijn 0 of negatief bij: ${klus.projectNaam} (${klus.datum})`,
      })
    }
  }

  const rits0km = rits.filter(r => r.afstandKm === 0 && !r.locatieError)
  if (rits0km.length > 0 && rits0km.length === rits.length && rits.length > 0) {
    meldingen.push({
      type: 'warning',
      veld: 'afstandKm',
      bericht: `Alle ritten hebben afstand 0 km — mogelijk is de Google Maps API niet geconfigureerd.`,
    })
  } else if (rits0km.length > 0) {
    meldingen.push({
      type: 'warning',
      veld: 'afstandKm',
      bericht: `${rits0km.length} rit(ten) hebben afstand 0 km zonder foutmelding — controleer handmatig.`,
    })
  }

  const somKlussen = Math.round(klussen.reduce((s, k) => s + k.totaal, 0) * 100) / 100
  const somRits = Math.round(rits.reduce((s, r) => s + r.totaal, 0) * 100) / 100
  const somTotaal = Math.round((somKlussen + somRits) * 100) / 100
  if (Math.abs(somTotaal - factuur.totaal) > 0.01) {
    meldingen.push({
      type: 'warning',
      bericht: `Totaalbedrag afwijking: berekend = ${formatCurrency(somTotaal)}, opgeslagen = ${formatCurrency(factuur.totaal)}`,
    })
  }

  return meldingen
}

export default function FactuurPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [progress, setProgress] = useState<string>('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [validatieResultaat, setValidatieResultaat] = useState<ValidatieResultaat | null>(null)
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [addProjectError, setAddProjectError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(undefined)
    setValidatieResultaat(null)
    setProgress('PDF inlezen...')
    setProgressPercent(10)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const parseResponse = await fetch('/api/parse-pdf', { method: 'POST', body: formData })
      if (!parseResponse.ok) {
        const err = await parseResponse.json()
        throw new Error(err.error || 'Fout bij verwerken van PDF')
      }

      const { klussen: parsedKlussen } = await parseResponse.json() as { klussen: ParsedKlus[] }
      setProgress(`${parsedKlussen.length} klussen gevonden. Tarieven ophalen...`)
      setProgressPercent(25)

      const tarievenResponse = await fetch('/api/tarieven')
      const tarieven: Tarief[] = await tarievenResponse.json()

      setProgress('Afstanden berekenen via Google Maps...')
      setProgressPercent(35)

      const { rits, locatieErrors } = await berekenSlimmeKilometers(parsedKlussen, (msg) => setProgress(msg))

      setProgress('Factuur samenstellen...')
      setProgressPercent(85)

      // Klussen krijgen 0 km — reiskosten zitten volledig in rits
      const klussen: Klus[] = parsedKlussen.map((parsedKlus) => {
        let uurtarief = 60
        if (parsedKlus.werkzaamhedenCodes && parsedKlus.werkzaamhedenCodes.length > 0) {
          const matchedTarieven = (parsedKlus.werkzaamhedenCodes as string[])
            .map((code: string) => tarieven.find(t => t.code === code))
            .filter(Boolean) as Tarief[]
          if (matchedTarieven.length > 0) {
            uurtarief = Math.max(...matchedTarieven.map(t => t.uurtarief))
          }
        }
        const klus = berekenKlus(parsedKlus, 0, 0, uurtarief)
        klus.mapsQuery = parsedKlus.mapsQuery
        const fout = parsedKlus.locatie ? locatieErrors.get(parsedKlus.locatie) : undefined
        if (fout) klus.mapsError = fout
        return klus
      })

      setProgressPercent(90)

      const now = new Date()
      const jaar = now.getFullYear()
      let maand = MAANDEN[now.getMonth()]
      if (klussen.length > 0 && klussen[0].datum) {
        const datumParts = klussen[0].datum.split('-')
        if (datumParts.length >= 2) {
          const maandNum = parseInt(datumParts[1]) - 1
          if (maandNum >= 0 && maandNum < 12) maand = MAANDEN[maandNum]
        }
      }

      const totalen = berekenOfferteTotalen(klussen, rits)

      const factuur: Factuur = {
        maand, jaar, klussen, rits,
        ...totalen,
        aangemaakt: new Date().toISOString(),
      }

      setProgressPercent(100)
      setProgress('Valideren...')

      const meldingen = valideerFactuur(klussen, rits, factuur)
      setValidatieResultaat({ aantalOpdrachten: klussen.length, meldingen, factuur })
      setIsLoading(false)
      setProgress('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout opgetreden')
      setIsLoading(false)
      setProgress('')
      setProgressPercent(0)
    }
  }, [])

  const handleBevestigen = () => {
    if (!validatieResultaat) return
    sessionStorage.setItem('factuur', JSON.stringify(validatieResultaat.factuur))
    router.push('/factuur/review')
  }

  const handleOpnieuwBeginnen = () => {
    setValidatieResultaat(null)
    setError(undefined)
    setProgress('')
    setProgressPercent(0)
  }

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
        const matchedTarieven = parsedKlus.werkzaamhedenCodes
          .map(code => tarieven.find(t => t.code === code))
          .filter(Boolean) as Tarief[]
        if (matchedTarieven.length > 0) {
          uurtarief = Math.max(...matchedTarieven.map(t => t.uurtarief))
        }
      }

      let mapsError: string | undefined
      const newRits: Rit[] = []
      const mapsTarget = parsedKlus.mapsQuery || parsedKlus.locatie
      if (mapsTarget) {
        const result = await fetch(`/api/maps?locatie=${encodeURIComponent(mapsTarget)}`).then(r => r.json())
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

      setValidatieResultaat(prev => {
        if (!prev) return prev
        const newKlussen = [...prev.factuur.klussen, klus]
        const newAllRits = [...(prev.factuur.rits ?? []), ...newRits]
        const totalen = berekenOfferteTotalen(newKlussen, newAllRits)
        const updatedFactuur: Factuur = { ...prev.factuur, klussen: newKlussen, rits: newAllRits, ...totalen }
        return {
          ...prev,
          aantalOpdrachten: newKlussen.length,
          meldingen: valideerFactuur(newKlussen, newAllRits, updatedFactuur),
          factuur: updatedFactuur,
        }
      })
    } catch {
      setAddProjectError('Verbindingsfout — probeer opnieuw.')
    } finally {
      setIsAddingProject(false)
    }
  }

  const aantalErrors = validatieResultaat?.meldingen.filter(m => m.type === 'error').length ?? 0
  const aantalWarnings = validatieResultaat?.meldingen.filter(m => m.type === 'warning').length ?? 0

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#2D2D2D' }}>
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <StepIndicator currentStep={1} flow="factuur" />

        <div className="mt-8 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Planning uploaden</h1>
            <p style={{ color: '#9D9D9D' }} className="mt-2 text-sm">
              Upload de weekplanning PDF van ExcelAir System-Care
            </p>
          </div>

          {validatieResultaat ? (
            <div className="max-w-2xl mx-auto space-y-4">
              <div
                className="rounded-xl p-4 flex items-center gap-3"
                style={{ backgroundColor: '#3D3D3D', border: '1px solid #4D4D4D' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-base"
                  style={{ backgroundColor: 'rgba(0, 232, 255, 0.15)', color: '#00E8FF' }}
                >
                  {validatieResultaat.aantalOpdrachten}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {validatieResultaat.aantalOpdrachten} opdrachten uitgelezen
                  </p>
                  <p style={{ color: '#9D9D9D' }} className="text-xs">
                    {(validatieResultaat.factuur.rits ?? []).length} ritten berekend — vergelijk met de PDF
                  </p>
                </div>
                <div className="ml-auto">
                  {aantalErrors === 0 && aantalWarnings === 0 ? (
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(0, 200, 100, 0.15)', color: '#00C864' }}>
                      Alles OK
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(255, 170, 0, 0.15)', color: '#FFAA00' }}>
                      {validatieResultaat.meldingen.length} melding(en)
                    </span>
                  )}
                </div>
              </div>

              {aantalErrors > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255, 80, 80, 0.4)' }}>
                  <div className="px-4 py-2" style={{ backgroundColor: 'rgba(255, 80, 80, 0.15)' }}>
                    <p className="text-sm font-semibold" style={{ color: '#FF5050' }}>Fouten — controleer vóór het doorgaan</p>
                  </div>
                  {validatieResultaat.meldingen.filter(m => m.type === 'error').map((m, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-2" style={{ backgroundColor: 'rgba(255, 80, 80, 0.05)', borderTop: i > 0 ? '1px solid rgba(255, 80, 80, 0.2)' : undefined }}>
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FF5050' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <p className="text-sm" style={{ color: '#FF9090' }}>{m.bericht}</p>
                    </div>
                  ))}
                </div>
              )}

              {aantalWarnings > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255, 170, 0, 0.4)' }}>
                  <div className="px-4 py-2" style={{ backgroundColor: 'rgba(255, 170, 0, 0.15)' }}>
                    <p className="text-sm font-semibold" style={{ color: '#FFAA00' }}>Waarschuwingen</p>
                  </div>
                  {validatieResultaat.meldingen.filter(m => m.type === 'warning').map((m, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-2" style={{ backgroundColor: 'rgba(255, 170, 0, 0.05)', borderTop: i > 0 ? '1px solid rgba(255, 170, 0, 0.2)' : undefined }}>
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FFAA00' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                      <p className="text-sm" style={{ color: '#FFCC66' }}>{m.bericht}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleOpnieuwBeginnen}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#3D3D3D', color: '#9D9D9D', border: '1px solid #4D4D4D' }}
                >
                  Opnieuw beginnen
                </button>
                <button
                  onClick={handleBevestigen}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{
                    background: aantalErrors > 0
                      ? 'linear-gradient(90deg, #CC3333, #FF5050)'
                      : 'linear-gradient(90deg, #0055FF, #00E8FF)',
                    color: '#ffffff',
                  }}
                >
                  {aantalErrors > 0 ? 'Toch doorgaan naar review →' : 'Doorgaan naar review →'}
                </button>
              </div>

              <div className="pt-1">
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
            </div>
          ) : (
            <>
              <PdfUpload onUpload={handleUpload} isLoading={isLoading} error={error} label="weekplanning" />

              {isLoading && (
                <div className="max-w-2xl mx-auto space-y-3">
                  <div className="rounded-full h-2 overflow-hidden" style={{ backgroundColor: '#3D3D3D' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #0055FF, #00E8FF)' }}
                    />
                  </div>
                  <p style={{ color: '#9D9D9D' }} className="text-sm text-center">{progress}</p>
                </div>
              )}

              {!isLoading && !error && (
                <div className="max-w-2xl mx-auto rounded-xl p-5 space-y-3" style={{ backgroundColor: '#3D3D3D' }}>
                  <h2 className="text-white font-semibold text-sm">Hoe werkt het?</h2>
                  <ol className="space-y-2 text-sm" style={{ color: '#9D9D9D' }}>
                    {[
                      'Upload de weekplanning PDF van ExcelAir System-Care',
                      'Werklocaties worden herkend en afstanden slim berekend via Google Maps (gedeeld per dag)',
                      'Tarieven worden gekoppeld aan werkzaamheden codes en prijzen worden berekend',
                      'Review en pas aan waar nodig, genereer dan de definitieve factuur PDF',
                    ].map((stap, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#0055FF', color: '#fff' }}>
                          {i + 1}
                        </span>
                        <span>{stap}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
