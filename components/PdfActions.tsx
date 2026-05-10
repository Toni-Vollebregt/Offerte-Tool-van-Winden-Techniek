'use client'

import { useState, useEffect } from 'react'
import type { Offerte } from '@/types'

interface PdfActionsProps {
  offerte: Offerte
  fileName: string
}

export default function PdfActions({ offerte, fileName }: PdfActionsProps) {
  const [mounted, setMounted] = useState(false)
  const [PDFDownloadLink, setPDFDownloadLink] = useState<React.ComponentType<{
    document: React.ReactElement
    fileName: string
    className?: string
    style?: React.CSSProperties
    children: (props: { loading: boolean }) => React.ReactNode
  }> | null>(null)
  const [OfferteDocument, setOfferteDocument] = useState<React.ComponentType<{
    offerte: Offerte
    logoUrl?: string
  }> | null>(null)

  useEffect(() => {
    setMounted(true)
    // Lazy load react-pdf components
    import('@react-pdf/renderer').then(mod => {
      setPDFDownloadLink(() => mod.PDFDownloadLink as unknown as typeof PDFDownloadLink)
    })
    import('./OfferteDocument').then(mod => {
      setOfferteDocument(() => mod.default)
    })
  }, [])

  if (!mounted || !PDFDownloadLink || !OfferteDocument) {
    return (
      <div
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white"
        style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)', opacity: 0.7 }}
      >
        <div
          className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#fff', borderTopColor: 'transparent' }}
        />
        PDF laden...
      </div>
    )
  }

  const logoUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/vanwinden_techniek_logo_donker.png`
    : undefined
  const doc = <OfferteDocument offerte={offerte} logoUrl={logoUrl} />

  return (
    <PDFDownloadLink
      document={doc}
      fileName={fileName}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white no-underline"
      style={{ background: 'linear-gradient(135deg, #0055FF, #00E8FF)' }}
    >
      {({ loading }) =>
        loading ? 'PDF genereren...' : 'Download offerte PDF'
      }
    </PDFDownloadLink>
  )
}
