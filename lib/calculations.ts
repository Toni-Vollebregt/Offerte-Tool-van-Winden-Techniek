import type { Klus } from '@/types'

const KM_TARIEF = 0.50
const REIS_UUR_TARIEF = 55

export function berekenKlus(
  klus: Partial<Klus>,
  afstandKm: number,
  reisUren: number,
  uurtarief: number
): Klus {
  const duur = klus.duur ?? 0
  const arbeidskosten = Math.round(duur * uurtarief * 100) / 100
  const reiskostenKm = Math.round(afstandKm * KM_TARIEF * 100) / 100
  // Round trip for travel hours as well
  const reiskostenUur = Math.round(reisUren * 2 * REIS_UUR_TARIEF * 100) / 100
  const totaal = Math.round((arbeidskosten + reiskostenKm + reiskostenUur) * 100) / 100

  return {
    id: klus.id ?? crypto.randomUUID(),
    dag: klus.dag ?? '',
    datum: klus.datum ?? '',
    duur,
    projectNaam: klus.projectNaam ?? '',
    locatie: klus.locatie ?? '',
    projectCode: klus.projectCode ?? '',
    werkbonNummer: klus.werkbonNummer ?? '',
    werkzaamhedenOmschrijving: klus.werkzaamhedenOmschrijving ?? '',
    werkzaamhedenCodes: klus.werkzaamhedenCodes ?? [],
    uurtarief,
    arbeidskosten,
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

  return { subtotaalArbeid, subtotaalReisKm, subtotaalReisUur, totaal }
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
