'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import StepIndicator from '@/components/StepIndicator'
import KlusCard from '@/components/KlusCard'
import type { Klus, Offerte } from '@/types'
import { berekenOfferteTotalen, formatCurrency, formatNumber } from '@/lib/calculations'

export default function ReviewPage() {
  const router = useRouter()
  const [offerte, setOfferte] = useState<Offerte | null>(null)
  const [klussen, setKlussen] = useState<Klus[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('offerte')
    if (!stored) {
      router.push('/')
      return
    }
    const parsed: Offerte = JSON.parse(stored)
    setOfferte(parsed)
    setKlussen(parsed.klussen)
  }, [router])

  const handleKlusChange = useCallback((updatedKlus: Klus) => {
    setKlussen(prev => prev.map(k => k.id === updatedKlus.id ? updatedKlus : k))
  }, [])

  const totalen = berekenOfferteTotalen(klussen)

  const handleDoorgaan = () => {
    if (!offerte) return
    setIsSaving(true)

    const updatedOfferte: Offerte = {
      ...offerte,
      klussen,
      ...totalen,
    }

    sessionStorage.setItem('offerte', JSON.stringify(updatedOfferte))
    router.push('/finalize')
  }

  const handleTerug = () => {
    router.push('/')
  }

  if (!offerte) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#2D2D2D' }}>
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#00E8FF', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#2D2D2D' }}>
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <StepIndicator currentStep={3} />

        <div className="mt-8 space-y-6">
          {/* Title */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Offerte controleren
              </h1>
              <p style={{ color: '#9D9D9D' }} className="mt-1 text-sm">
                {offerte.maand} {offerte.jaar} &bull; {klussen.length} klussen
              </p>
            </div>
            <button
              onClick={handleTerug}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ color: '#9D9D9D', backgroundColor: '#3D3D3D' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Terug
            </button>
          </div>

          {/* Summary totals bar */}
          <div
            className="rounded-xl p-4 grid grid-cols-2 gap-4 md:grid-cols-4"
            style={{ backgroundColor: '#3D3D3D' }}
          >
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-xs">Arbeidskosten</p>
              <p className="text-white font-semibold text-lg">{formatCurrency(totalen.subtotaalArbeid)}</p>
            </div>
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-xs">Reiskosten km</p>
              <p className="text-white font-semibold text-lg">{formatCurrency(totalen.subtotaalReisKm)}</p>
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

          {/* Klussen list */}
          <div className="space-y-3">
            {klussen.map((klus, index) => (
              <KlusCard
                key={klus.id}
                klus={klus}
                onChange={handleKlusChange}
                index={index}
              />
            ))}
          </div>

          {/* Bottom summary + action */}
          <div
            className="rounded-xl p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky bottom-4"
            style={{
              backgroundColor: '#3D3D3D',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div>
              <p style={{ color: '#9D9D9D' }} className="text-sm">Maandtotaal</p>
              <p className="text-3xl font-bold" style={{ color: '#00E8FF' }}>
                {formatCurrency(totalen.totaalInclBTW)}
              </p>
              <p style={{ color: '#6D6D6D' }} className="text-xs mt-1">
                excl. BTW {formatCurrency(totalen.totaal)} &bull; BTW {formatCurrency(totalen.btw)}
              </p>
              <p style={{ color: '#6D6D6D' }} className="text-xs">
                {klussen.length} werkbonnen &bull; {formatNumber(klussen.reduce((s, k) => s + k.duur, 0), 2)} totaal uren
              </p>
            </div>

            <button
              onClick={handleDoorgaan}
              disabled={isSaving}
              className="flex items-center justify-center gap-3 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #0055FF, #00E8FF)',
                minWidth: '220px',
              }}
            >
              {isSaving ? (
                <>
                  <div
                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: '#fff', borderTopColor: 'transparent' }}
                  />
                  Even geduld...
                </>
              ) : (
                <>
                  Doorgaan naar offerte
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
