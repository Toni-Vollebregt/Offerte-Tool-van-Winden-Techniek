'use client'

import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import type { Offerte, Factuur, Tarief, Medewerker } from '@/types'
import { formatCurrency } from '@/lib/calculations'

type OfferteSaved = {
  id: string
  maand: string
  jaar: number
  totaal: number
  data: Offerte
  aangemaakt: string
}

type FactuurSaved = {
  id: string
  maand: string
  jaar: number
  totaal: number
  data: Factuur
  aangemaakt: string
}

type ReisInstellingen = {
  km_tarief: string
  reis_uur_tarief: string
  filemarge: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

const inputStyle = {
  backgroundColor: '#2D2D2D',
  borderColor: '#4D4D4D',
  color: '#ffffff',
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<'tarieven' | 'medewerkers' | 'offertes' | 'facturen'>('tarieven')

  // Tarieven state
  const [tarieven, setTarieven] = useState<Tarief[]>([])
  const [isLoadingTarieven, setIsLoadingTarieven] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ omschrijving: string; uurtarief: number }>({ omschrijving: '', uurtarief: 0 })
  const [newTarief, setNewTarief] = useState({ omschrijving: '', uurtarief: 60 })
  const [tarievenError, setTarievenError] = useState('')
  const [tarievenSuccess, setTarievenSuccess] = useState('')

  // Reisinstellingen state
  const [reisInstellingen, setReisInstellingen] = useState<ReisInstellingen>({ km_tarief: '0.50', reis_uur_tarief: '55', filemarge: '1.15' })
  const [isLoadingReis, setIsLoadingReis] = useState(false)
  const [savingReisKey, setSavingReisKey] = useState<string | null>(null)
  const [reisError, setReisError] = useState('')
  const [reisSuccess, setReisSuccess] = useState('')

  // Offertes state
  const [offertes, setOffertes] = useState<OfferteSaved[]>([])
  const [isLoadingOffertes, setIsLoadingOffertes] = useState(false)
  const [offertesLoaded, setOffertesLoaded] = useState(false)
  const [offertesError, setOffertesError] = useState('')
  const [downloadingOfferte, setDownloadingOfferte] = useState<string | null>(null)

  // Facturen state
  const [facturen, setFacturen] = useState<FactuurSaved[]>([])
  const [isLoadingFacturen, setIsLoadingFacturen] = useState(false)
  const [facturenLoaded, setFacturenLoaded] = useState(false)
  const [facturenError, setFacturenError] = useState('')
  const [downloadingFactuur, setDownloadingFactuur] = useState<string | null>(null)
  const [downloadingBijlage, setDownloadingBijlage] = useState<string | null>(null)

  // Medewerkers state
  const [medewerkers, setMedewerkers] = useState<Medewerker[]>([])
  const [isLoadingMedewerkers, setIsLoadingMedewerkers] = useState(false)
  const [medewerkersLoaded, setMedewerkersLoaded] = useState(false)
  const [medewerkersError, setMedewerkersError] = useState('')
  const [editingMedewerkerId, setEditingMedewerkerId] = useState<string | null>(null)
  const [editMedewerkerValues, setEditMedewerkerValues] = useState({ naam: '', km_tarief: 0.50, reis_uur_tarief: 55, filemarge: 1.15 })
  const [newMedewerker, setNewMedewerker] = useState({ naam: '', km_tarief: 0.50, reis_uur_tarief: 55, filemarge: 1.15 })
  const [savingMedewerkerId, setSavingMedewerkerId] = useState<string | null>(null)

  const fetchTarieven = async () => {
    setIsLoadingTarieven(true)
    try {
      const response = await fetch('/api/tarieven')
      const data = await response.json()
      setTarieven(data)
    } catch {
      setTarievenError('Fout bij ophalen tarieven.')
    } finally {
      setIsLoadingTarieven(false)
    }
  }

  const fetchReisInstellingen = async () => {
    setIsLoadingReis(true)
    try {
      const response = await fetch('/api/instellingen')
      const data = await response.json()
      setReisInstellingen(prev => ({ ...prev, ...data }))
    } catch {
      // gebruik defaults
    } finally {
      setIsLoadingReis(false)
    }
  }

  const fetchOffertes = async () => {
    setIsLoadingOffertes(true)
    setOffertesError('')
    try {
      const response = await fetch('/api/offertes')
      if (!response.ok) { setOffertesError('Ophalen mislukt.'); return }
      const data = await response.json()
      setOffertes(Array.isArray(data) ? data : [])
      setOffertesLoaded(true)
    } catch {
      setOffertesError('Verbindingsfout — probeer opnieuw.')
    } finally {
      setIsLoadingOffertes(false)
    }
  }

  const fetchFacturen = async () => {
    setIsLoadingFacturen(true)
    setFacturenError('')
    try {
      const response = await fetch('/api/facturen')
      if (!response.ok) { setFacturenError('Ophalen mislukt.'); return }
      const data = await response.json()
      setFacturen(Array.isArray(data) ? data : [])
      setFacturenLoaded(true)
    } catch {
      setFacturenError('Verbindingsfout — probeer opnieuw.')
    } finally {
      setIsLoadingFacturen(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchTarieven()
      fetchReisInstellingen()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (activeTab === 'offertes' && isAuthenticated && !offertesLoaded) fetchOffertes()
    if (activeTab === 'facturen' && isAuthenticated && !facturenLoaded) fetchFacturen()
    if (activeTab === 'medewerkers' && isAuthenticated && !medewerkersLoaded) fetchMedewerkers()
  }, [activeTab, isAuthenticated, offertesLoaded, facturenLoaded, medewerkersLoaded])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
    if (password === adminPass) { setIsAuthenticated(true); setAuthError('') }
    else setAuthError('Ongeldig wachtwoord')
  }

  const handleEdit = (tarief: Tarief) => {
    setEditingId(tarief.id)
    setEditValues({ omschrijving: tarief.omschrijving, uurtarief: tarief.uurtarief })
  }

  const handleSaveEdit = async (id: string) => {
    setTarievenError('')
    try {
      const response = await fetch('/api/tarieven', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editValues }),
      })
      if (response.ok) {
        setTarieven(prev => prev.map(t => t.id === id ? { ...t, ...editValues } : t))
        setEditingId(null)
        setTarievenSuccess('Tarief bijgewerkt')
        setTimeout(() => setTarievenSuccess(''), 3000)
      } else {
        const err = await response.json()
        setTarievenError(err.error ?? 'Opslaan mislukt.')
      }
    } catch {
      setTarievenError('Verbindingsfout — probeer opnieuw.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tarief verwijderen?')) return
    setTarievenError('')
    try {
      const response = await fetch(`/api/tarieven?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        setTarieven(prev => prev.filter(t => t.id !== id))
        setTarievenSuccess('Tarief verwijderd')
        setTimeout(() => setTarievenSuccess(''), 3000)
      } else {
        const err = await response.json()
        setTarievenError(err.error ?? 'Verwijderen mislukt.')
      }
    } catch {
      setTarievenError('Verbindingsfout — probeer opnieuw.')
    }
  }

  const handleAddTarief = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTarief.omschrijving.trim()) return
    setTarievenError('')
    try {
      const response = await fetch('/api/tarieven', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTarief),
      })
      if (response.ok) {
        await fetchTarieven()
        setNewTarief({ omschrijving: '', uurtarief: 60 })
        setTarievenSuccess('Tarief toegevoegd')
        setTimeout(() => setTarievenSuccess(''), 3000)
      } else {
        const err = await response.json()
        setTarievenError(err.error ?? 'Toevoegen mislukt.')
      }
    } catch {
      setTarievenError('Verbindingsfout — probeer opnieuw.')
    }
  }

  const handleSaveReis = async (key: string, value: string) => {
    setSavingReisKey(key)
    setReisError('')
    try {
      const response = await fetch('/api/instellingen', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      if (response.ok) {
        setReisSuccess('Opgeslagen')
        setTimeout(() => setReisSuccess(''), 2000)
      } else {
        const err = await response.json()
        setReisError(err.error ?? 'Opslaan mislukt.')
      }
    } catch {
      setReisError('Verbindingsfout — probeer opnieuw.')
    } finally {
      setSavingReisKey(null)
    }
  }

  const handleDownloadOfferte = async (row: OfferteSaved) => {
    setDownloadingOfferte(row.id)
    setOffertesError('')
    try {
      const [rendererMod, docMod] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/OfferteDocument'),
      ])
      const { pdf } = rendererMod
      const OfferteDoc = docMod.default
      const logoUrl = `${window.location.origin}/vanwinden_techniek_logo_transparant.png`
      const element = React.createElement(OfferteDoc, { offerte: row.data, logoUrl })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await (pdf as any)(element).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Offerte_VanWindenTechniek_${row.maand}_${row.jaar}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      setOffertesError('PDF genereren mislukt.')
    } finally {
      setDownloadingOfferte(null)
    }
  }

  const handleDeleteOfferte = async (id: string) => {
    if (!confirm('Offerte verwijderen?')) return
    setOffertesError('')
    try {
      const response = await fetch(`/api/offertes?id=${id}`, { method: 'DELETE' })
      if (response.ok) setOffertes(prev => prev.filter(o => o.id !== id))
      else { const err = await response.json(); setOffertesError(err.error ?? 'Verwijderen mislukt.') }
    } catch {
      setOffertesError('Verbindingsfout — probeer opnieuw.')
    }
  }

  const handleDownloadFactuurPdf = async (row: FactuurSaved, type: 'factuur' | 'bijlage') => {
    if (type === 'factuur') setDownloadingFactuur(row.id)
    else setDownloadingBijlage(row.id)
    setFacturenError('')
    try {
      const factuurNummer = row.data.factuurNummer ?? `FACT-${row.data.jaar}-W${String(row.data.weekNummer).padStart(2, '0')}-${row.id.slice(-4)}`
      const logoUrl = `${window.location.origin}/vanwinden_techniek_logo_transparant.png`
      const { pdf } = await import('@react-pdf/renderer')
      let element: React.ReactElement
      let fileName: string
      if (type === 'factuur') {
        const { default: FactuurDoc } = await import('@/components/FactuurDocument')
        element = React.createElement(FactuurDoc, { factuur: row.data, logoUrl })
        fileName = `Factuur_VanWindenTechniek_Week${row.data.weekNummer}_${row.data.jaar}.pdf`
      } else {
        const { default: BijlageDoc } = await import('@/components/BijlageDocument')
        element = React.createElement(BijlageDoc, { factuur: row.data, factuurNummer, logoUrl })
        fileName = `Bijlage_VanWindenTechniek_Week${row.data.weekNummer}_${row.data.jaar}.pdf`
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await (pdf as any)(element).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      setFacturenError('PDF genereren mislukt.')
    } finally {
      setDownloadingFactuur(null)
      setDownloadingBijlage(null)
    }
  }

  const handleDeleteFactuur = async (id: string) => {
    if (!confirm('Factuur verwijderen?')) return
    setFacturenError('')
    try {
      const response = await fetch(`/api/facturen?id=${id}`, { method: 'DELETE' })
      if (response.ok) setFacturen(prev => prev.filter(f => f.id !== id))
      else { const err = await response.json(); setFacturenError(err.error ?? 'Verwijderen mislukt.') }
    } catch {
      setFacturenError('Verbindingsfout — probeer opnieuw.')
    }
  }

  const fetchMedewerkers = async () => {
    setIsLoadingMedewerkers(true)
    setMedewerkersError('')
    try {
      const response = await fetch('/api/medewerkers')
      if (!response.ok) { setMedewerkersError('Ophalen mislukt.'); return }
      const data = await response.json()
      setMedewerkers(Array.isArray(data) ? data : [])
      setMedewerkersLoaded(true)
    } catch {
      setMedewerkersError('Verbindingsfout — probeer opnieuw.')
    } finally {
      setIsLoadingMedewerkers(false)
    }
  }

  const handleEditMedewerker = (m: Medewerker) => {
    setEditingMedewerkerId(m.id)
    setEditMedewerkerValues({ naam: m.naam, km_tarief: m.km_tarief, reis_uur_tarief: m.reis_uur_tarief, filemarge: m.filemarge })
  }

  const handleSaveMedewerker = async (id: string) => {
    setSavingMedewerkerId(id)
    setMedewerkersError('')
    try {
      const response = await fetch('/api/medewerkers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editMedewerkerValues }),
      })
      if (response.ok) {
        const updated = await response.json()
        setMedewerkers(prev => prev.map(m => m.id === id ? updated : m))
        setEditingMedewerkerId(null)
      } else {
        const err = await response.json()
        setMedewerkersError(err.error ?? 'Opslaan mislukt.')
      }
    } catch {
      setMedewerkersError('Verbindingsfout — probeer opnieuw.')
    } finally {
      setSavingMedewerkerId(null)
    }
  }

  const handleToggleMedewerker = async (id: string, actief: boolean) => {
    setMedewerkersError('')
    try {
      const response = await fetch('/api/medewerkers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, actief }),
      })
      if (response.ok) {
        setMedewerkers(prev => prev.map(m => m.id === id ? { ...m, actief } : m))
      } else {
        const err = await response.json()
        setMedewerkersError(err.error ?? 'Bijwerken mislukt.')
      }
    } catch {
      setMedewerkersError('Verbindingsfout — probeer opnieuw.')
    }
  }

  const handleAddMedewerker = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMedewerker.naam.trim()) return
    setMedewerkersError('')
    try {
      const response = await fetch('/api/medewerkers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedewerker),
      })
      if (response.ok) {
        const created = await response.json()
        setMedewerkers(prev => [...prev, created].sort((a, b) => a.naam.localeCompare(b.naam)))
        setNewMedewerker({ naam: '', km_tarief: 0.50, reis_uur_tarief: 55, filemarge: 1.15 })
      } else {
        const err = await response.json()
        setMedewerkersError(err.error ?? 'Aanmaken mislukt.')
      }
    } catch {
      setMedewerkersError('Verbindingsfout — probeer opnieuw.')
    }
  }

  const handleDeleteMedewerker = async (id: string) => {
    if (!confirm('Medewerker verwijderen?')) return
    setMedewerkersError('')
    try {
      const response = await fetch(`/api/medewerkers?id=${id}`, { method: 'DELETE' })
      if (response.ok) setMedewerkers(prev => prev.filter(m => m.id !== id))
      else { const err = await response.json(); setMedewerkersError(err.error ?? 'Verwijderen mislukt.') }
    } catch {
      setMedewerkersError('Verbindingsfout — probeer opnieuw.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#2D2D2D' }}>
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl p-8 space-y-6" style={{ backgroundColor: '#3D3D3D' }}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)' }}>
                <svg className="w-6 h-6" style={{ color: '#00E8FF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Beheerportal</h1>
              <p style={{ color: '#9D9D9D' }} className="text-sm mt-1">Van Winden Techniek</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: '#9D9D9D' }}>Wachtwoord</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Voer wachtwoord in"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none"
                  style={inputStyle}
                  autoFocus
                />
              </div>
              {authError && <p className="text-xs" style={{ color: '#FF4444' }}>{authError}</p>}
              <button type="submit" className="w-full py-2.5 rounded-lg font-medium text-sm text-white transition-all duration-200" style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)' }}>
                Inloggen
              </button>
            </form>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#2D2D2D' }}>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Beheerportal</h1>
            <p style={{ color: '#9D9D9D' }} className="text-sm mt-1">Van Winden Techniek</p>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="text-xs px-3 py-1.5 rounded-lg transition-colors" style={{ color: '#9D9D9D', backgroundColor: '#3D3D3D' }}>
            Uitloggen
          </button>
        </div>

        {/* Tab navigatie */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ backgroundColor: '#3D3D3D' }}>
          {(['tarieven', 'medewerkers', 'offertes', 'facturen'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={activeTab === tab ? { backgroundColor: '#2D2D2D', color: '#ffffff' } : { color: '#9D9D9D' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tarieven tab ── */}
        {activeTab === 'tarieven' && (
          <>
            {tarievenError && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#FF4444' }}>
                {tarievenError}
              </div>
            )}
            {tarievenSuccess && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)', color: '#00E8FF' }}>
                {tarievenSuccess}
              </div>
            )}

            {/* Arbeidskosten tarieven tabel */}
            <div className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: '#3D3D3D' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: '#4D4D4D' }}>
                <h2 className="text-white font-semibold">Arbeidskosten tarieven</h2>
                <p style={{ color: '#9D9D9D' }} className="text-xs mt-0.5">
                  {tarieven.length} tarieven · Gekoppeld aan werkzaamheden omschrijving uit PDF
                </p>
              </div>

              {isLoadingTarieven ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00E8FF', borderTopColor: 'transparent' }} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#2D2D2D' }}>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#9D9D9D' }}>Omschrijving</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Uurtarief</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Acties</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tarieven.map(tarief => (
                        <tr key={tarief.id} className="border-t" style={{ borderColor: '#4D4D4D' }}>
                          <td className="px-4 py-3">
                            {editingId === tarief.id ? (
                              <input
                                type="text"
                                value={editValues.omschrijving}
                                onChange={e => setEditValues(prev => ({ ...prev, omschrijving: e.target.value }))}
                                className="w-full px-2 py-1 rounded border text-sm"
                                style={inputStyle}
                              />
                            ) : (
                              <span className="text-white">{tarief.omschrijving}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editingId === tarief.id ? (
                              <input
                                type="number"
                                step="0.50"
                                value={editValues.uurtarief}
                                onChange={e => setEditValues(prev => ({ ...prev, uurtarief: parseFloat(e.target.value) || 0 }))}
                                className="w-24 px-2 py-1 rounded border text-sm text-right"
                                style={inputStyle}
                              />
                            ) : (
                              <span className="text-white font-medium">{formatCurrency(tarief.uurtarief)}/u</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {editingId === tarief.id ? (
                                <>
                                  <button onClick={() => handleSaveEdit(tarief.id)} className="text-xs px-3 py-1 rounded transition-colors" style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)', color: '#00E8FF' }}>Opslaan</button>
                                  <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1 rounded transition-colors" style={{ color: '#9D9D9D', backgroundColor: '#2D2D2D' }}>Annuleren</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleEdit(tarief)} className="text-xs px-3 py-1 rounded transition-colors" style={{ color: '#9D9D9D', backgroundColor: '#2D2D2D' }}>Bewerken</button>
                                  <button onClick={() => handleDelete(tarief.id)} className="text-xs px-3 py-1 rounded transition-colors" style={{ color: '#FF4444', backgroundColor: 'rgba(255, 68, 68, 0.1)' }}>Verwijder</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Nieuw tarief */}
            <div className="rounded-xl p-5 mb-8" style={{ backgroundColor: '#3D3D3D' }}>
              <h2 className="text-white font-semibold mb-4">Nieuw tarief toevoegen</h2>
              <form onSubmit={handleAddTarief} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-1 md:col-span-3">
                  <label className="text-xs font-medium" style={{ color: '#9D9D9D' }}>Omschrijving *</label>
                  <input
                    type="text"
                    value={newTarief.omschrijving}
                    onChange={e => setNewTarief(prev => ({ ...prev, omschrijving: e.target.value }))}
                    placeholder="bijv. Onderhoud Roldeuren"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={inputStyle}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: '#9D9D9D' }}>Uurtarief (€)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={newTarief.uurtarief}
                    onChange={e => setNewTarief(prev => ({ ...prev, uurtarief: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={inputStyle}
                  />
                </div>
                <div className="md:col-span-4">
                  <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-sm text-white transition-all duration-200" style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)' }}>
                    Tarief toevoegen
                  </button>
                </div>
              </form>
            </div>

            {/* Reiskosten instellingen */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#3D3D3D' }}>
              <h2 className="text-white font-semibold mb-1">Reiskosten tarieven</h2>
              <p style={{ color: '#9D9D9D' }} className="text-xs mb-4">Deze tarieven worden gebruikt bij alle berekeningen — altijd leidend.</p>

              {reisError && <div className="mb-3 px-3 py-2 rounded text-xs" style={{ backgroundColor: 'rgba(255,68,68,0.1)', color: '#FF4444' }}>{reisError}</div>}
              {reisSuccess && <div className="mb-3 px-3 py-2 rounded text-xs" style={{ backgroundColor: 'rgba(0,232,255,0.1)', color: '#00E8FF' }}>{reisSuccess}</div>}

              {isLoadingReis ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00E8FF', borderTopColor: 'transparent' }} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[
                    { key: 'km_tarief', label: 'Kilometervergoeding (€/km)', step: '0.01', placeholder: '0.50' },
                    { key: 'reis_uur_tarief', label: 'Reistijd tarief (€/uur)', step: '0.50', placeholder: '55' },
                    { key: 'filemarge', label: 'Filemarge (factor)', step: '0.01', placeholder: '1.15' },
                  ].map(({ key, label, step, placeholder }) => (
                    <div key={key} className="space-y-2">
                      <label className="text-xs font-medium" style={{ color: '#9D9D9D' }}>{label}</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step={step}
                          min="0"
                          value={reisInstellingen[key as keyof ReisInstellingen]}
                          onChange={e => setReisInstellingen(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="flex-1 px-3 py-2 rounded-lg border text-sm"
                          style={inputStyle}
                        />
                        <button
                          onClick={() => handleSaveReis(key, reisInstellingen[key as keyof ReisInstellingen])}
                          disabled={savingReisKey === key}
                          className="px-3 py-2 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50"
                          style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)', color: '#00E8FF' }}
                        >
                          {savingReisKey === key ? '...' : 'Sla op'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Medewerkers tab ── */}
        {activeTab === 'medewerkers' && (
          <>
            {medewerkersError && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#FF4444' }}>
                {medewerkersError}
              </div>
            )}

            <div className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: '#3D3D3D' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#4D4D4D' }}>
                <div>
                  <h2 className="text-white font-semibold">Medewerkers</h2>
                  <p style={{ color: '#9D9D9D' }} className="text-xs mt-0.5">
                    Reiskosten worden per medewerker ingesteld en zijn leidend bij berekeningen
                  </p>
                </div>
                <button onClick={() => { setMedewerkersLoaded(false) }} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#9D9D9D', backgroundColor: '#2D2D2D' }}>Vernieuwen</button>
              </div>

              {isLoadingMedewerkers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00E8FF', borderTopColor: 'transparent' }} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#2D2D2D' }}>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#9D9D9D' }}>Naam</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>€/km</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>€/uur reis</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Filemarge</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: '#9D9D9D' }}>Actief</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Acties</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medewerkers.map(m => (
                        <tr key={m.id} className="border-t" style={{ borderColor: '#4D4D4D', opacity: m.actief ? 1 : 0.5 }}>
                          <td className="px-4 py-3">
                            {editingMedewerkerId === m.id ? (
                              <input
                                type="text"
                                value={editMedewerkerValues.naam}
                                onChange={e => setEditMedewerkerValues(prev => ({ ...prev, naam: e.target.value }))}
                                className="w-full px-2 py-1 rounded border text-sm"
                                style={inputStyle}
                              />
                            ) : (
                              <span className="text-white font-medium">{m.naam}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editingMedewerkerId === m.id ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editMedewerkerValues.km_tarief}
                                onChange={e => setEditMedewerkerValues(prev => ({ ...prev, km_tarief: parseFloat(e.target.value) || 0 }))}
                                className="w-20 px-2 py-1 rounded border text-sm text-right"
                                style={inputStyle}
                              />
                            ) : (
                              <span style={{ color: '#9D9D9D' }}>€ {m.km_tarief.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editingMedewerkerId === m.id ? (
                              <input
                                type="number"
                                step="0.50"
                                min="0"
                                value={editMedewerkerValues.reis_uur_tarief}
                                onChange={e => setEditMedewerkerValues(prev => ({ ...prev, reis_uur_tarief: parseFloat(e.target.value) || 0 }))}
                                className="w-20 px-2 py-1 rounded border text-sm text-right"
                                style={inputStyle}
                              />
                            ) : (
                              <span style={{ color: '#9D9D9D' }}>€ {m.reis_uur_tarief.toFixed(0)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editingMedewerkerId === m.id ? (
                              <input
                                type="number"
                                step="0.01"
                                min="1"
                                value={editMedewerkerValues.filemarge}
                                onChange={e => setEditMedewerkerValues(prev => ({ ...prev, filemarge: parseFloat(e.target.value) || 1 }))}
                                className="w-20 px-2 py-1 rounded border text-sm text-right"
                                style={inputStyle}
                              />
                            ) : (
                              <span style={{ color: '#9D9D9D' }}>{m.filemarge.toFixed(2)}×</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleMedewerker(m.id, !m.actief)}
                              className="w-8 h-5 rounded-full transition-colors relative inline-flex"
                              style={{ backgroundColor: m.actief ? '#00E8FF' : '#4D4D4D' }}
                            >
                              <span
                                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                                style={{ transform: m.actief ? 'translateX(14px)' : 'translateX(2px)' }}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {editingMedewerkerId === m.id ? (
                                <>
                                  <button
                                    onClick={() => handleSaveMedewerker(m.id)}
                                    disabled={savingMedewerkerId === m.id}
                                    className="text-xs px-3 py-1 rounded transition-colors disabled:opacity-50"
                                    style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)', color: '#00E8FF' }}
                                  >
                                    {savingMedewerkerId === m.id ? '...' : 'Opslaan'}
                                  </button>
                                  <button onClick={() => setEditingMedewerkerId(null)} className="text-xs px-3 py-1 rounded" style={{ color: '#9D9D9D', backgroundColor: '#2D2D2D' }}>Annuleren</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleEditMedewerker(m)} className="text-xs px-3 py-1 rounded" style={{ color: '#9D9D9D', backgroundColor: '#2D2D2D' }}>Bewerken</button>
                                  <button onClick={() => handleDeleteMedewerker(m.id)} className="text-xs px-3 py-1 rounded" style={{ color: '#FF4444', backgroundColor: 'rgba(255, 68, 68, 0.1)' }}>Verwijder</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {medewerkers.length === 0 && (
                        <tr><td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: '#9D9D9D' }}>Geen medewerkers gevonden</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Nieuwe medewerker */}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#3D3D3D' }}>
              <h2 className="text-white font-semibold mb-4">Nieuwe medewerker toevoegen</h2>
              <form onSubmit={handleAddMedewerker} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-1 md:col-span-4 md:col-span-1" style={{ gridColumn: 'span 1 / span 1' }}>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:col-span-4" style={{ gridColumn: '1 / -1' }}>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium" style={{ color: '#9D9D9D' }}>Naam *</label>
                    <input
                      type="text"
                      value={newMedewerker.naam}
                      onChange={e => setNewMedewerker(prev => ({ ...prev, naam: e.target.value }))}
                      placeholder="Volledige naam"
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: '#9D9D9D' }}>€/km</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newMedewerker.km_tarief}
                      onChange={e => setNewMedewerker(prev => ({ ...prev, km_tarief: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={inputStyle}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: '#9D9D9D' }}>€/uur reistijd</label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={newMedewerker.reis_uur_tarief}
                      onChange={e => setNewMedewerker(prev => ({ ...prev, reis_uur_tarief: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={inputStyle}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: '#9D9D9D' }}>Filemarge</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={newMedewerker.filemarge}
                      onChange={e => setNewMedewerker(prev => ({ ...prev, filemarge: parseFloat(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={inputStyle}
                    />
                  </div>
                  <div className="md:col-span-4">
                    <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-sm text-white" style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)' }}>
                      Medewerker toevoegen
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}

        {/* ── Offertes tab ── */}
        {activeTab === 'offertes' && (
          <>
            {offertesError && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#FF4444' }}>{offertesError}</div>}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#3D3D3D' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#4D4D4D' }}>
                <div>
                  <h2 className="text-white font-semibold">Opgeslagen offertes</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#9D9D9D' }}>{offertes.length} offerte{offertes.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setOffertesLoaded(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#9D9D9D', backgroundColor: '#2D2D2D' }}>Vernieuwen</button>
              </div>

              {isLoadingOffertes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00E8FF', borderTopColor: 'transparent' }} />
                </div>
              ) : offertes.length === 0 ? (
                <div className="px-5 py-12 text-center"><p className="text-sm" style={{ color: '#9D9D9D' }}>Geen opgeslagen offertes</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#2D2D2D' }}>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#9D9D9D' }}>Periode</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Klussen</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Excl. BTW</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Incl. BTW</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Aangemaakt</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Acties</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offertes.map(row => (
                        <tr key={row.id} className="border-t" style={{ borderColor: '#4D4D4D' }}>
                          <td className="px-4 py-3"><span className="text-white font-medium capitalize">{row.maand} {row.jaar}</span></td>
                          <td className="px-4 py-3 text-right"><span style={{ color: '#9D9D9D' }}>{row.data?.klussen?.length ?? '—'}</span></td>
                          <td className="px-4 py-3 text-right"><span className="text-white">{formatCurrency(row.data?.totaal ?? row.totaal)}</span></td>
                          <td className="px-4 py-3 text-right"><span className="font-semibold" style={{ color: '#00E8FF' }}>{formatCurrency(row.data?.totaalInclBTW ?? row.totaal * 1.21)}</span></td>
                          <td className="px-4 py-3 text-right"><span className="text-xs" style={{ color: '#9D9D9D' }}>{formatDate(row.aangemaakt)}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDownloadOfferte(row)}
                                disabled={downloadingOfferte === row.id}
                                className="text-xs px-3 py-1.5 rounded transition-all disabled:opacity-50 flex items-center gap-1.5"
                                style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)', color: '#ffffff' }}
                              >
                                {downloadingOfferte === row.id ? (<><div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />Genereren...</>) : 'Download PDF'}
                              </button>
                              <button onClick={() => handleDeleteOfferte(row.id)} className="text-xs px-3 py-1.5 rounded" style={{ color: '#FF4444', backgroundColor: 'rgba(255, 68, 68, 0.1)' }}>Verwijder</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Facturen tab ── */}
        {activeTab === 'facturen' && (
          <>
            {facturenError && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#FF4444' }}>{facturenError}</div>}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#3D3D3D' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#4D4D4D' }}>
                <div>
                  <h2 className="text-white font-semibold">Opgeslagen facturen</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#9D9D9D' }}>{facturen.length} factuur/facturen</p>
                </div>
                <button onClick={() => setFacturenLoaded(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#9D9D9D', backgroundColor: '#2D2D2D' }}>Vernieuwen</button>
              </div>

              {isLoadingFacturen ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00E8FF', borderTopColor: 'transparent' }} />
                </div>
              ) : facturen.length === 0 ? (
                <div className="px-5 py-12 text-center"><p className="text-sm" style={{ color: '#9D9D9D' }}>Geen opgeslagen facturen</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#2D2D2D' }}>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#9D9D9D' }}>Periode</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Werkbonnen</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Excl. BTW</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Incl. BTW</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Aangemaakt</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Acties</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturen.map(row => (
                        <tr key={row.id} className="border-t" style={{ borderColor: '#4D4D4D' }}>
                          <td className="px-4 py-3">
                            <span className="text-white font-medium">Week {row.data?.weekNummer ?? row.maand} {row.data?.jaar ?? row.jaar}</span>
                          </td>
                          <td className="px-4 py-3 text-right"><span style={{ color: '#9D9D9D' }}>{row.data?.klussen?.length ?? '—'}</span></td>
                          <td className="px-4 py-3 text-right"><span className="text-white">{formatCurrency(row.data?.totaal ?? row.totaal)}</span></td>
                          <td className="px-4 py-3 text-right"><span className="font-semibold" style={{ color: '#00E8FF' }}>{formatCurrency(row.data?.totaalInclBTW ?? row.totaal * 1.21)}</span></td>
                          <td className="px-4 py-3 text-right"><span className="text-xs" style={{ color: '#9D9D9D' }}>{formatDate(row.aangemaakt)}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDownloadFactuurPdf(row, 'factuur')}
                                disabled={downloadingFactuur === row.id}
                                className="text-xs px-3 py-1.5 rounded disabled:opacity-50 flex items-center gap-1"
                                style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)', color: '#fff' }}
                              >
                                {downloadingFactuur === row.id ? (<div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />) : null}
                                Factuur
                              </button>
                              <button
                                onClick={() => handleDownloadFactuurPdf(row, 'bijlage')}
                                disabled={downloadingBijlage === row.id}
                                className="text-xs px-3 py-1.5 rounded disabled:opacity-50 flex items-center gap-1"
                                style={{ backgroundColor: '#4D4D4D', color: '#fff' }}
                              >
                                {downloadingBijlage === row.id ? (<div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />) : null}
                                Bijlage
                              </button>
                              <button onClick={() => handleDeleteFactuur(row.id)} className="text-xs px-3 py-1.5 rounded" style={{ color: '#FF4444', backgroundColor: 'rgba(255, 68, 68, 0.1)' }}>Verwijder</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
