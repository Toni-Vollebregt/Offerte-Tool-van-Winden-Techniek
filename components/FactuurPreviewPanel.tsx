'use client'

import { useState, useEffect } from 'react'
import type { Factuur } from '@/types'

interface Props {
  factuur: Factuur
}

export default function FactuurPreviewPanel({ factuur }: Props) {
  const [PDFViewer, setPDFViewer] = useState<React.ComponentType<{
    width?: string | number
    height?: string | number
    showToolbar?: boolean
    children: React.ReactNode
  }> | null>(null)
  const [FactuurDocument, setFactuurDocument] = useState<React.ComponentType<{
    factuur: Factuur
    logoUrl?: string
  }> | null>(null)

  useEffect(() => {
    import('@react-pdf/renderer').then(mod => {
      setPDFViewer(() => mod.PDFViewer as unknown as typeof PDFViewer)
    })
    import('./FactuurDocument').then(mod => {
      setFactuurDocument(() => mod.default)
    })
  }, [])

  if (!PDFViewer || !FactuurDocument) {
    return (
      <div
        className="w-full flex items-center justify-center gap-3 rounded-xl"
        style={{ height: '80vh', backgroundColor: '#3D3D3D' }}
      >
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00E8FF', borderTopColor: 'transparent' }} />
        <span style={{ color: '#9D9D9D' }} className="text-sm">PDF voorbeeld laden...</span>
      </div>
    )
  }

  const logoUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/vanwinden_techniek_logo_transparant.png`
    : undefined

  return (
    <div style={{ height: '80vh', borderRadius: '12px', overflow: 'hidden' }}>
      <PDFViewer width="100%" height="100%" showToolbar={false}>
        <FactuurDocument factuur={factuur} logoUrl={logoUrl} />
      </PDFViewer>
    </div>
  )
}
