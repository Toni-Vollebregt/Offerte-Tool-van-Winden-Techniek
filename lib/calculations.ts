import type { Klus, Rit, ExtraRegel } from '@/types'

export const KM_TARIEF_DEFAULT = 0.50
export const REIS_UUR_TARIEF_DEFAULT = 55
export const FILEMARGE_DEFAULT = 1.15

export interface ReisRates {
  kmTarief: number
  reisUurTarief: number
  filemarge: number
}

export function parseReisRates(raw: Record<string, string>): ReisRates {
  return {
    kmTarief: parseFloat(raw.km_tarief ?? '') || KM_TARIEF_DEFAULT,
    reisUurTarief: parseFloat(raw.reis_uur_tarief ?? '') || REIS_UUR_TARIEF_DEFAULT,
    filemarge: parseFloat(raw.filemarge ?? '') || FILEMARGE_DEFAULT,
  }
}

export function berekenKlus(
  klus: Partial<Klus>,
  afstandKm: number,
  reisUren: number,
  uurtarief: number,
  rates: Partial<ReisRates> = {}
): Klus {
  const kmTarief = rates.kmTarief ?? KM_TARIEF_DEFAULT
  const reisUurTarief = rates.reisUurTarief ?? REIS_UUR_TARIEF_DEFAULT
  const filemarge = rates.filemarge ?? FILEMARGE_DEFAULT
  const duur = klus.duur ?? 0
  const projectNaam = klus.projectNaam ?? ''
  const rivgToeslag = /ri-vg/i.test(klus.werkzaamhedenOmschrijving ?? '') ? 5 : 0
  const arbeidskosten = Math.round((duur * uurtarief + rivgToeslag) * 100) / 100
  const reiskostenKm = Math.round(afstandKm * kmTarief * 100) / 100
  const reiskostenUur = Math.round(reisUren * 2 * reisUurTarief * filemarge * 100) / 100
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

// Berekent één reisrit (één richting).
export function berekenRit(
  datum: string,
  van: string,
  naar: string,
  afstandKm: number,
  reisUren: number,
  technicianName?: string,
  locatieError?: string,
  rates: Partial<ReisRates> = {}
): Rit {
  const kmTarief = rates.kmTarief ?? KM_TARIEF_DEFAULT
  const reisUurTarief = rates.reisUurTarief ?? REIS_UUR_TARIEF_DEFAULT
  const filemarge = rates.filemarge ?? FILEMARGE_DEFAULT
  const reiskostenKm = Math.round(afstandKm * kmTarief * 100) / 100
  const reiskostenUur = Math.round(reisUren * reisUurTarief * filemarge * 100) / 100
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
export function berekenOfferteTotalen(
  klussen: Klus[],
  rits: Rit[] = [],
  extraRegels: ExtraRegel[] = []
) {
  const subtotaalArbeid = Math.round(klussen.reduce((s, k) => s + k.arbeidskosten, 0) * 100) / 100
  const subtotaalReisKm = rits.length > 0
    ? Math.round(rits.reduce((s, r) => s + r.reiskostenKm, 0) * 100) / 100
    : Math.round(klussen.reduce((s, k) => s + k.reiskostenKm, 0) * 100) / 100
  const subtotaalReisUur = rits.length > 0
    ? Math.round(rits.reduce((s, r) => s + r.reiskostenUur, 0) * 100) / 100
    : Math.round(klussen.reduce((s, k) => s + k.reiskostenUur, 0) * 100) / 100
  const subtotaalExtra = Math.round(extraRegels.reduce((s, r) => s + r.totaal, 0) * 100) / 100
  const totaal = Math.round((subtotaalArbeid + subtotaalReisKm + subtotaalReisUur + subtotaalExtra) * 100) / 100
  const btw = Math.round(totaal * 0.21 * 100) / 100
  const totaalInclBTW = Math.round(totaal * 1.21 * 100) / 100
  return { subtotaalArbeid, subtotaalReisKm, subtotaalReisUur, subtotaalExtra, totaal, btw, totaalInclBTW }
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

// Deprecated aliases — nog aanwezig voor backwards compat
export const KM_TARIEF_CONST = KM_TARIEF_DEFAULT
export const REIS_UUR_TARIEF_CONST = REIS_UUR_TARIEF_DEFAULT
