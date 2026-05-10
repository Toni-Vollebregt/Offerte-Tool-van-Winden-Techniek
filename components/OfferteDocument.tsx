'use client'

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Offerte } from '@/types'

const styles = StyleSheet.create({
  // ── Shared ──────────────────────────────────────────────
  pagePortrait: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#333333',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  pageLandscape: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#333333',
    paddingTop: 32,
    paddingBottom: 52,
    paddingHorizontal: 36,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: '#CCCCCC',
    paddingTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: '#999999' },
  pageNumber: { fontSize: 7, color: '#999999' },

  // ── Page 1 header ───────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#00E8FF',
  },
  logo: { width: 150, height: 48, objectFit: 'contain' },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#2D2D2D',
  },
  companyDetails: { fontSize: 7.5, color: '#666666', marginTop: 5, lineHeight: 1.5 },
  offerteInfo: { alignItems: 'flex-end' },
  offerteTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#2D2D2D' },
  offerteDetails: { fontSize: 8, color: '#666666', marginTop: 4, textAlign: 'right', lineHeight: 1.6 },
  badge: {
    backgroundColor: '#2D2D2D',
    color: '#00E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },

  // ── Recipient ────────────────────────────────────────────
  recipient: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#0055FF',
  },
  recipientLabel: { fontSize: 7, color: '#999999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  recipientName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#2D2D2D' },
  recipientDetails: { fontSize: 8, color: '#666666', marginTop: 2 },

  // ── Subject + intro ──────────────────────────────────────
  subject: { marginBottom: 10 },
  subjectText: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#2D2D2D' },
  intro: { fontSize: 8.5, color: '#555555', lineHeight: 1.5, marginBottom: 14 },

  // ── Summary table (page 1) ───────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2D2D2D',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  tableHeaderCell: { color: '#FFFFFF', fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
  },
  tableRowAlt: { backgroundColor: '#F9F9F9' },
  tableCell: { fontSize: 8.5, color: '#333333' },
  tableCellMuted: { fontSize: 7, color: '#888888', marginTop: 1 },
  tableCellRight: { textAlign: 'right' },

  // Summary table column widths
  s_nr:      { width: '5%' },
  s_datum:   { width: '11%' },
  s_project: { width: '65%' },
  s_totaal:  { width: '19%', textAlign: 'right' },

  // ── Totals block (page 1) ────────────────────────────────
  totalsBlock: {
    marginTop: 12,
    marginLeft: 'auto',
    width: '44%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8E8',
  },
  totalsLabel: { fontSize: 8, color: '#666666' },
  totalsValue: { fontSize: 8, color: '#333333', fontFamily: 'Helvetica-Bold' },
  totalsDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#BBBBBB',
    marginHorizontal: 10,
    marginVertical: 2,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#2D2D2D',
    borderRadius: 3,
    marginTop: 4,
  },
  grandTotalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  grandTotalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#00E8FF' },

  // ── Notes ────────────────────────────────────────────────
  notes: {
    marginTop: 'auto',
    padding: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 3,
    borderLeftWidth: 2,
    borderLeftColor: '#00E8FF',
  },
  notesText: { fontSize: 7.5, color: '#666666', lineHeight: 1.5 },

  // ── Page 2 header (compact) ──────────────────────────────
  headerSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#00E8FF',
  },
  logoSmall: { width: 110, height: 34, objectFit: 'contain' },
  companyNameSmall: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#2D2D2D' },
  headerSmallRight: { alignItems: 'flex-end' },
  headerSmallTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#2D2D2D' },
  headerSmallSub: { fontSize: 7.5, color: '#888888', marginTop: 2 },

  // ── Detail table (page 2) ────────────────────────────────
  d_nr:      { width: '4%' },
  d_datum:   { width: '9%' },
  d_project: { width: '25%' },
  d_uren:    { width: '6%', textAlign: 'right' },
  d_tarief:  { width: '7%', textAlign: 'right' },
  d_arbeid:  { width: '11%', textAlign: 'right' },
  d_km:      { width: '6%', textAlign: 'right' },
  d_kmverg:  { width: '10%', textAlign: 'right' },
  d_reis:    { width: '10%', textAlign: 'right' },
  d_totaal:  { width: '12%', textAlign: 'right' },
})

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatNL(num: number, decimals = 2): string {
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

interface OfferteDocumentProps {
  offerte: Offerte
  logoUrl?: string
}

export default function OfferteDocument({ offerte, logoUrl }: OfferteDocumentProps) {
  const today = new Date().toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const offerteNummer = `OFT-${offerte.jaar}-${offerte.maand.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`
  const btw = offerte.btw ?? Math.round(offerte.totaal * 0.21 * 100) / 100
  const totaalInclBTW = offerte.totaalInclBTW ?? Math.round(offerte.totaal * 1.21 * 100) / 100

  return (
    <Document
      title={`Offerte Van Winden Techniek - ${offerte.maand} ${offerte.jaar}`}
      author="Van Winden Techniek"
      subject="Maandelijkse onderhoud offerte"
    >
      {/* ═══════════════════════════════════════════════════
          PAGINA 1 — Overzicht (Portrait A4)
      ════════════════════════════════════════════════════ */}
      <Page size="A4" orientation="portrait" style={styles.pagePortrait}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoUrl
              ? <Image src={logoUrl} style={styles.logo} />
              : <Text style={styles.companyName}>VAN WINDEN TECHNIEK</Text>
            }
            <Text style={styles.companyDetails}>
              Naaldwijk, Zuid-Holland{'\n'}
              KvK: 00000000  |  BTW: NL000000000B00
            </Text>
          </View>
          <View style={styles.offerteInfo}>
            <Text style={styles.offerteTitle}>OFFERTE</Text>
            <Text style={styles.offerteDetails}>
              Nummer: {offerteNummer}{'\n'}
              Datum: {today}{'\n'}
              Periode: {offerte.maand} {offerte.jaar}
            </Text>
            <View style={styles.badge}>
              <Text>{offerte.klussen.length} werkbonnen</Text>
            </View>
          </View>
        </View>

        {/* Recipient */}
        <View style={styles.recipient}>
          <Text style={styles.recipientLabel}>Gericht aan</Text>
          <Text style={styles.recipientName}>ExcelAir System-Care</Text>
          <Text style={styles.recipientDetails}>
            Onderhoud en servicewerkzaamheden — {offerte.maand} {offerte.jaar}
          </Text>
        </View>

        {/* Subject */}
        <View style={styles.subject}>
          <Text style={styles.subjectText}>
            Betreft: Maandelijkse onderhoudswerkzaamheden {offerte.maand} {offerte.jaar}
          </Text>
        </View>
        <Text style={styles.intro}>
          Hierbij ontvangt u onze offerte voor de uitgevoerde onderhoudswerkzaamheden in {offerte.maand} {offerte.jaar}.
          Alle werkzaamheden zijn uitgevoerd conform de overeengekomen kwaliteitsstandaarden.
          Reiskosten worden berekend vanuit Naaldwijk, Zuid-Holland.
        </Text>

        {/* Summary table */}
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.s_nr]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.s_datum]}>Datum</Text>
            <Text style={[styles.tableHeaderCell, styles.s_project]}>Project / Locatie</Text>
            <Text style={[styles.tableHeaderCell, styles.s_totaal]}>Totaal excl. BTW</Text>
          </View>
          {offerte.klussen.map((klus, i) => (
            <View
              key={klus.id}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.tableCell, styles.s_nr, { color: '#AAAAAA' }]}>
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Text style={[styles.tableCell, styles.s_datum]}>{klus.datum}</Text>
              <View style={styles.s_project}>
                <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold', color: '#1A1A1A' }]}>
                  {klus.projectNaam.length > 52 ? klus.projectNaam.slice(0, 52) + '…' : klus.projectNaam}
                </Text>
                <Text style={styles.tableCellMuted}>{klus.locatie} · {klus.werkbonNummer}</Text>
              </View>
              <Text style={[styles.tableCell, styles.s_totaal, { fontFamily: 'Helvetica-Bold' }]}>
                {formatEuro(klus.totaal)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Arbeidskosten</Text>
            <Text style={styles.totalsValue}>{formatEuro(offerte.subtotaalArbeid)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Kilometervergoeding</Text>
            <Text style={styles.totalsValue}>{formatEuro(offerte.subtotaalReisKm)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Reiskosten</Text>
            <Text style={styles.totalsValue}>{formatEuro(offerte.subtotaalReisUur)}</Text>
          </View>
          <View style={styles.totalsDivider} />
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Totaal excl. BTW</Text>
            <Text style={styles.totalsValue}>{formatEuro(offerte.totaal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>BTW 21%</Text>
            <Text style={styles.totalsValue}>{formatEuro(btw)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAAL incl. BTW</Text>
            <Text style={styles.grandTotalValue}>{formatEuro(totaalInclBTW)}</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notes}>
          <Text style={styles.notesText}>
            Reiskosten berekend vanuit Naaldwijk, Zuid-Holland (retour) · Kilometervergoeding: €0,50/km · BTW: 21% · Betalingstermijn: 30 dagen na factuurdatum
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Van Winden Techniek · Naaldwijk · {offerteNummer}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} van ${totalPages}`} />
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════
          PAGINA 2 — Specificaties per werkbon (Landscape A4)
      ════════════════════════════════════════════════════ */}
      <Page size="A4" orientation="landscape" style={styles.pageLandscape}>

        {/* Compact header */}
        <View style={styles.headerSmall}>
          <View>
            {logoUrl
              ? <Image src={logoUrl} style={styles.logoSmall} />
              : <Text style={styles.companyNameSmall}>VAN WINDEN TECHNIEK</Text>
            }
          </View>
          <View style={styles.headerSmallRight}>
            <Text style={styles.headerSmallTitle}>Specificaties per werkbon</Text>
            <Text style={styles.headerSmallSub}>{offerte.maand} {offerte.jaar} · {offerteNummer}</Text>
          </View>
        </View>

        {/* Detail table */}
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.d_nr]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.d_datum]}>Datum</Text>
            <Text style={[styles.tableHeaderCell, styles.d_project]}>Project / Locatie</Text>
            <Text style={[styles.tableHeaderCell, styles.d_uren, { textAlign: 'right' }]}>Uren</Text>
            <Text style={[styles.tableHeaderCell, styles.d_tarief, { textAlign: 'right' }]}>Tarief</Text>
            <Text style={[styles.tableHeaderCell, styles.d_arbeid, { textAlign: 'right' }]}>Arbeidskosten</Text>
            <Text style={[styles.tableHeaderCell, styles.d_km, { textAlign: 'right' }]}>KM v/v</Text>
            <Text style={[styles.tableHeaderCell, styles.d_kmverg, { textAlign: 'right' }]}>Km-vergoeding</Text>
            <Text style={[styles.tableHeaderCell, styles.d_reis, { textAlign: 'right' }]}>Reiskosten</Text>
            <Text style={[styles.tableHeaderCell, styles.d_totaal, { textAlign: 'right' }]}>Totaal excl. BTW</Text>
          </View>
          {offerte.klussen.map((klus, i) => (
            <View
              key={klus.id}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.tableCell, styles.d_nr, { color: '#AAAAAA' }]}>
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Text style={[styles.tableCell, styles.d_datum]}>{klus.datum}</Text>
              <View style={styles.d_project}>
                <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold', color: '#1A1A1A' }]}>
                  {klus.projectNaam.length > 34 ? klus.projectNaam.slice(0, 34) + '…' : klus.projectNaam}
                </Text>
                <Text style={styles.tableCellMuted}>{klus.locatie} · {klus.werkbonNummer}</Text>
              </View>
              <Text style={[styles.tableCell, styles.d_uren, styles.tableCellRight]}>{formatNL(klus.duur)}</Text>
              <Text style={[styles.tableCell, styles.d_tarief, styles.tableCellRight]}>{formatEuro(klus.uurtarief)}</Text>
              <Text style={[styles.tableCell, styles.d_arbeid, styles.tableCellRight]}>{formatEuro(klus.arbeidskosten)}</Text>
              <Text style={[styles.tableCell, styles.d_km, styles.tableCellRight]}>{formatNL(klus.afstandKm, 0)}</Text>
              <Text style={[styles.tableCell, styles.d_kmverg, styles.tableCellRight]}>{formatEuro(klus.reiskostenKm)}</Text>
              <Text style={[styles.tableCell, styles.d_reis, styles.tableCellRight]}>{formatEuro(klus.reiskostenUur)}</Text>
              <Text style={[styles.tableCell, styles.d_totaal, styles.tableCellRight, { fontFamily: 'Helvetica-Bold' }]}>
                {formatEuro(klus.totaal)}
              </Text>
            </View>
          ))}
        </View>

        {/* Subtotals on page 2 */}
        <View style={[styles.totalsBlock, { marginTop: 10 }]}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Arbeidskosten</Text>
            <Text style={styles.totalsValue}>{formatEuro(offerte.subtotaalArbeid)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Kilometervergoeding</Text>
            <Text style={styles.totalsValue}>{formatEuro(offerte.subtotaalReisKm)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Reiskosten</Text>
            <Text style={styles.totalsValue}>{formatEuro(offerte.subtotaalReisUur)}</Text>
          </View>
          <View style={styles.totalsDivider} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAAL incl. BTW</Text>
            <Text style={styles.grandTotalValue}>{formatEuro(totaalInclBTW)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Van Winden Techniek · Naaldwijk · {offerteNummer}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} van ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
