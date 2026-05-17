'use client'

import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import type { Offerte, Tarief } from '@/types'
import { formatCurrency } from '@/lib/calculations'

type OfferteSaved = {
  id: string
  maand: string
  jaar: number
  totaal: number
  data: Offerte
  aangemaakt: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<'tarieven' | 'offertes'>('tarieven')

  // Tarieven state
  const [tarieven, setTarieven] = useState<Tarief[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ omschrijving: string; uurtarief: number }>({
    omschrijving: '',
    uurtarief: 0,
  })
  const [newTarief, setNewTarief] = useState({ code: '', omschrijving: '', uurtarief: 60 })
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  // Offertes state
  const [offertes, setOffertes] = useState<OfferteSaved[]>([])
  const [isLoadingOffertes, setIsLoadingOffertes] = useState(false)
  const [offertesLoaded, setOffertesLoaded] = useState(false)
  const [offertesError, setOffertesError] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const fetchTarieven = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tarieven')
      const data = await response.json()
      setTarieven(data)
    } catch {
      setSaveError('Fout bij ophalen tarieven.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOffertes = async () => {
    setIsLoadingOffertes(true)
    setOffertesError('')
    try {
      const response = await fetch('/api/offertes')
      if (!response.ok) {
        setOffertesError('Ophalen offertes mislukt.')
        return
      }
      const data = await response.json()
      setOffertes(Array.isArray(data) ? data : [])
      setOffertesLoaded(true)
    } catch {
      setOffertesError('Verbindingsfout — probeer opnieuw.')
    } finally {
      setIsLoadingOffertes(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchTarieven()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (activeTab === 'offertes' && isAuthenticated && !offertesLoaded) {
      fetchOffertes()
    }
  }, [activeTab, isAuthenticated, offertesLoaded])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
    if (password === adminPass) {
      setIsAuthenticated(true)
      setAuthError('')
    } else {
      setAuthError('Ongeldig wachtwoord')
    }
  }

  const handleEdit = (tarief: Tarief) => {
    setEditingId(tarief.id)
    setEditValues({ omschrijving: tarief.omschrijving, uurtarief: tarief.uurtarief })
  }

  const handleSaveEdit = async (id: string) => {
    setSaveError('')
    try {
      const response = await fetch('/api/tarieven', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editValues }),
      })

      if (response.ok) {
        setTarieven(prev => prev.map(t => t.id === id ? { ...t, ...editValues } : t))
        setEditingId(null)
        setSaveSuccess('Tarief bijgewerkt')
        setTimeout(() => setSaveSuccess(''), 3000)
      } else {
        const err = await response.json()
        setSaveError(err.error ?? 'Opslaan mislukt.')
      }
    } catch {
      setSaveError('Verbindingsfout — probeer opnieuw.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tarief verwijderen?')) return
    setSaveError('')
    try {
      const response = await fetch(`/api/tarieven?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        setTarieven(prev => prev.filter(t => t.id !== id))
        setSaveSuccess('Tarief verwijderd')
        setTimeout(() => setSaveSuccess(''), 3000)
      } else {
        const err = await response.json()
        setSaveError(err.error ?? 'Verwijderen mislukt.')
      }
    } catch {
      setSaveError('Verbindingsfout — probeer opnieuw.')
    }
  }

  const handleAddTarief = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTarief.code.trim()) return
    setSaveError('')
    try {
      const response = await fetch('/api/tarieven', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTarief),
      })

      if (response.ok) {
        await fetchTarieven()
        setNewTarief({ code: '', omschrijving: '', uurtarief: 60 })
        setSaveSuccess('Tarief toegevoegd')
        setTimeout(() => setSaveSuccess(''), 3000)
      } else {
        const err = await response.json()
        setSaveError(err.error ?? 'Toevoegen mislukt.')
      }
    } catch {
      setSaveError('Verbindingsfout — probeer opnieuw.')
    }
  }

  const handleDownloadPdf = async (row: OfferteSaved) => {
    setDownloadingId(row.id)
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
    } catch (e) {
      console.error('PDF genereren error:', e)
      setOffertesError('PDF genereren mislukt.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDeleteOfferte = async (id: string) => {
    if (!confirm('Offerte verwijderen?')) return
    setOffertesError('')
    try {
      const response = await fetch(`/api/offertes?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        setOffertes(prev => prev.filter(o => o.id !== id))
      } else {
        const err = await response.json()
        setOffertesError(err.error ?? 'Verwijderen mislukt.')
      }
    } catch {
      setOffertesError('Verbindingsfout — probeer opnieuw.')
    }
  }

  const inputStyle = {
    backgroundColor: '#2D2D2D',
    borderColor: '#4D4D4D',
    color: '#ffffff',
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#2D2D2D' }}>
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm rounded-xl p-8 space-y-6"
            style={{ backgroundColor: '#3D3D3D' }}
          >
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)' }}
              >
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

              {authError && (
                <p className="text-xs" style={{ color: '#FF4444' }}>{authError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg font-medium text-sm text-white transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)' }}
              >
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
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: '#9D9D9D', backgroundColor: '#3D3D3D' }}
          >
            Uitloggen
          </button>
        </div>

        {/* Tab navigatie */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ backgroundColor: '#3D3D3D' }}>
          <button
            onClick={() => setActiveTab('tarieven')}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all"
            style={activeTab === 'tarieven'
              ? { backgroundColor: '#2D2D2D', color: '#ffffff' }
              : { color: '#9D9D9D' }
            }
          >
            Tarieven
          </button>
          <button
            onClick={() => setActiveTab('offertes')}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all"
            style={activeTab === 'offertes'
              ? { backgroundColor: '#2D2D2D', color: '#ffffff' }
              : { color: '#9D9D9D' }
            }
          >
            Offertes
          </button>
        </div>

        {/* ── Tarieven tab ── */}
        {activeTab === 'tarieven' && (
          <>
            {saveError && (
              <div
                className="mb-4 px-4 py-3 rounded-lg text-sm"
                style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#FF4444' }}
              >
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div
                className="mb-4 px-4 py-3 rounded-lg text-sm"
                style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)', color: '#00E8FF' }}
              >
                {saveSuccess}
              </div>
            )}

            <div
              className="rounded-xl overflow-hidden mb-8"
              style={{ backgroundColor: '#3D3D3D' }}
            >
              <div className="px-5 py-4 border-b" style={{ borderColor: '#4D4D4D' }}>
                <h2 className="text-white font-semibold">Tarieven overzicht</h2>
                <p style={{ color: '#9D9D9D' }} className="text-xs mt-0.5">
                  {tarieven.length} tarieven &bull; Koppeling met werkzaamheden codes uit PDF
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: '#00E8FF', borderTopColor: 'transparent' }}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#2D2D2D' }}>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#9D9D9D' }}>Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#9D9D9D' }}>Omschrijving</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Uurtarief</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#9D9D9D' }}>Acties</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tarieven.map(tarief => (
                        <tr
                          key={tarief.id}
                          className="border-t"
                          style={{ borderColor: '#4D4D4D' }}
                        >
                          <td className="px-4 py-3">
                            <span
                              className="text-xs px-2 py-0.5 rounded font-mono"
                              style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)', color: '#00E8FF' }}
                            >
                              {tarief.code}
                            </span>
                          </td>
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
                                  <button
                                    onClick={() => handleSaveEdit(tarief.id)}
                                    className="text-xs px-3 py-1 rounded transition-colors"
                                    style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)', color: '#00E8FF' }}
                                  >
                                    Opslaan
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="text-xs px-3 py-1 rounded transition-colors"
                                    style={{ color: '#9D9D9D', backgroundColor: '#2D2D2D' }}
                                  >
                                    Annuleren
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEdit(tarief)}
                                    className="text-xs px-3 py-1 rounded transition-colors"
                                    style={{ color: '#9D9D9D', backgroundColor: '#2D2D2D' }}
                                  >
                                    Bewerken
                                  </button>
                                  <button
                                    onClick={() => handleDelete(tarief.id)}
                                    className="text-xs px-3 py-1 rounded transition-colors"
                                    style={{ color: '#FF4444', backgroundColor: 'rgba(255, 68, 68, 0.1)' }}
                                  >
                                    Verwijder
                                  </button>
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
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: '#3D3D3D' }}
            >
              <h2 className="text-white font-semibold mb-4">Nieuw tarief toevoegen</h2>
              <form onSubmit={handleAddTarief} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: '#9D9D9D' }}>Code *</label>
                  <input
                    type="text"
                    value={newTarief.code}
                    onChange={e => setNewTarief(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="bijv. O-X"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={inputStyle}
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium" style={{ color: '#9D9D9D' }}>Omschrijving</label>
                  <input
                    type="text"
                    value={newTarief.omschrijving}
                    onChange={e => setNewTarief(prev => ({ ...prev, omschrijving: e.target.value }))}
                    placeholder="bijv. Onderhoud overig"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={inputStyle}
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
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg font-medium text-sm text-white transition-all duration-200"
                    style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)' }}
                  >
                    Tarief toevoegen
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* ── Offertes tab ── */}
        {activeTab === 'offertes' && (
          <>
            {offertesError && (
              <div
                className="mb-4 px-4 py-3 rounded-lg text-sm"
                style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#FF4444' }}
              >
                {offertesError}
              </div>
            )}

            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#3D3D3D' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#4D4D4D' }}>
                <div>
                  <h2 className="text-white font-semibold">Opgeslagen offertes</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#9D9D9D' }}>
                    {offertes.length} offerte{offertes.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => { setOffertesLoaded(false) }}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: '#9D9D9D', backgroundColor: '#2D2D2D' }}
                >
                  Vernieuwen
                </button>
              </div>

              {isLoadingOffertes ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: '#00E8FF', borderTopColor: 'transparent' }}
                  />
                </div>
              ) : offertes.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm" style={{ color: '#9D9D9D' }}>Geen opgeslagen offertes</p>
                </div>
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
                          <td className="px-4 py-3">
                            <span className="text-white font-medium capitalize">
                              {row.maand} {row.jaar}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span style={{ color: '#9D9D9D' }}>
                              {row.data?.klussen?.length ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-white">
                              {formatCurrency(row.data?.totaal ?? row.totaal)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold" style={{ color: '#00E8FF' }}>
                              {formatCurrency(row.data?.totaalInclBTW ?? row.totaal * 1.21)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs" style={{ color: '#9D9D9D' }}>
                              {formatDate(row.aangemaakt)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDownloadPdf(row)}
                                disabled={downloadingId === row.id}
                                className="text-xs px-3 py-1.5 rounded transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                                style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)', color: '#ffffff' }}
                              >
                                {downloadingId === row.id ? (
                                  <>
                                    <div
                                      className="w-3 h-3 border border-t-transparent rounded-full animate-spin"
                                      style={{ borderColor: '#fff', borderTopColor: 'transparent' }}
                                    />
                                    Genereren...
                                  </>
                                ) : (
                                  'Download PDF'
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteOfferte(row.id)}
                                className="text-xs px-3 py-1.5 rounded transition-colors"
                                style={{ color: '#FF4444', backgroundColor: 'rgba(255, 68, 68, 0.1)' }}
                              >
                                Verwijder
                              </button>
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
