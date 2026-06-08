'use client'

import { useState, useEffect } from 'react'
import type { Factuur } from '@/types'

interface BijlageActionsProps {
  factuur: Factuur
  fileName: string
}

export default function BijlageActions({ factuur, fileName }: BijlageActionsProps) {
  const [mounted, setMounted] = useState(false)
  const [PDFDownloadLink, setPDFDownloadLink] = useState<React.ComponentType<{
    document: React.ReactElement
    fileName: string
    className?: string
    style?: React.CSSProperties
    children: (props: { loading: boolean }) => React.ReactNode
  }> | null>(null)
  const [BijlageDocument, setBijlageDocument] = useState<React.ComponentType<{
    factuur: Factuur
    factuurNummer: string
    logoUrl?: string
  }> | null>(null)

  useEffect(() => {
    setMounted(true)
    import('@react-pdf/renderer').then(mod => {
      setPDFDownloadLink(() => mod.PDFDownloadLink as unknown as typeof PDFDownloadLink)
    })
    import('./BijlageDocument').then(mod => {
      setBijlageDocument(() => mod.default)
    })
  }, [])

  if (!mounted || !PDFDownloadLink || !BijlageDocument) {
    return (
      <div
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white"
        style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)', opacity: 0.7 }}
      >
        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
        PDF laden...
      </div>
    )
  }

  const logoUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/vanwinden_techniek_logo_transparant.png`
    : undefined
  const factuurNummer = `FACT-${factuur.jaar}-W${String(factuur.weekNummer).padStart(2, '0')}-${Date.now().toString().slice(-4)}`
  const doc = <BijlageDocument factuur={factuur} factuurNummer={factuurNummer} logoUrl={logoUrl} />

  return (
    <PDFDownloadLink
      document={doc}
      fileName={fileName}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white no-underline"
      style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)' }}
    >
      {({ loading }) => loading ? 'PDF genereren...' : 'Download bijlage PDF'}
    </PDFDownloadLink>
  )
}
