'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import StepIndicator from '@/components/StepIndicator'
import PdfUpload from '@/components/PdfUpload'
import type { Klus, Offerte, Tarief } from '@/types'
import { berekenKlus, berekenOfferteTotalen } from '@/lib/calculations'

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
  projectCode?: string
  werkbonNummer?: string
  werkzaamhedenOmschrijving?: string
  werkzaamhedenCodes?: string[]
}

interface KmAllocation {
  afstandKm: number   // totaal toegewezen km (heen + terug via smart-logica)
  reisUren: number    // allocatedTime / 2 (formule verdubbelt: × 2 × €55 × 1.15)
}

async function fetchKmNaarLocatie(locatie: string): Promise<{ km: number; uren: number }> {
  try {
    const resp = await fetch(`/api/maps?locatie=${encodeURIComponent(locatie)}`)
    if (!resp.ok) return { km: 0, uren: 0 }
    return await resp.json()
  } catch {
    return { km: 0, uren: 0 }
  }
}

async function fetchKmTussen(origin: string, destination: string): Promise<{ km: number; uren: number }> {
  try {
    const resp = await fetch(
      `/api/maps?origin=${encodeURIComponent(origin)}&locatie=${encodeURIComponent(destination)}`
    )
    if (!resp.ok) return { km: 0, uren: 0 }
    return await resp.json()
  } catch {
    return { km: 0, uren: 0 }
  }
}

/**
 * Bereken per klus de toegewezen km en reisuren op basis van de slimme logica:
 * - Zelfde locatie op één dag: heenrit bij eerste klus, terugrit bij laatste klus.
 * - Verschillende locaties op één dag: fifty-fifty verdeling tussen opeenvolgende locaties.
 */
async function berekenSlimmeKilometers(
  klussen: ParsedKlus[],
  onProgress: (msg: string) => void
): Promise<Map<number, KmAllocation>> {
  const allocations = new Map<number, KmAllocation>()
  for (let i = 0; i < klussen.length; i++) {
    allocations.set(i, { afstandKm: 0, reisUren: 0 })
  }

  // Verzamel unieke locaties
  const uniqueLocaties = [...new Set(klussen.map(k => k.locatie).filter(Boolean))] as string[]

  // Haal Naaldwijk → locatie op (one-way) voor elke unieke locatie
  onProgress(`Afstanden ophalen voor ${uniqueLocaties.length} locatie(s)...`)
  const naaldwijkData = new Map<string, { km: number; uren: number }>()
  for (const loc of uniqueLocaties) {
    naaldwijkData.set(loc, await fetchKmNaarLocatie(loc))
  }

  // Groepeer klussen per dag (op basis van datum)
  const dagGroepen = new Map<string, number[]>() // datum → indices in klussen[]
  for (let i = 0; i < klussen.length; i++) {
    const key = klussen[i].datum || 'onbekend'
    if (!dagGroepen.has(key)) dagGroepen.set(key, [])
    dagGroepen.get(key)!.push(i)
  }

  // Haal tussenliggende afstanden op voor opeenvolgende verschillende locaties op dezelfde dag
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
        onProgress(`Tussenafstand berekenen: ${locatieReeks[i]} → ${locatieReeks[i + 1]}...`)
        tussenData.set(paarSleutel, await fetchKmTussen(locatieReeks[i], locatieReeks[i + 1]))
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

  return allocations
}

// ──────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [progress, setProgress] = useState<string>('')
  const [progressPercent, setProgressPercent] = useState(0)

  const handleUpload = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(undefined)
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
      const allocations = await berekenSlimmeKilometers(
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
        return berekenKlus(parsedKlus, Math.round(afstandKm * 10) / 10, Math.round(reisUren * 100) / 100, uurtarief)
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

      sessionStorage.setItem('offerte', JSON.stringify(offerte))

      setProgressPercent(100)
      setProgress('Gereed!')

      setTimeout(() => {
        router.push('/review')
      }, 300)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout opgetreden')
      setIsLoading(false)
      setProgress('')
      setProgressPercent(0)
    }
  }, [router])

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
        </div>
      </main>
    </div>
  )
}
