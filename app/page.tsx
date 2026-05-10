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
      // Step 1: Parse PDF
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

      const { klussen: parsedKlussen } = await parseResponse.json()
      setProgress(`${parsedKlussen.length} klussen gevonden. Tarieven ophalen...`)
      setProgressPercent(25)

      // Step 2: Fetch tarieven
      const tarievenResponse = await fetch('/api/tarieven')
      const tarieven: Tarief[] = await tarievenResponse.json()

      setProgress('Afstanden berekenen via Google Maps...')
      setProgressPercent(35)

      // Step 3: Get distances for each klus
      const klussen: Klus[] = []
      const total = parsedKlussen.length

      for (let i = 0; i < total; i++) {
        const parsedKlus = parsedKlussen[i]
        const progressPct = 35 + Math.round(((i + 1) / total) * 50)
        setProgress(`Afstand berekenen: ${parsedKlus.locatie} (${i + 1}/${total})...`)
        setProgressPercent(progressPct)

        // Get distance
        let afstandKm = 0
        let reisUren = 0

        if (parsedKlus.locatie) {
          try {
            const mapsResponse = await fetch(
              `/api/maps?locatie=${encodeURIComponent(parsedKlus.locatie)}`
            )
            if (mapsResponse.ok) {
              const mapsData = await mapsResponse.json()
              afstandKm = mapsData.km || 0
              reisUren = mapsData.uren || 0
            }
          } catch {
            // Fallback to 0
          }
        }

        // Determine uurtarief based on werkzaamheden codes
        let uurtarief = 60 // default
        if (parsedKlus.werkzaamhedenCodes && parsedKlus.werkzaamhedenCodes.length > 0) {
          const matchedTarieven = (parsedKlus.werkzaamhedenCodes as string[])
            .map((code: string) => tarieven.find(t => t.code === code))
            .filter(Boolean) as Tarief[]

          if (matchedTarieven.length > 0) {
            // Use highest tarief when multiple codes
            uurtarief = Math.max(...matchedTarieven.map(t => t.uurtarief))
          }
        }

        const klus = berekenKlus(parsedKlus, afstandKm, reisUren, uurtarief)
        klussen.push(klus)
      }

      setProgress('Offerte samenstellen...')
      setProgressPercent(90)

      // Step 4: Build offerte
      const now = new Date()
      const jaar = now.getFullYear()

      // Try to extract month from first klus datum
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

      // Store in sessionStorage
      sessionStorage.setItem('offerte', JSON.stringify(offerte))

      setProgressPercent(100)
      setProgress('Gereed!')

      // Navigate to review
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
                  <span>Werklocaties worden herkend en afstanden via Google Maps berekend vanuit Naaldwijk</span>
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
