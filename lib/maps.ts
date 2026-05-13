import axios from 'axios'

const NAALDWIJK = 'Naaldwijk, Zuid-Holland, Nederland'
const GOOGLE_MAPS_BASE = 'https://maps.googleapis.com/maps/api/distancematrix/json'

export interface AfstandEnTijd {
  km: number    // one-way km
  uren: number  // one-way reistijd in uren
  error?: string // ingevuld als adres niet gevonden kon worden (niet bij ontbrekende API-key)
}

async function fetchAfstandEnTijd(origin: string, destination: string): Promise<AfstandEnTijd> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return { km: 0, uren: 0 }
  }

  try {
    const response = await axios.get(GOOGLE_MAPS_BASE, {
      params: {
        origins: origin,
        destinations: destination,
        mode: 'driving',
        language: 'nl',
        key: apiKey,
      },
      timeout: 10000,
    })

    const data = response.data

    if (data.status !== 'OK') {
      return { km: 0, uren: 0, error: `Maps-API fout (${data.status}) voor: "${destination}"` }
    }

    const element = data.rows?.[0]?.elements?.[0]

    if (!element || element.status !== 'OK') {
      return { km: 0, uren: 0, error: `Adres niet gevonden: "${destination}"` }
    }

    const kmOneWay = Math.round((element.distance.value / 1000) * 10) / 10
    const urenOneWay = Math.round((element.duration.value / 3600) * 100) / 100

    return { km: kmOneWay, uren: urenOneWay }
  } catch (error) {
    console.error('Error calling Google Maps API:', error)
    return { km: 0, uren: 0, error: `Netwerkfout bij opzoeken: "${destination}"` }
  }
}

/** Afstand en reistijd van Naaldwijk naar bestemming (one-way). */
export async function getAfstandEnTijd(bestemming: string): Promise<AfstandEnTijd> {
  return fetchAfstandEnTijd(NAALDWIJK, bestemming)
}

/** Afstand en reistijd van een willekeurige origin naar destination (one-way). */
export async function getAfstandEnTijdVanNaar(origin: string, destination: string): Promise<AfstandEnTijd> {
  return fetchAfstandEnTijd(origin, destination)
}
