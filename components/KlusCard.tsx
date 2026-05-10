'use client'

import { useState, useEffect } from 'react'
import type { Klus } from '@/types'
import { formatCurrency, formatNumber } from '@/lib/calculations'

interface KlusCardProps {
  klus: Klus
  onChange: (updatedKlus: Klus) => void
  index: number
}

export default function KlusCard({ klus, onChange, index }: KlusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localKlus, setLocalKlus] = useState<Klus>(klus)

  useEffect(() => {
    setLocalKlus(klus)
  }, [klus])

  const handleChange = (field: keyof Klus, value: string | number) => {
    const updated = { ...localKlus, [field]: value }

    // Recalculate derived values
    if (field === 'duur' || field === 'uurtarief') {
      const duur = field === 'duur' ? Number(value) : updated.duur
      const uurtarief = field === 'uurtarief' ? Number(value) : updated.uurtarief
      updated.arbeidskosten = Math.round(duur * uurtarief * 100) / 100
    }

    if (field === 'afstandKm') {
      updated.reiskostenKm = Math.round(Number(value) * 0.50 * 100) / 100
    }

    if (field === 'reisUren') {
      updated.reiskostenUur = Math.round(Number(value) * 2 * 55 * 100) / 100
    }

    updated.totaal = Math.round(
      (updated.arbeidskosten + updated.reiskostenKm + updated.reiskostenUur) * 100
    ) / 100

    setLocalKlus(updated)
    onChange(updated)
  }

  const inputStyle = {
    backgroundColor: '#2D2D2D',
    borderColor: '#4D4D4D',
    color: '#ffffff',
  }

  const labelStyle = { color: '#9D9D9D' }

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-200"
      style={{ backgroundColor: '#3D3D3D', borderColor: '#4D4D4D' }}
    >
      {/* Card Header */}
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ backgroundColor: '#2D2D2D' }}
      >
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)', color: '#00E8FF' }}
        >
          #{String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{localKlus.projectNaam}</p>
          <p style={{ color: '#9D9D9D' }} className="text-xs">
            {localKlus.datum} &bull; {localKlus.dag} &bull; {formatNumber(localKlus.duur, 2)} uur
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-white font-semibold text-sm">{formatCurrency(localKlus.totaal)}</p>
          <p style={{ color: '#9D9D9D' }} className="text-xs">{localKlus.locatie}</p>
        </div>
        <svg
          className="w-4 h-4 transition-transform duration-200 flex-shrink-0"
          style={{ color: '#9D9D9D', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 py-4 space-y-4">
          {/* Werkzaamheden codes */}
          {localKlus.werkzaamhedenCodes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {localKlus.werkzaamhedenCodes.map(code => (
                <span
                  key={code}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(0, 85, 255, 0.2)', color: '#00E8FF' }}
                >
                  {code}
                </span>
              ))}
              {localKlus.werkbonNummer && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#9D9D9D' }}
                >
                  {localKlus.werkbonNummer}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Duur */}
            <div className="space-y-1">
              <label className="text-xs font-medium" style={labelStyle}>Uren</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={localKlus.duur}
                onChange={e => handleChange('duur', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1"
                style={{ ...inputStyle, '--tw-ring-color': '#00E8FF' } as React.CSSProperties}
              />
            </div>

            {/* Uurtarief */}
            <div className="space-y-1">
              <label className="text-xs font-medium" style={labelStyle}>Uurtarief (€)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={localKlus.uurtarief}
                onChange={e => handleChange('uurtarief', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1"
                style={inputStyle}
              />
            </div>

            {/* Afstand km */}
            <div className="space-y-1">
              <label className="text-xs font-medium" style={labelStyle}>Afstand (km v/v)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={localKlus.afstandKm}
                onChange={e => handleChange('afstandKm', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1"
                style={inputStyle}
              />
            </div>

            {/* Reisuren */}
            <div className="space-y-1">
              <label className="text-xs font-medium" style={labelStyle}>Reistijd (uur enkel)</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={localKlus.reisUren}
                onChange={e => handleChange('reisUren', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Berekening samenvatting */}
          <div
            className="rounded-lg p-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4"
            style={{ backgroundColor: '#2D2D2D' }}
          >
            <div>
              <p style={labelStyle} className="text-xs">Arbeidskosten</p>
              <p className="text-white font-medium">{formatCurrency(localKlus.arbeidskosten)}</p>
              <p style={{ color: '#6D6D6D' }} className="text-xs">{formatNumber(localKlus.duur)} u &times; {formatCurrency(localKlus.uurtarief)}</p>
            </div>
            <div>
              <p style={labelStyle} className="text-xs">Reiskosten (km)</p>
              <p className="text-white font-medium">{formatCurrency(localKlus.reiskostenKm)}</p>
              <p style={{ color: '#6D6D6D' }} className="text-xs">{formatNumber(localKlus.afstandKm)} km &times; €0,50</p>
            </div>
            <div>
              <p style={labelStyle} className="text-xs">Reiskosten (uur)</p>
              <p className="text-white font-medium">{formatCurrency(localKlus.reiskostenUur)}</p>
              <p style={{ color: '#6D6D6D' }} className="text-xs">{formatNumber(localKlus.reisUren * 2)} u &times; €55,00</p>
            </div>
            <div>
              <p style={labelStyle} className="text-xs">Totaal</p>
              <p className="font-bold text-base" style={{ color: '#00E8FF' }}>{formatCurrency(localKlus.totaal)}</p>
            </div>
          </div>

          {/* Locatie */}
          <div className="space-y-1">
            <label className="text-xs font-medium" style={labelStyle}>Locatie / Bestemming</label>
            <input
              type="text"
              value={localKlus.locatie}
              onChange={e => handleChange('locatie', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
              style={inputStyle}
            />
          </div>
        </div>
      )}
    </div>
  )
}
