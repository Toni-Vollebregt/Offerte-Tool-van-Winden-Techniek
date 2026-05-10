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
  return text
}

function parseLine(line: string): Partial<Klus> | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  // Must start with a recognised day name
  const dayRe = new RegExp(
    `^(${DAY_NAMES_PATTERN})\\s+(\\d{2}-\\d{2}-\\d{4})\\s+(\\d+[.,]\\d+)\\s+(.+)$`,
    'i'
  )
  const dayMatch = trimmed.match(dayRe)
  if (!dayMatch) return null

  const dag = dayMatch[1]
  const datum = dayMatch[2]
  const duur = parseFloat(dayMatch[3].replace(',', '.'))
  const rest = dayMatch[4]

  if (isNaN(duur) || duur <= 0) return null

  let projectTaak: string
  let werkbonRest: string

  // Strategy 1: tab character separates Project/Taak from Project/Werkbon
  const tabIdx = rest.indexOf('\t')
  if (tabIdx !== -1) {
    projectTaak = rest.substring(0, tabIdx).trim()
    werkbonRest = rest.substring(tabIdx + 1).trim()
  } else {
    // Strategy 2: find the ExcelAir project code (e.g. 5144004S) followed by WO number
    // Use a non-greedy match to capture everything before the project code
    const splitRe = /^(.*?)\s+(\d{5,8}[A-Z0-9]+\s+WO\d+.*)$/
    const splitMatch = rest.match(splitRe)
    if (!splitMatch) return null
    projectTaak = splitMatch[1].trim()
    werkbonRest = splitMatch[2].trim()
  }

  // Parse "ProjectCode WerkbonNr Werkzaamheden description"
  const wbMatch = werkbonRest.match(/^(\S+)\s+(\S+)\s*(.*)$/)
  const projectCode = wbMatch ? wbMatch[1] : ''
  const werkbonNummer = wbMatch ? wbMatch[2] : ''
  const werkzaamheden = wbMatch ? wbMatch[3].trim() : ''

  // Validate that werkbon looks right
  if (werkbonNummer && !WERKBON_RE.test(werkbonNummer)) return null

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
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()

  const klussen: Partial<Klus>[] = []
  for (const line of result.text.split('\n')) {
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
