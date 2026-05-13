'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import StepIndicator from '@/components/StepIndicator'
import PdfUpload from '@/components/PdfUpload'
import type { Klus, Offerte, Tarief } from '@/types'
import { berekenKlus, berekenOfferteTotalen, formatCurrency } from '@/lib/calculations'

const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

// ─── Helpers voor slimme kilometerberekening ───────────────────────────────

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
}

interface KmAllocation {
  afstandKm: number   // totaal toegewezen km (heen + terug via smart-logica)
  reisUren: number    // allocatedTime / 2 (formule verdubbelt: × 2 × €55 × 1.15)
}

interface SlimmeKilometersResult {
  allocations: Map<number, KmAllocation>
  locatieErrors: Map<string, string> // locatie → foutmelding voor in de KlusCard
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
  offerte: Offerte
}

async function fetchKm(query: string, origin?: string): Promise<{ km: number; uren: number; error?: string }> {
  try {
    const url = origin
      ? `/api/maps?origin=${encodeURIComponent(origin)}&locatie=${encodeURIComponent(query)}`
      : `/api/maps?locatie=${encodeURIComponent(query)}`
    const resp = await fetch(url)
    if (!resp.ok) return { km: 0, uren: 0, error: `HTTP-fout bij opzoeken: "${query}"` }
    return await resp.json()
  } catch {
    return { km: 0, uren: 0, error: `Netwerkfout bij opzoeken: "${query}"` }
  }
}

/**
 * Bereken per klus de toegewezen km en reisuren op basis van de slimme logica.
 * Gebruikt de volledige mapsQuery (projectnaam zonder codes) voor Google Maps.
 * - Zelfde locatie op één dag: heenrit bij eerste klus, terugrit bij laatste klus.
 * - Verschillende locaties op één dag: fifty-fifty verdeling tussen opeenvolgende locaties.
 */
