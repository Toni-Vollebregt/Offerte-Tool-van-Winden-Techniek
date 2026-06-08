'use client'

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Factuur, Klus, Rit, ExtraRegel } from '@/types'

const BEDRIJF = {
  naam:    'Van Winden Techniek',
  straat:  'Verdilaan 2K',
  pc:      '2671 VX',
  stad:    'Naaldwijk',
  tel:     '06-24690118',
  email:   'info@vanwinden-techniek.nl',
  kvk:     '82755280',
  btwnr:   'NL003725695B69',
  iban:    'NL41 KNAB 0407 2672 47',
}

const BETALINGSTERMIJN_DAGEN = 14

// ─── Stijlen ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#333333',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },

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
  companyName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#2D2D2D' },
  companyDetails: { fontSize: 7.5, color: '#666666', marginTop: 5, lineHeight: 1.6 },
  factuurInfo: { alignItems: 'flex-end' },
  factuurTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#2D2D2D' },
  factuurDetails: { fontSize: 8, color: '#666666', marginTop: 4, textAlign: 'right', lineHeight: 1.7 },
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

  subjectText: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#2D2D2D', marginBottom: 8 },
  intro: { fontSize: 8.5, color: '#555555', lineHeight: 1.5, marginBottom: 14 },

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
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EBEBEB',
  },
  tableRowAlt: { backgroundColor: '#F9F9F9' },
  tableCell: { fontSize: 8.5, color: '#333333' },
  tableCellMuted: { fontSize: 7, color: '#888888', marginTop: 1.5 },

  // Kolombreedte hoofdfactuur
  s_nr:      { width: '5%' },
  s_datum:   { width: '11%' },
  s_project: { width: '65%' },
  s_totaal:  { width: '19%', textAlign: 'right' },

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
  totalsDivider: { borderBottomWidth: 1, borderBottomColor: '#BBBBBB', marginHorizontal: 10, marginVertical: 2 },
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

  notes: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 3,
    borderLeftWidth: 2,
    borderLeftColor: '#00E8FF',
  },
  notesText: { fontSize: 7.5, color: '#666666', lineHeight: 1.5 },

  footer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: '#CCCCCC',
    paddingTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: '#999999' },
  pageNumber: { fontSize: 7, color: '#999999' },

})

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
}

