import type { Klus } from '@/types'

const DAY_NAMES_PATTERN =
  'Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|' +
  'Maandag|Dinsdag|Woensdag|Donderdag|Vrijdag|Zaterdag|Zondag'

// Leading project-type prefix: PG, SG, PKG, PKG2, etc.
const LEADING_PREFIX_RE = /^[A-Z]{2,3}\d*\s+/

// Codes like O-G, O-RGB, I-RB, RI-VG, RT350, REM, O-VG+REINIGEN
const CODE_RE = /\b([A-Z]{1,4}-[A-Z0-9]{1,6}(?:\+[A-Z0-9/]+)?|REM|RT\d+)\b/g

// ExcelAir project codes: 7-8 alphanumeric chars ending in letter(s), e.g. 5133004S, 8163001S
const PROJECT_CODE_RE = /\d{5,8}[A-Z0-9]+/
// Werkbon numbers: any uppercase prefix followed by digits (WO, WS, WA, WB, ...)
const WERKBON_RE = /[A-Z]+\d+/

function extractWerkzaamhedenCodes(text: string): string[] {
  const codes: string[] = []
  let match
  const re = new RegExp(CODE_RE.source, 'g')
  while ((match = re.exec(text)) !== null) {
    if (!codes.includes(match[1])) codes.push(match[1])
  }
  return codes
}

/**
 * Volledige projectnaam zonder werkzaamheden-codes, geschikt als Google Maps zoekopdracht.
 * Houdt het leidende prefix (PKG, PG, …) en plaatsnamen intact.
 * ExcelAir-notatie "CODE/ volgend gebouw" wordt gestript als één patroon.
 */
export function extractMapsQuery(projectTaak: string): string {
  let text = projectTaak.trim()
  let prev = ''
  while (prev !== text) {
    prev = text
    // Strip trailing opmerkingen tussen haakjes, bijv. "(LPG detectie vervallen)"
    text = text.replace(/\s*\([^)]*\)\s*$/, '').trim()
    // Strip "CODE/ rest" — ExcelAir schrijft meerdere gebouwen als "RI-VG/ Gebouw B ..."
    // De "/" zit vast aan de code; alles daarna is een beschrijving van een ander gebouw
    text = text.replace(/\s+[A-Z]{1,4}-[A-Z0-9]{1,6}(?:\+[A-Z0-9/]+)?\/.*$/, '').trim()
    // Strip trailing werkzaamheden-codes: O-G, O-RGB, I-RB, RI-VG, RT350, REM
    text = text.replace(/\s+([A-Z]{1,4}-[A-Z0-9]{1,6}(?:\+[A-Z0-9/]+)?|REM|RT\d+)\s*$/, '').trim()
    // Strip trailing ExcelAir-notities zoals "1x op afstand", "2x per jaar" — x is verplicht
    text = text.replace(/\s+\d+x\b.*$/, '').trim()
    text = text.replace(/\s+op\s+afstand\s*$/i, '').trim()
  }
  return text
}

function extractLocatie(projectTaak: string): string {
  let text = projectTaak.trim()
  // Strip leading prefix (PG, SG, PKG …)
  text = text.replace(LEADING_PREFIX_RE, '').trim()
  let prev = ''
  while (prev !== text) {
    prev = text
    // Strip trailing opmerkingen tussen haakjes, bijv. "(LPG detectie vervallen)"
    text = text.replace(/\s*\([^)]*\)\s*$/, '').trim()
    // Strip "CODE/ rest" — zelfde patroon als extractMapsQuery
    text = text.replace(/\s+[A-Z]{1,4}-[A-Z0-9]{1,6}(?:\+[A-Z0-9/]+)?\/.*$/, '').trim()
    // Strip trailing werkzaamheden-codes
    text = text.replace(/\s+([A-Z]{1,4}-[A-Z0-9]{1,6}(?:\+[A-Z0-9/]+)?|REM|RT\d+)\s*$/, '').trim()
    // Strip trailing all-uppercase tokens die op codes lijken
    text = text.replace(/\s+[A-Z][A-Z0-9]{1,6}\s*$/, '').trim()
    // Strip trailing ExcelAir-notities zoals "1x op afstand", "2x per jaar" — x is verplicht
    text = text.replace(/\s+\d+x\b.*$/, '').trim()
  }
  // Strip standalone gebouwcodes zoals A1, B2 die Google Maps naar snelwegen sturen
  text = text.replace(/\b[A-Z]\d{1,2}\b/g, '').replace(/\s{2,}/g, ' ').trim()
  return text
}

