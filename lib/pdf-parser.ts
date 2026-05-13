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
// Werkbon numbers always start with WO followed by digits
const WERKBON_RE = /WO\d+/

function extractWerkzaamhedenCodes(text: string): string[] {
  const codes: string[] = []
  let match
  const re = new RegExp(CODE_RE.source, 'g')
  while ((match = re.exec(text)) !== null) {
    if (!codes.includes(match[1])) codes.push(match[1])
  }
  return codes
}

function extractLocatie(projectTaak: string): string {
  let text = projectTaak.trim()
  // Strip leading prefix (PG, SG, PKG …)
  text = text.replace(LEADING_PREFIX_RE, '').trim()
  // Iteratively strip trailing codes and notes
  let prev = ''
  while (prev !== text) {
    prev = text
    // Strip trailing werkzaamheden codes: O-G, O-RGB, I-RB, RI-VG, RT350, REM
    text = text.replace(/\s+([A-Z]{1,4}-[A-Z0-9]{1,6}(?:\+[A-Z0-9/]+)?|REM|RT\d+)\s*$/, '').trim()
    // Strip trailing all-uppercase tokens that look like codes
    text = text.replace(/\s+[A-Z][A-Z0-9]{1,6}\s*$/, '').trim()
    // Strip trailing ExcelAir notes like "1x op afstand", "2x per jaar"
    text = text.replace(/\s+\d+x?\b.*$/, '').trim()
  }
  // Strip standalone building/area codes like A1, B2, C12 (e.g. "Van Dorp A1 Rotterdam" → "Van Dorp Rotterdam")
  // These codes confuse Google Maps into finding highway A1/A2/etc. instead of the actual city
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
    `^(${DAY_NAMES_PATTERN})(\\d{2}-\\d{2}-\\d{4})(\\d+[.,]\\d+)(.+?)(\\d{5,8}[A-Z0-9]+)([A-Z]{1,2}\\d+)(.*)$`,
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

export async function parsePDF(buffer: Buffer): Promise<Partial<Klus>[]> {
  // pdf-parse v1 — no worker, works in Vercel serverless
  // Import via lib path to avoid Next.js test-file resolution issues
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
  const data = await pdfParse(buffer)

  const klussen: Partial<Klus>[] = []
  for (const line of data.text.split('\n')) {
    const klus = parseLine(line)
    if (klus && klus.duur && klus.duur > 0) {
      if (!klussen.find(k => k.id === klus.id)) {
        klussen.push(klus)
      }
    }
  }
  return klussen
}

export { extractLocatie, extractWerkzaamhedenCodes }
