import type { Klus, Rit } from '@/types'

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
  const rivgToeslag = /ri-vg/i.test(klus.werkzaamhedenOmschrijving ?? '') ? 5 : 0
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

// Berekent één reisrit (één richting). Geen * 2 factor — elke rit is een eigen segment.
export function berekenRit(
  datum: string,
  van: string,
  naar: string,
  afstandKm: number,
  reisUren: number,
  technicianName?: string,
  locatieError?: string
): Rit {
  const reiskostenKm = Math.round(afstandKm * KM_TARIEF * 100) / 100
  const reiskostenUur = Math.round(reisUren * REIS_UUR_TARIEF * FILEMARGE * 100) / 100
  return {
    id: crypto.randomUUID(),
    datum,
    technicianName,
    van,
    naar,
    afstandKm,
    reisUren,
    reiskostenKm,
    reiskostenUur,
    totaal: Math.round((reiskostenKm + reiskostenUur) * 100) / 100,
    locatieError,
  }
}

// Backward compatible: als rits leeg is, worden reiskosten uit klussen gelezen (offerte flow).
export function berekenOfferteTotalen(klussen: Klus[], rits: Rit[] = []) {
  const subtotaalArbeid = Math.round(klussen.reduce((s, k) => s + k.arbeidskosten, 0) * 100) / 100
  const subtotaalReisKm = rits.length > 0
    ? Math.round(rits.reduce((s, r) => s + r.reiskostenKm, 0) * 100) / 100
    : Math.round(klussen.reduce((s, k) => s + k.reiskostenKm, 0) * 100) / 100
  const subtotaalReisUur = rits.length > 0
    ? Math.round(rits.reduce((s, r) => s + r.reiskostenUur, 0) * 100) / 100
    : Math.round(klussen.reduce((s, k) => s + k.reiskostenUur, 0) * 100) / 100
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
