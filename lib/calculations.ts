import type { Klus } from '@/types'

const KM_TARIEF = 0.50
const REIS_UUR_TARIEF = 55
const FILEMARGE = 1.15

export function berekenKlus(
  klus: Partial<Klus>,
  afstandKm: number,
  reisUren: number,
  uurtarief: number
): Klus {
  const duur = klus.duur ?? 0
  const projectNaam = klus.projectNaam ?? ''
  const rivgToeslag = /ri-vg/i.test(projectNaam) ? 5 : 0
  const arbeidskosten = Math.round((duur * uurtarief + rivgToeslag) * 100) / 100
  const reiskostenKm = Math.round(afstandKm * KM_TARIEF * 100) / 100
  const reiskostenUur = Math.round(reisUren * 2 * REIS_UUR_TARIEF * FILEMARGE * 100) / 100
  const totaal = Math.round((arbeidskosten + reiskostenKm + reiskostenUur) * 100) / 100

  return {
    id: klus.id ?? crypto.randomUUID(),
    dag: klus.dag ?? '',
    datum: klus.datum ?? '',
    duur,
    projectNaam,
    locatie: klus.locatie ?? '',
    technicianName: klus.technicianName,
    projectCode: klus.projectCode ?? '',
    werkbonNummer: klus.werkbonNummer ?? '',
    werkzaamhedenOmschrijving: klus.werkzaamhedenOmschrijving ?? '',
    werkzaamhedenCodes: klus.werkzaamhedenCodes ?? [],
    uurtarief,
    arbeidskosten,
    rivgToeslag: rivgToeslag > 0 ? rivgToeslag : undefined,
    afstandKm,
    reiskostenKm,
    reisUren,
    reiskostenUur,
    totaal,
  }
}

export function berekenOfferteTotalen(klussen: Klus[]) {
  const subtotaalArbeid = Math.round(klussen.reduce((sum, k) => sum + k.arbeidskosten, 0) * 100) / 100
  const subtotaalReisKm = Math.round(klussen.reduce((sum, k) => sum + k.reiskostenKm, 0) * 100) / 100
  const subtotaalReisUur = Math.round(klussen.reduce((sum, k) => sum + k.reiskostenUur, 0) * 100) / 100
  const totaal = Math.round((subtotaalArbeid + subtotaalReisKm + subtotaalReisUur) * 100) / 100
  const btw = Math.round(totaal * 0.21 * 100) / 100
  const totaalInclBTW = Math.round(totaal * 1.21 * 100) / 100

  return { subtotaalArbeid, subtotaalReisKm, subtotaalReisUur, totaal, btw, totaalInclBTW }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export const KM_TARIEF_CONST = KM_TARIEF
export const REIS_UUR_TARIEF_CONST = REIS_UUR_TARIEF
