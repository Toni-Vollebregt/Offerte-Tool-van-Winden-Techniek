'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import type { Tarief } from '@/types'
import { formatCurrency } from '@/lib/calculations'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchTarieven()
    }
  }, [isAuthenticated])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple client-side password check (for production use proper auth)
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
        setTarieven(prev => prev.map(t =>
          t.id === id ? { ...t, ...editValues } : t
        ))
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

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Beheerportal</h1>
            <p style={{ color: '#9D9D9D' }} className="text-sm mt-1">Tarieven beheer</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: '#9D9D9D', backgroundColor: '#3D3D3D' }}
          >
            Uitloggen
          </button>
        </div>

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

        {/* Tarieven table */}
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

        {/* Add new tarief */}
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
      </main>
    </div>
  )
}