function datumLang(ddmmyyyy: string): string {
  if (!ddmmyyyy) return ''
  const [d, m, y] = ddmmyyyy.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function datumKort(ddmmyyyy: string): string {
  if (!ddmmyyyy) return ''
  const [d, m, y] = ddmmyyyy.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function datumSortKey(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('-')
  return `${y}-${m}-${d}`
}

// ─── Gegroepeerde data ────────────────────────────────────────────────────────

type DagData = {
  datum: string
  klussen: Klus[]
  rits: Rit[]
  extraRegels: ExtraRegel[]
  totaalArbeid: number
  totaalReis: number
  totaalExtra: number
  totaalDag: number
}

type TechData = {
  tech: string
  dagen: DagData[]
  totaalTech: number
}

function groepeerPerTechPerDag(factuur: Factuur): TechData[] {
  const techMap = new Map<string, Map<string, DagData>>()

  const ensureDag = (tech: string, datum: string): DagData => {
    if (!techMap.has(tech)) techMap.set(tech, new Map())
    const dagMap = techMap.get(tech)!
    if (!dagMap.has(datum)) {
      dagMap.set(datum, { datum, klussen: [], rits: [], extraRegels: [], totaalArbeid: 0, totaalReis: 0, totaalExtra: 0, totaalDag: 0 })
    }
    return dagMap.get(datum)!
  }

  for (const k of factuur.klussen) ensureDag(k.technicianName ?? '', k.datum).klussen.push(k)
  for (const r of (factuur.rits ?? [])) ensureDag(r.technicianName ?? '', r.datum).rits.push(r)
  for (const e of (factuur.extraRegels ?? [])) ensureDag(e.technicianName ?? '', e.datum).extraRegels.push(e)

  return [...techMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([tech, dagMap]) => {
    const dagen = [...dagMap.values()]
      .sort((a, b) => datumSortKey(a.datum).localeCompare(datumSortKey(b.datum)))
      .map(dag => {
        const totaalArbeid = Math.round(dag.klussen.reduce((s, k) => s + k.arbeidskosten, 0) * 100) / 100
        const totaalReis = Math.round(dag.rits.reduce((s, r) => s + r.totaal, 0) * 100) / 100
        const totaalExtra = Math.round(dag.extraRegels.reduce((s, e) => s + e.totaal, 0) * 100) / 100
        const totaalDag = Math.round((totaalArbeid + totaalReis + totaalExtra) * 100) / 100
        return { ...dag, totaalArbeid, totaalReis, totaalExtra, totaalDag }
      })
    const totaalTech = Math.round(dagen.reduce((s, d) => s + d.totaalDag, 0) * 100) / 100
    return { tech, dagen, totaalTech }
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

interface FactuurDocumentProps {
  factuur: Factuur
  logoUrl?: string
  technicianName?: string
}

export default function FactuurDocument({ factuur, logoUrl }: FactuurDocumentProps) {
  const today = new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
  const factuurNummer = `FACT-${factuur.jaar}-W${String(factuur.weekNummer).padStart(2, '0')}-${Date.now().toString().slice(-4)}`
  const btw = factuur.btw ?? Math.round(factuur.totaal * 0.21 * 100) / 100
  const totaalInclBTW = factuur.totaalInclBTW ?? Math.round(factuur.totaal * 1.21 * 100) / 100
  const vervaldatum = addDays(BETALINGSTERMIJN_DAGEN)
  const techDataList = groepeerPerTechPerDag(factuur)

  // Factuurregels: één per dag per monteur
  const factuurRegels = techDataList.flatMap(td =>
    td.dagen.map(dag => ({ tech: td.tech, dag }))
  ).sort((a, b) => {
    const d = datumSortKey(a.dag.datum).localeCompare(datumSortKey(b.dag.datum))
    return d !== 0 ? d : a.tech.localeCompare(b.tech)
  })

  return (
    <Document
      title={`Factuur Van Winden Techniek - Week ${factuur.weekNummer} ${factuur.jaar}`}
      author="Van Winden Techniek"
      subject="Wekelijkse onderhoud factuur"
    >
      {/* ══════════════ PAGINA 1 — Factuur ══════════════════ */}
      <Page size="A4" orientation="portrait" style={styles.page}>

        <View style={styles.header}>
          <View>
            {logoUrl
              ? <Image src={logoUrl} style={styles.logo} />
              : <Text style={styles.companyName}>{BEDRIJF.naam.toUpperCase()}</Text>
            }
            <Text style={styles.companyDetails}>
              {BEDRIJF.straat}{'\n'}
              {BEDRIJF.pc} {BEDRIJF.stad}{'\n'}
              Tel: {BEDRIJF.tel}{'\n'}
              {BEDRIJF.email}
            </Text>
          </View>
          <View style={styles.factuurInfo}>
            <Text style={styles.factuurTitle}>FACTUUR</Text>
            <Text style={styles.factuurDetails}>
              Nummer: {factuurNummer}{'\n'}
              Datum: {today}{'\n'}
              Vervaldatum: {vervaldatum}{'\n'}
              Periode: Week {factuur.weekNummer} {factuur.jaar}{'\n'}
              KvK: {BEDRIJF.kvk}{'\n'}
              BTW-nr: {BEDRIJF.btwnr}
            </Text>
            <View style={styles.badge}>
              <Text>{factuur.klussen.length} werkbonnen · {factuurRegels.length} dagregels</Text>
            </View>
          </View>
        </View>

        <View style={styles.recipient}>
          <Text style={styles.recipientLabel}>Gericht aan</Text>
          <Text style={styles.recipientName}>ExcelAir System-Care</Text>
          <Text style={styles.recipientDetails}>
            Onderhoud en servicewerkzaamheden — week {factuur.weekNummer} {factuur.jaar}
          </Text>
        </View>

        <Text style={styles.subjectText}>
          Betreft: Factuur onderhoudswerkzaamheden week {factuur.weekNummer} {factuur.jaar}
        </Text>
        <Text style={styles.intro}>
          Hierbij ontvangt u onze factuur voor de uitgevoerde onderhoudswerkzaamheden in week {factuur.weekNummer} {factuur.jaar}.
          Wij verzoeken u het factuurbedrag binnen {BETALINGSTERMIJN_DAGEN} dagen na factuurdatum te voldoen op rekeningnummer {BEDRIJF.iban} t.n.v. {BEDRIJF.naam}, onder vermelding van het factuurnummer.
          Reiskosten worden berekend vanuit {BEDRIJF.stad}.
        </Text>

        {/* Tabel: één rij per dag per monteur */}
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.s_nr]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.s_datum]}>Datum</Text>
            <Text style={[styles.tableHeaderCell, styles.s_project]}>Aangenomen werk</Text>
            <Text style={[styles.tableHeaderCell, styles.s_totaal]}>Totaal excl. BTW</Text>
          </View>

          {factuurRegels.map(({ tech, dag }, i) => {
            const werkbonnen = dag.klussen.map(k => k.werkbonNummer).filter(Boolean).join(', ')
            return (
              <View key={`${dag.datum}-${tech}`} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, styles.s_nr, { color: '#AAAAAA' }]}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <Text style={[styles.tableCell, styles.s_datum]}>{dag.datum}</Text>
                <View style={styles.s_project}>
                  <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold', color: '#1A1A1A' }]}>
                    {datumKort(dag.datum)} — {tech}
                  </Text>
                  {werkbonnen ? (
                    <Text style={styles.tableCellMuted}>{werkbonnen}</Text>
                  ) : null}
                </View>
                <Text style={[styles.tableCell, styles.s_totaal, { fontFamily: 'Helvetica-Bold' }]}>
                  {formatEuro(dag.totaalDag)}
                </Text>
              </View>
            )
          })}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Arbeidskosten</Text>
            <Text style={styles.totalsValue}>{formatEuro(factuur.subtotaalArbeid)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Kilometervergoeding</Text>
            <Text style={styles.totalsValue}>{formatEuro(factuur.subtotaalReisKm)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Reiskosten</Text>
            <Text style={styles.totalsValue}>{formatEuro(factuur.subtotaalReisUur)}</Text>
          </View>
          {(factuur.subtotaalExtra ?? 0) > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Extra posten</Text>
              <Text style={styles.totalsValue}>{formatEuro(factuur.subtotaalExtra ?? 0)}</Text>
            </View>
          )}
          <View style={styles.totalsDivider} />
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Totaal excl. BTW</Text>
            <Text style={styles.totalsValue}>{formatEuro(factuur.totaal)}</Text>
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

        <View style={styles.notes}>
          <Text style={styles.notesText}>
            Betalingstermijn: {BETALINGSTERMIJN_DAGEN} dagen · Vervaldatum: {vervaldatum} · IBAN: {BEDRIJF.iban} · Reiskosten vanuit {BEDRIJF.stad} · Kilometervergoeding: €0,50/km · BTW: 21%
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{BEDRIJF.naam} · {BEDRIJF.stad} · {factuurNummer}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} van ${totalPages}`} />
        </View>
      </Page>

    </Document>
  )
}