function parseLine(line: string): Partial<Klus> | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  // pdf-parse v1 output: columns concatenated without separators
  // Format: DayNameDD-MM-YYYYN.NNProjectTaak<ProjectCode><WerkbonNr>Werkzaamheden
  // Example: Wednesday03-06-20268.00PG QPark Oostpoort Amsterdam5133004SWO251714Onderhoud O-G
  const dayRe = new RegExp(
    `^(${DAY_NAMES_PATTERN})(\\d{2}-\\d{2}-\\d{4})(\\d+[.,]\\d+)(.+?)(\\d{5,8}[A-Z0-9]+)([A-Z]+\\d+)(.*)$`,
    'i'
  )
  const m = trimmed.match(dayRe)
  if (!m) return null

  const dag = m[1]
  const datum = m[2]
  const duur = parseFloat(m[3].replace(',', '.'))
  const projectTaak = m[4].trim()
  const projectCode = m[5]
  const werkbonNummer = m[6]
  const werkzaamheden = m[7].trim()

  if (isNaN(duur) || duur <= 0) return null

  const locatie = extractLocatie(projectTaak)
  const mapsQuery = extractMapsQuery(projectTaak)
  const werkzaamhedenCodes = [
    ...new Set([
      ...extractWerkzaamhedenCodes(projectTaak),
      ...extractWerkzaamhedenCodes(werkzaamheden),
    ]),
  ]
  const projectNaam = projectTaak.replace(LEADING_PREFIX_RE, '').trim()

  return {
    id: `${datum}-${projectCode}-${werkbonNummer}`,
    dag,
    datum,
    duur,
    projectNaam,
    locatie,
    mapsQuery,
    projectCode,
    werkbonNummer,
    werkzaamhedenOmschrijving: werkzaamheden || projectTaak,
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

const KNOWN_HEADER_WORDS = /^(week|dag|datum|duur|project|taak|werkbon|werkzaamheden|maand|planning|naam|code|omschrijving|totaal|pagina|versie|datum|system|care|excelair)/i

function isLikelyTechnicianName(line: string): boolean {
  const text = line.trim()
  if (text.length < 5 || text.length > 45) return false
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]/.test(text)) return false
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s\-']+$/.test(text)) return false
  const words = text.split(/\s+/)
  if (words.length < 2) return false
  if (KNOWN_HEADER_WORDS.test(text)) return false
  return true
}

export async function parsePDF(buffer: Buffer): Promise<Partial<Klus>[]> {
  // pdf-parse v1 — no worker, works in Vercel serverless
  // Import via lib path to avoid Next.js test-file resolution issues
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
  const data = await pdfParse(buffer)

  const klussen: Partial<Klus>[] = []
  let currentTechnician: string | undefined = undefined

  for (const line of data.text.split('\n')) {
    const klus = parseLine(line)
    if (klus && klus.duur && klus.duur > 0) {
      if (!klussen.find(k => k.id === klus.id)) {
        klussen.push({ ...klus, technicianName: currentTechnician })
      }
    } else if (isLikelyTechnicianName(line)) {
      currentTechnician = line.trim()
    }
  }
  return klussen
}

export { extractLocatie, extractWerkzaamhedenCodes }
