import type { Klus } from '@/types'
import { extractWerkzaamhedenCodes } from '@/lib/pdf-parser'

const MONTH_MAP: Record<string, string> = {
  January: '01', February: '02', March: '03', April: '04',
  May: '05', June: '06', July: '07', August: '08',
  September: '09', October: '10', November: '11', December: '12',
}

function parseField(lines: string[], key: string): string {
  const normalizedKey = key.toLowerCase().replace(/\s+/g, ' ')
  for (const line of lines) {
    const normalized = line.toLowerCase().replace(/\s+/g, ' ')
    const keyIdx = normalized.indexOf(normalizedKey)
    if (keyIdx === -1) continue
    const colonIdx = line.indexOf(':', keyIdx + normalizedKey.length)
    if (colonIdx === -1) continue
    let value = line.slice(colonIdx + 1).trim()
    // Truncate at next " : " pattern (handles concatenated fields on one line)
    const nextFieldIdx = value.indexOf(' : ')
    if (nextFieldIdx > 0) value = value.slice(0, nextFieldIdx).trim()
    return value
  }
  return ''
}

function parseDatum(datumStr: string): { dag: string; datum: string } {
  // Format: "Monday 18 May 2026"
  const parts = datumStr.trim().split(/\s+/)
  if (parts.length < 4) return { dag: '', datum: '' }
  const [dag, day, monthName, year] = parts
  const month = MONTH_MAP[monthName] ?? '01'
  const datum = `${String(day).padStart(2, '0')}-${month}-${year}`
  return { dag, datum }
}

export async function parseProjectPDF(buffer: Buffer): Promise<Partial<Klus>> {
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
  const data = await pdfParse(buffer)

  const lines: string[] = data.text.split('\n').map((l: string) => l.trim()).filter(Boolean)

  // Title: last non-empty line before "PROJECTINFORMATIE"
  let title = ''
  for (const line of lines) {
    if (/PROJECTINFORMATIE/i.test(line)) break
    title = line
  }

  const projectNaam = parseField(lines, 'Projectnaam')
  const projectCodeRaw = parseField(lines, 'Projectcode')
  const adres = parseField(lines, 'Adres')
  const postcodePlaats = parseField(lines, 'Postcode + plaats')
  const datumOnderhoud = parseField(lines, 'Datum onderhoud')
  const geplandeDuurStr = parseField(lines, 'Geplande duur')

  const duurMatch = geplandeDuurStr.match(/\d+[.,]\d+|\d+/)
  const duur = duurMatch ? parseFloat(duurMatch[0].replace(',', '.')) : 0

  const codeParts = projectCodeRaw.trim().split(/\s+/)
  const projectCode = codeParts[0] ?? ''
  const werkbonNummer = codeParts[1] ?? ''

  const { dag, datum } = parseDatum(datumOnderhoud)

  const mapsQuery = adres && postcodePlaats
    ? `${adres}, ${postcodePlaats}`
    : (projectNaam || title)

  const locatie = projectNaam || title

  // Extract werkzaamheden text between WERKZAAMHEDEN and GEBRUIKTE MATERIALEN
  let inWerkzaamheden = false
  const werkzaamhedenLines: string[] = []
  for (const line of lines) {
    if (/^WERKZAAMHEDEN$/i.test(line)) { inWerkzaamheden = true; continue }
    if (/^GEBRUIKTE MATERIALEN$/i.test(line)) break
    if (inWerkzaamheden && line) werkzaamhedenLines.push(line)
  }
  const werkzaamhedenOmschrijving = werkzaamhedenLines
    .filter(l => !/^(OHD\b|4\/8\b|\d+\/\d+\b)/i.test(l))
    .slice(0, 3)
    .join('; ')
    .trim() || title

  const werkzaamhedenCodes = extractWerkzaamhedenCodes(title)

  return {
    id: datum && projectCode && werkbonNummer
      ? `${datum}-${projectCode}-${werkbonNummer}`
      : crypto.randomUUID(),
    dag,
    datum,
    duur: isNaN(duur) ? 0 : duur,
    projectNaam: projectNaam || title,
    locatie,
    mapsQuery,
    projectCode,
    werkbonNummer,
    werkzaamhedenOmschrijving,
    werkzaamhedenCodes,
    uurtarief: 0,
    arbeidskosten: 0,
    afstandKm: 0,
    reiskostenKm: 0,
    reisUren: 0,
    reiskostenUur: 0,
    totaal: 0,
  }
}
