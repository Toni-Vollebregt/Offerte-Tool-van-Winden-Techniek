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
  arbeidskosten: number // duur * uurtarief
  afstandKm: number // round trip from Naaldwijk
  reiskostenKm: number // afstandKm * 0.50
  reisUren: number // travel time hours
  reiskostenUur: number // reisUren * 55
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
  aangemaakt?: string
}

export interface Tarief {
  id: string
  code: string
  omschrijving: string
  uurtarief: number
}
