'use client'

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Offerte, Klus } from '@/types'

// Register fonts (using built-in Helvetica)
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#333333',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#00E8FF',
  },
  companyBlock: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 52,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#2D2D2D',
    letterSpacing: 0.5,
  },
  companySubtitle: {
    fontSize: 10,
    color: '#0055FF',
    marginTop: 2,
  },
  companyDetails: {
    fontSize: 8,
    color: '#666666',
    marginTop: 6,
    lineHeight: 1.4,
  },
  offerteInfo: {
    alignItems: 'flex-end',
  },
  offerteTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#2D2D2D',
  },
  offerteDetails: {
    fontSize: 8,
    color: '#666666',
    marginTop: 4,
    textAlign: 'right',
    lineHeight: 1.6,
  },
  badge: {
    backgroundColor: '#2D2D2D',
    color: '#00E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },
  // Recipient
  recipient: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#0055FF',
  },
  recipientLabel: {
    fontSize: 7,
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  recipientName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#2D2D2D',
  },
  recipientDetails: {
    fontSize: 8,
    color: '#666666',
    marginTop: 2,
  },
  // Subject line
  subject: {
    marginBottom: 16,
  },
  subjectText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#2D2D2D',
  },
  intro: {
    fontSize: 8.5,
    color: '#444444',
    lineHeight: 1.5,
    marginBottom: 16,
  },
  // Table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2D2D2D',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  tableHeaderCell: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  tableRowAlt: {
    backgroundColor: '#F9F9F9',
  },
  tableCell: {
    fontSize: 8,
    color: '#333333',
  },
  tableCellRight: {
    textAlign: 'right',
  },
  // Column widths
  colNr: { width: '4%' },
  colDatum: { width: '9%' },
  colProject: { width: '28%' },
  colDuur: { width: '7%', textAlign: 'right' },
  colTarief: { width: '9%', textAlign: 'right' },
  colArbeid: { width: '11%', textAlign: 'right' },
  colKm: { width: '9%', textAlign: 'right' },
  colReisKm: { width: '10%', textAlign: 'right' },
  colReisUur: { width: '10%', textAlign: 'right' },
  colTotaal: { width: '13%', textAlign: 'right' },
  // Subtotals
  subtotaalSection: {
    marginTop: 8,
    marginLeft: 'auto',
    width: '45%',
  },
  subtotaalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  subtotaalLabel: {
    fontSize: 8,
    color: '#666666',
  },
  subtotaalValue: {
    fontSize: 8,
    color: '#333333',
    fontFamily: 'Helvetica-Bold',
  },
  totaalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#2D2D2D',
    borderRadius: 3,
    marginTop: 4,
  },
  totaalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  totaalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#00E8FF',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: '#CCCCCC',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#999999',
  },
  // Page number
  pageNumber: {
    fontSize: 7,
    color: '#999999',
  },
  // Notes
  notes: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#00E8FF',
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 7.5,
    color: '#666666',
    lineHeight: 1.5,
  },
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

  return (
    <Document
      title={`Offerte Van Winden Techniek - ${offerte.maand} ${offerte.jaar}`}
      author="Van Winden Techniek"
      subject="Maandelijkse onderhoud offerte"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logo} />
            ) : (
              <Text style={styles.companyName}>VAN WINDEN TECHNIEK</Text>
            )}
            <Text style={styles.companyDetails}>
              Naaldwijk, Zuid-Holland{'\n'}
              KvK: 00000000{'\n'}
              BTW: NL000000000B00
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
            Onderhoud en servicewerkzaamheden - {offerte.maand} {offerte.jaar}
          </Text>
        </View>

        {/* Subject */}
        <View style={styles.subject}>
          <Text style={styles.subjectText}>
            Betreft: Maandelijkse onderhoudswerkzaamheden {offerte.maand} {offerte.jaar}
          </Text>
        </View>

        <Text style={styles.intro}>
          Hierbij ontvangt u onze offerte voor de uitgevoerde onderhoudswerkzaamheden in de maand {offerte.maand} {offerte.jaar}.
          Alle werkzaamheden zijn uitgevoerd conform de overeengekomen kwaliteitsstandaarden.
          Reiskosten worden berekend vanuit Naaldwijk, Zuid-Holland.
        </Text>

        {/* Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNr]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colDatum]}>Datum</Text>
            <Text style={[styles.tableHeaderCell, styles.colProject]}>Project / Locatie</Text>
            <Text style={[styles.tableHeaderCell, styles.colDuur, { textAlign: 'right' }]}>Uren</Text>
            <Text style={[styles.tableHeaderCell, styles.colTarief, { textAlign: 'right' }]}>Tarief</Text>
            <Text style={[styles.tableHeaderCell, styles.colArbeid, { textAlign: 'right' }]}>Arbeid</Text>
            <Text style={[styles.tableHeaderCell, styles.colKm, { textAlign: 'right' }]}>KM (v/v)</Text>
            <Text style={[styles.tableHeaderCell, styles.colReisKm, { textAlign: 'right' }]}>Reis km</Text>
            <Text style={[styles.tableHeaderCell, styles.colReisUur, { textAlign: 'right' }]}>Reis uur</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotaal, { textAlign: 'right' }]}>Totaal</Text>
          </View>

          {/* Rows */}
          {offerte.klussen.map((klus, index) => (
            <View
              key={klus.id}
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <Text style={[styles.tableCell, styles.colNr, { color: '#999999' }]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <Text style={[styles.tableCell, styles.colDatum]}>{klus.datum}</Text>
              <View style={styles.colProject}>
                <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold', color: '#2D2D2D' }]}>
                  {klus.projectNaam.length > 38
                    ? klus.projectNaam.substring(0, 38) + '...'
                    : klus.projectNaam}
                </Text>
                <Text style={[styles.tableCell, { color: '#888888', fontSize: 7 }]}>
                  {klus.locatie} &bull; {klus.werkbonNummer}
                </Text>
              </View>
              <Text style={[styles.tableCell, styles.colDuur, styles.tableCellRight]}>
                {formatNL(klus.duur)}
              </Text>
              <Text style={[styles.tableCell, styles.colTarief, styles.tableCellRight]}>
                {formatEuro(klus.uurtarief)}
              </Text>
              <Text style={[styles.tableCell, styles.colArbeid, styles.tableCellRight]}>
                {formatEuro(klus.arbeidskosten)}
              </Text>
              <Text style={[styles.tableCell, styles.colKm, styles.tableCellRight]}>
                {formatNL(klus.afstandKm, 0)} km
              </Text>
              <Text style={[styles.tableCell, styles.colReisKm, styles.tableCellRight]}>
                {formatEuro(klus.reiskostenKm)}
              </Text>
              <Text style={[styles.tableCell, styles.colReisUur, styles.tableCellRight]}>
                {formatEuro(klus.reiskostenUur)}
              </Text>
              <Text style={[styles.tableCell, styles.colTotaal, styles.tableCellRight, { fontFamily: 'Helvetica-Bold' }]}>
                {formatEuro(klus.totaal)}
              </Text>
            </View>
          ))}
        </View>

        {/* Subtotals */}
        <View style={styles.subtotaalSection}>
          <View style={styles.subtotaalRow}>
            <Text style={styles.subtotaalLabel}>Subtotaal arbeidskosten</Text>
            <Text style={styles.subtotaalValue}>{formatEuro(offerte.subtotaalArbeid)}</Text>
          </View>
          <View style={styles.subtotaalRow}>
            <Text style={styles.subtotaalLabel}>Subtotaal reiskosten (km)</Text>
            <Text style={styles.subtotaalValue}>{formatEuro(offerte.subtotaalReisKm)}</Text>
          </View>
          <View style={styles.subtotaalRow}>
            <Text style={styles.subtotaalLabel}>Subtotaal reiskosten (uur)</Text>
            <Text style={styles.subtotaalValue}>{formatEuro(offerte.subtotaalReisUur)}</Text>
          </View>
          <View style={styles.totaalRow}>
            <Text style={styles.totaalLabel}>TOTAAL (excl. BTW)</Text>
            <Text style={styles.totaalValue}>{formatEuro(offerte.totaal)}</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Opmerkingen</Text>
          <Text style={styles.notesText}>
            - Reiskosten berekend vanuit Naaldwijk, Zuid-Holland (retour){'\n'}
            - Reiskosten km: €0,50 per km{'\n'}
            - Reiskosten uur: €55,00 per uur (retour){'\n'}
            - Alle bedragen exclusief 21% BTW{'\n'}
            - Betalingstermijn: 30 dagen na factuurdatum
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Van Winden Techniek | Naaldwijk | {offerteNummer}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} van ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
