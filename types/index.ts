export interface ExtraRegel {
  id: string
  datum: string          // DD-MM-YYYY
  technicianName?: string
  omschrijving: string
  prijs: number          // excl. BTW per stuk
  aantal: number
  totaal: number         // prijs * aantal
}

export interface Rit {
  id: string
  datum: string         // DD-MM-YYYY
  technicianName?: string
  van: string           // 'Naaldwijk' of locatie
  naar: string          // locatie of 'Naaldwijk'
  afstandKm: number     // one-way km voor dit segment
  reisUren: number      // one-way reistijd in uren
  reiskostenKm: number  // afstandKm * 0.50
  reiskostenUur: number // reisUren * 55 * 1.15
  totaal: number
  locatieError?: string
}

export interface Klus {
  id: string
  dag: string
  datum: string // DD-MM-YYYY
  duur: number // hours
  projectNaam: string
  locatie: string // extracted city/address
  projectCode: string // e.g. 5133004S
  werkbonNummer: string // e.g. WO251714
  werkzaamhedenOmschrijving: string
  werkzaamhedenCodes: string[] // parsed codes like ['O-G']
  uurtarief: number
  arbeidskosten: number // duur * uurtarief (+ rivgToeslag indien van toepassing)
  rivgToeslag?: number // €5 toeslag wanneer projectNaam "RI-VG" bevat
  technicianName?: string // naam van de technicus (uit PDF header)
  mapsQuery?: string  // volledige projectnaam (zonder codes) voor Google Maps zoekopdracht
  mapsError?: string  // foutmelding als Google Maps het adres niet kon vinden
  afstandKm: number // allocated km (heen + terug, smart-berekend per dag)
  reiskostenKm: number // afstandKm * 0.50
  reisUren: number // allocated reistijd / 2 (formula doubles for cost)
  reiskostenUur: number // reisUren * 2 * 55 * 1.15
  totaal: number
}

export interface Offerte {
  id?: string
  maand: string
  jaar: number
  klussen: Klus[]
  subtotaalArbeid: number
  subtotaalReisKm: number
  subtotaalReisUur: number
  totaal: number
  btw: number
  totaalInclBTW: number
  aangemaakt?: string
}

export interface Factuur {
  id?: string
  weekNummer: number
  jaar: number
  klussen: Klus[]
  rits?: Rit[]
  extraRegels?: ExtraRegel[]
  subtotaalArbeid: number
  subtotaalReisKm: number
  subtotaalReisUur: number
  subtotaalExtra?: number
  totaal: number
  btw: number
  totaalInclBTW: number
  aangemaakt?: string
}

export interface Tarief {
  id: string
  code?: string
  omschrijving: string
  uurtarief: number
}