async function berekenSlimmeKilometers(
  klussen: ParsedKlus[],
  onProgress: (msg: string) => void
): Promise<SlimmeKilometersResult> {
  const allocations = new Map<number, KmAllocation>()
  const locatieErrors = new Map<string, string>()
  for (let i = 0; i < klussen.length; i++) {
    allocations.set(i, { afstandKm: 0, reisUren: 0 })
  }

  // Per unieke locatie: gebruik de mapsQuery van de eerste klus op die locatie
  const mapsQueryPerLocatie = new Map<string, string>()
  for (const klus of klussen) {
    if (klus.locatie && !mapsQueryPerLocatie.has(klus.locatie)) {
      mapsQueryPerLocatie.set(klus.locatie, klus.mapsQuery || klus.locatie)
    }
  }

  // Haal Naaldwijk → locatie op (one-way) voor elke unieke locatie via volledige mapsQuery
  const uniqueLocaties = [...mapsQueryPerLocatie.keys()]
  onProgress(`Afstanden ophalen voor ${uniqueLocaties.length} locatie(s)...`)
  const naaldwijkData = new Map<string, { km: number; uren: number }>()
  for (const loc of uniqueLocaties) {
    const query = mapsQueryPerLocatie.get(loc)!
    onProgress(`Afstand berekenen: ${query}...`)
    const result = await fetchKm(query)
    if (result.error) locatieErrors.set(loc, result.error)
    naaldwijkData.set(loc, result)
  }

  // Groepeer klussen per dag (op basis van datum)
  const dagGroepen = new Map<string, number[]>()
  for (let i = 0; i < klussen.length; i++) {
    const key = klussen[i].datum || 'onbekend'
    if (!dagGroepen.has(key)) dagGroepen.set(key, [])
    dagGroepen.get(key)!.push(i)
  }

  // Haal tussenliggende afstanden op voor opeenvolgende verschillende locaties op dezelfde dag
  // Gebruikt de mapsQuery van de respectievelijke locaties als origin/destination
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
        if (result.error && !locatieErrors.has(locatieReeks[i + 1])) {
          locatieErrors.set(locatieReeks[i + 1], result.error)
        }
        tussenData.set(paarSleutel, result)
      }
    }
  }

  // Ken km/uren toe per klus per dag
  for (const [, indices] of dagGroepen) {
    // Bouw locatiegroepen: aaneengesloten klussen op dezelfde locatie
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
      const groep = groepen[gi]
      const eersteIdx = groep.indices[0]
      const laatsteIdx = groep.indices[groep.indices.length - 1]
      const loc = groep.locatie

      // Heenrit-toewijzing aan de eerste klus van deze groep
      if (gi === 0) {
        // Eerste groep van de dag: volledige heenrit vanuit Naaldwijk
        const data = loc ? (naaldwijkData.get(loc) ?? { km: 0, uren: 0 }) : { km: 0, uren: 0 }
        const cur = allocations.get(eersteIdx)!
        allocations.set(eersteIdx, {
          afstandKm: cur.afstandKm + data.km,
          reisUren: cur.reisUren + data.uren / 2,
        })
      } else {
        // Niet eerste groep: helft van de afstand van vorige locatie naar deze locatie
        const vorigeLoc = groepen[gi - 1].locatie
        const paarSleutel = `${vorigeLoc}|||${loc}`
        const data = loc && vorigeLoc ? (tussenData.get(paarSleutel) ?? { km: 0, uren: 0 }) : { km: 0, uren: 0 }
        const cur = allocations.get(eersteIdx)!
        allocations.set(eersteIdx, {
          afstandKm: cur.afstandKm + data.km / 2,
          reisUren: cur.reisUren + data.uren / 4,
        })
      }

      // Terugrit-toewijzing aan de laatste klus van deze groep
      if (gi === groepen.length - 1) {
        // Laatste groep van de dag: volledige terugrit naar Naaldwijk
        const data = loc ? (naaldwijkData.get(loc) ?? { km: 0, uren: 0 }) : { km: 0, uren: 0 }
        const cur = allocations.get(laatsteIdx)!
        allocations.set(laatsteIdx, {
          afstandKm: cur.afstandKm + data.km,
          reisUren: cur.reisUren + data.uren / 2,
        })
      } else {
        // Niet laatste groep: helft van de afstand van deze locatie naar volgende locatie
        const volgendeLoc = groepen[gi + 1].locatie
        const paarSleutel = `${loc}|||${volgendeLoc}`
        const data = loc && volgendeLoc ? (tussenData.get(paarSleutel) ?? { km: 0, uren: 0 }) : { km: 0, uren: 0 }
        const cur = allocations.get(laatsteIdx)!
        allocations.set(laatsteIdx, {
          afstandKm: cur.afstandKm + data.km / 2,
          reisUren: cur.reisUren + data.uren / 4,
        })
      }
    }
  }

  return { allocations, locatieErrors }
}

function valideerOfferte(klussen: Klus[], offerte: Offerte): ValidationWarning[] {
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

  const klussen0km = klussen.filter(k => k.afstandKm === 0 && k.reisUren === 0 && !k.mapsError)
  if (klussen0km.length > 0 && klussen0km.length === klussen.length) {
    meldingen.push({
      type: 'warning',
      veld: 'afstandKm',
      bericht: `Alle ${klussen.length} klussen hebben afstand 0 km en reistijd 0 — mogelijk is de Google Maps API niet geconfigureerd. Vul handmatig in bij de klussen.`,
    })
  } else if (klussen0km.length > 0) {
    const namen = klussen0km.slice(0, 3).map(k => k.projectNaam).join(', ')
    const extra = klussen0km.length > 3 ? ` en nog ${klussen0km.length - 3} meer` : ''
    meldingen.push({
      type: 'warning',
      veld: 'afstandKm',
      bericht: `${klussen0km.length} klus(sen) hebben afstand 0 km zonder foutmelding: ${namen}${extra}`,
    })
  }

  const somKlussen = Math.round(klussen.reduce((s, k) => s + k.totaal, 0) * 100) / 100
  if (Math.abs(somKlussen - offerte.totaal) > 0.01) {
    meldingen.push({
      type: 'warning',
      bericht: `Totaalbedrag afwijking: som klussen = ${formatCurrency(somKlussen)}, offerte totaal = ${formatCurrency(offerte.totaal)}`,
    })
  }

  return meldingen
}

