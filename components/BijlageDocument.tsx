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
  naam:  'Van Winden Techniek',
  stad:  'Naaldwijk',
  iban:  'NL41 KNAB 0407 2672 47',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#333333',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },

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

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2D2D2D',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  tableHeaderCell: { color: '#FFFFFF', fontSize: 7.5, fontFamily: 'Helvetica-Bold' },

  b_omschrijving: { width: '55%' },
  b_codes:        { width: '20%' },
  b_bedrag:       { width: '25%', textAlign: 'right' },

  techSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  techSectionLine: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: '#CCCCCC' },
  techSectionLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#2D2D2D',
    marginHorizontal: 8,
    backgroundColor: '#00E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },

  dagHeader: {
    flexDirection: 'row',
    backgroundColor: '#EEEEEE',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 2,
    borderRadius: 2,
  },
  dagHeaderText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#333333' },
  dagHeaderTotaal: { marginLeft: 'auto', fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#333333' },

  bijlageRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  bijlageCell: { fontSize: 7.5, color: '#333333' },
  bijlageCellMuted: { fontSize: 6.5, color: '#999999', marginTop: 1 },
  bijlageRitRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    paddingHorizontal: 4,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  bijlageRitCell: { fontSize: 7, color: '#888888' },
  bijlageExtraRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    backgroundColor: '#FFFBF0',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },

  dagSubtotaalRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    marginBottom: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#CCCCCC',
  },
  dagSubtotaalCell: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#555555' },

  totalsBlock: {
    marginTop: 10,
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

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(amount)
}

function formatNL(num: number, decimals = 2): string {
  return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num)
}