// ──────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [progress, setProgress] = useState<string>('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [validatieResultaat, setValidatieResultaat] = useState<ValidatieResultaat | null>(null)

  const handleUpload = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(undefined)
    setValidatieResultaat(null)
    setProgress('PDF inlezen...')
    setProgressPercent(10)

    try {
      // Stap 1: PDF parsen
      const formData = new FormData()
      formData.append('file', file)

      const parseResponse = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!parseResponse.ok) {
        const err = await parseResponse.json()
        throw new Error(err.error || 'Fout bij verwerken van PDF')
      }

      const { klussen: parsedKlussen } = await parseResponse.json() as { klussen: ParsedKlus[] }
      setProgress(`${parsedKlussen.length} klussen gevonden. Tarieven ophalen...`)
      setProgressPercent(25)

      // Stap 2: Tarieven ophalen
      const tarievenResponse = await fetch('/api/tarieven')
      const tarieven: Tarief[] = await tarievenResponse.json()

      setProgress('Afstanden berekenen via Google Maps...')
      setProgressPercent(35)

      // Stap 3: Slimme kilometerberekening (per dag gegroepeerd)
      const { allocations, locatieErrors } = await berekenSlimmeKilometers(
        parsedKlussen,
        (msg) => setProgress(msg)
      )

      setProgress('Offerte samenstellen...')
      setProgressPercent(85)

      // Stap 4: Klussen opbouwen met tarieven en allocaties
      const klussen: Klus[] = parsedKlussen.map((parsedKlus, i) => {
        let uurtarief = 60
        if (parsedKlus.werkzaamhedenCodes && parsedKlus.werkzaamhedenCodes.length > 0) {
          const matchedTarieven = (parsedKlus.werkzaamhedenCodes as string[])
            .map((code: string) => tarieven.find(t => t.code === code))
            .filter(Boolean) as Tarief[]
          if (matchedTarieven.length > 0) {
            uurtarief = Math.max(...matchedTarieven.map(t => t.uurtarief))
          }
        }

        const { afstandKm, reisUren } = allocations.get(i) ?? { afstandKm: 0, reisUren: 0 }
        const klus = berekenKlus(parsedKlus, Math.round(afstandKm * 10) / 10, Math.round(reisUren * 100) / 100, uurtarief)
        klus.mapsQuery = parsedKlus.mapsQuery
        const fout = parsedKlus.locatie ? locatieErrors.get(parsedKlus.locatie) : undefined
        if (fout) klus.mapsError = fout
        return klus
      })

      setProgressPercent(90)

      // Stap 5: Offerte opbouwen
      const now = new Date()
      const jaar = now.getFullYear()

      let maand = MAANDEN[now.getMonth()]
      if (klussen.length > 0 && klussen[0].datum) {
        const datumParts = klussen[0].datum.split('-')
        if (datumParts.length >= 2) {
          const maandNum = parseInt(datumParts[1]) - 1
          if (maandNum >= 0 && maandNum < 12) {
            maand = MAANDEN[maandNum]
          }
        }
      }

      const { subtotaalArbeid, subtotaalReisKm, subtotaalReisUur, totaal, btw, totaalInclBTW } =
        berekenOfferteTotalen(klussen)

      const offerte: Offerte = {
        maand,
        jaar,
        klussen,
        subtotaalArbeid,
        subtotaalReisKm,
        subtotaalReisUur,
        totaal,
        btw,
        totaalInclBTW,
        aangemaakt: new Date().toISOString(),
      }

      setProgressPercent(100)
      setProgress('Valideren...')

      const meldingen = valideerOfferte(klussen, offerte)
      setValidatieResultaat({ aantalOpdrachten: klussen.length, meldingen, offerte })
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
    sessionStorage.setItem('offerte', JSON.stringify(validatieResultaat.offerte))
    router.push('/review')
  }

  const handleOpnieuwBeginnen = () => {
    setValidatieResultaat(null)
    setError(undefined)
    setProgress('')
    setProgressPercent(0)
  }

  const aantalErrors = validatieResultaat?.meldingen.filter(m => m.type === 'error').length ?? 0
  const aantalWarnings = validatieResultaat?.meldingen.filter(m => m.type === 'warning').length ?? 0

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#2D2D2D' }}>
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <StepIndicator currentStep={1} />

        <div className="mt-8 space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">
              Planning uploaden
            </h1>
            <p style={{ color: '#9D9D9D' }} className="mt-2 text-sm">
              Upload de maandplanning PDF van ExcelAir System-Care
            </p>
          </div>

          {validatieResultaat ? (
            /* ── Validatiepaneel ── */
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Samenvatting */}
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
                    Vergelijk dit met het aantal regels in de PDF
                  </p>
                </div>
                <div className="ml-auto">
                  {aantalErrors === 0 && aantalWarnings === 0 ? (
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: 'rgba(0, 200, 100, 0.15)', color: '#00C864' }}
                    >
                      Alles OK
                    </span>
                  ) : (
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: 'rgba(255, 170, 0, 0.15)', color: '#FFAA00' }}
                    >
                      {validatieResultaat.meldingen.length} melding(en)
                    </span>
                  )}
                </div>
              </div>

              {/* Fouten */}
              {aantalErrors > 0 && (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(255, 80, 80, 0.4)' }}
                >
                  <div className="px-4 py-2" style={{ backgroundColor: 'rgba(255, 80, 80, 0.15)' }}>
                    <p className="text-sm font-semibold" style={{ color: '#FF5050' }}>
                      Fouten — controleer deze vóór het doorgaan
                    </p>
                  </div>
                  <div>
                    {validatieResultaat.meldingen.filter(m => m.type === 'error').map((m, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 flex items-start gap-2"
                        style={{
                          backgroundColor: 'rgba(255, 80, 80, 0.05)',
                          borderTop: i > 0 ? '1px solid rgba(255, 80, 80, 0.2)' : undefined,
                        }}
                      >
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FF5050' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <p className="text-sm" style={{ color: '#FF9090' }}>{m.bericht}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Waarschuwingen */}
              {aantalWarnings > 0 && (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(255, 170, 0, 0.4)' }}
                >
                  <div className="px-4 py-2" style={{ backgroundColor: 'rgba(255, 170, 0, 0.15)' }}>
                    <p className="text-sm font-semibold" style={{ color: '#FFAA00' }}>
                      Waarschuwingen
                    </p>
                  </div>
                  <div>
                    {validatieResultaat.meldingen.filter(m => m.type === 'warning').map((m, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 flex items-start gap-2"
                        style={{
                          backgroundColor: 'rgba(255, 170, 0, 0.05)',
                          borderTop: i > 0 ? '1px solid rgba(255, 170, 0, 0.2)' : undefined,
                        }}
                      >
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FFAA00' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <p className="text-sm" style={{ color: '#FFCC66' }}>{m.bericht}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Knoppen */}
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
            </div>
          ) : (
            <>
              {/* Upload component */}
              <PdfUpload
                onUpload={handleUpload}
                isLoading={isLoading}
                error={error}
              />

              {/* Progress */}
              {isLoading && (
                <div className="max-w-2xl mx-auto space-y-3">
                  <div
                    className="rounded-full h-2 overflow-hidden"
                    style={{ backgroundColor: '#3D3D3D' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                        background: 'linear-gradient(90deg, #0055FF, #00E8FF)',
                      }}
                    />
                  </div>
                  <p style={{ color: '#9D9D9D' }} className="text-sm text-center">
                    {progress}
                  </p>
                </div>
              )}

              {/* Instructions */}
              {!isLoading && !error && (
                <div
                  className="max-w-2xl mx-auto rounded-xl p-5 space-y-3"
                  style={{ backgroundColor: '#3D3D3D' }}
                >
                  <h2 className="text-white font-semibold text-sm">Hoe werkt het?</h2>
                  <ol className="space-y-2 text-sm" style={{ color: '#9D9D9D' }}>
                    <li className="flex gap-3">
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: '#0055FF', color: '#fff' }}
                      >
                        1
                      </span>
                      <span>Upload de maandplanning PDF van ExcelAir System-Care</span>
                    </li>
                    <li className="flex gap-3">
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: '#0055FF', color: '#fff' }}
                      >
                        2
                      </span>
                      <span>Werklocaties worden herkend en afstanden slim berekend via Google Maps (gedeeld per dag)</span>
                    </li>
                    <li className="flex gap-3">
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: '#0055FF', color: '#fff' }}
                      >
                        3
                      </span>
                      <span>Tarieven worden gekoppeld aan werkzaamheden codes en prijzen worden berekend</span>
                    </li>
                    <li className="flex gap-3">
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: '#0055FF', color: '#fff' }}
                      >
                        4
                      </span>
                      <span>Review en pas aan waar nodig, genereer dan de definitieve offerte PDF</span>
                    </li>
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