function datumLang(ddmmyyyy: string): string {
  if (!ddmmyyyy) return ''
  const [d, m, y] = ddmmyyyy.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function datumSortKey(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('-')
  return `${y}-${m}-${d}`
}

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

interface BijlageDocumentProps {
  factuur: Factuur
  factuurNummer: string
  logoUrl?: string
}

export default function BijlageDocument({ factuur, factuurNummer, logoUrl }: BijlageDocumentProps) {
  const btw = factuur.btw ?? Math.round(factuur.totaal * 0.21 * 100) / 100
  const totaalInclBTW = factuur.totaalInclBTW ?? Math.round(factuur.totaal * 1.21 * 100) / 100
  const techDataList = groepeerPerTechPerDag(factuur)

  return (
    <Document
      title={`Bijlage Van Winden Techniek - Week ${factuur.weekNummer} ${factuur.jaar}`}
      author={BEDRIJF.naam}
      subject="Bijlage specificaties"
    >
      <Page size="A4" orientation="portrait" style={styles.page}>

        <View style={styles.headerSmall}>
          <View>
            {logoUrl
              ? <Image src={logoUrl} style={styles.logoSmall} />
              : <Text style={styles.companyNameSmall}>{BEDRIJF.naam.toUpperCase()}</Text>
            }
          </View>
          <View style={styles.headerSmallRight}>
            <Text style={styles.headerSmallTitle}>Bijlage — Specificaties per dag</Text>
            <Text style={styles.headerSmallSub}>Week {factuur.weekNummer} {factuur.jaar} · {factuurNummer}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.b_omschrijving]}>Omschrijving</Text>
          <Text style={[styles.tableHeaderCell, styles.b_codes]}>Werkbon / Project</Text>
          <Text style={[styles.tableHeaderCell, styles.b_bedrag]}>Bedrag excl. BTW</Text>
        </View>

        {techDataList.map(({ tech, dagen }) => (
          <View key={tech}>
            <View style={styles.techSectionHeader}>
              <View style={styles.techSectionLine} />
              <Text style={styles.techSectionLabel}>{tech}</Text>
              <View style={styles.techSectionLine} />
            </View>

            {dagen.map(dag => {
              const totaalDagKm = dag.rits.reduce((s, r) => s + r.afstandKm, 0)
              const totaalDagReisUur = dag.rits.reduce((s, r) => s + r.reisUren, 0)
              const totaalDagReisKm = dag.rits.reduce((s, r) => s + r.reiskostenKm, 0)
              const totaalDagReisKosten = dag.rits.reduce((s, r) => s + r.reiskostenUur, 0)

              return (
                <View key={dag.datum}>
                  <View style={styles.dagHeader}>
                    <Text style={styles.dagHeaderText}>{datumLang(dag.datum)}</Text>
                    <Text style={styles.dagHeaderTotaal}>{formatEuro(dag.totaalDag)}</Text>
                  </View>

                  {dag.klussen.map((klus, ki) => (
                    <View key={klus.id} style={[styles.bijlageRow, ki % 2 === 1 ? { backgroundColor: '#FAFAFA' } : {}]}>
                      <View style={styles.b_omschrijving}>
                        <Text style={styles.bijlageCell}>
                          {klus.werkzaamhedenOmschrijving || klus.projectNaam}
                        </Text>
                        {klus.rivgToeslag ? (
                          <Text style={[styles.bijlageCellMuted, { color: '#555555' }]}>
                            + Schoonmaak en Diversen: {formatEuro(klus.rivgToeslag)}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.b_codes}>
                        <Text style={styles.bijlageCellMuted}>{klus.werkbonNummer}</Text>
                        <Text style={styles.bijlageCellMuted}>{klus.projectCode}</Text>
                      </View>
                      <View style={styles.b_bedrag}>
                        <Text style={[styles.bijlageCell, { textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
                          {formatEuro(klus.arbeidskosten)}
                        </Text>
                        <Text style={[styles.bijlageCellMuted, { textAlign: 'right' }]}>
                          {formatNL(klus.duur)} u × €{klus.uurtarief}/u
                        </Text>
                      </View>
                    </View>
                  ))}

                  {dag.extraRegels.map((regel) => (
                    <View key={regel.id} style={styles.bijlageExtraRow}>
                      <View style={styles.b_omschrijving}>
                        <Text style={styles.bijlageCell}>{regel.omschrijving}</Text>
                      </View>
                      <View style={styles.b_codes}>
                        <Text style={styles.bijlageCellMuted}>Extra post</Text>
                      </View>
                      <View style={styles.b_bedrag}>
                        <Text style={[styles.bijlageCell, { textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
                          {formatEuro(regel.totaal)}
                        </Text>
                        <Text style={[styles.bijlageCellMuted, { textAlign: 'right' }]}>
                          {formatNL(regel.aantal, 0)} × €{formatNL(regel.prijs)}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {dag.rits.length > 0 && (
                    <View style={styles.bijlageRitRow}>
                      <View style={styles.b_omschrijving}>
                        <Text style={styles.bijlageRitCell}>
                          Reiskosten: {formatNL(totaalDagKm, 0)} km · {formatNL(totaalDagReisUur)} u reistijd
                        </Text>
                        <Text style={[styles.bijlageRitCell, { color: '#BBBBBB', marginTop: 1 }]}>
                          {dag.rits.map(r => `${r.van} → ${r.naar}`).join(' · ')}
                        </Text>
                      </View>
                      <View style={styles.b_codes}>
                        <Text style={styles.bijlageRitCell}>km-vergoeding</Text>
                        <Text style={styles.bijlageRitCell}>reiskosten</Text>
                      </View>
                      <View style={styles.b_bedrag}>
                        <Text style={[styles.bijlageRitCell, { textAlign: 'right' }]}>{formatEuro(totaalDagReisKm)}</Text>
                        <Text style={[styles.bijlageRitCell, { textAlign: 'right' }]}>{formatEuro(totaalDagReisKosten)}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.dagSubtotaalRow}>
                    <Text style={[styles.dagSubtotaalCell, { flex: 1 }]} />
                    <Text style={[styles.dagSubtotaalCell, { textAlign: 'right' }]}>
                      Dag totaal: {formatEuro(dag.totaalDag)}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        ))}

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
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAAL incl. BTW</Text>
            <Text style={styles.grandTotalValue}>{formatEuro(totaalInclBTW)}</Text>
          </View>
          <View style={[styles.totalsRow, { marginTop: 4 }]}>
            <Text style={styles.totalsLabel}>Excl. BTW</Text>
            <Text style={styles.totalsValue}>{formatEuro(factuur.totaal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>BTW 21%</Text>
            <Text style={styles.totalsValue}>{formatEuro(btw)}</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{BEDRIJF.naam} · {BEDRIJF.stad} · {factuurNummer}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} van ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
