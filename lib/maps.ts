import axios from 'axios'

const NAALDWIJK = 'Naaldwijk, Zuid-Holland, Nederland'
const GOOGLE_MAPS_BASE = 'https://maps.googleapis.com/maps/api/distancematrix/json'
const GOOGLE_GEOCODING_BASE = 'https://maps.googleapis.com/maps/api/geocode/json'

export interface AfstandEnTijd {
  km: number    // one-way km
  uren: number  // one-way reistijd in uren
  error?: string // ingevuld als adres niet gevonden kon worden (niet bij ontbrekende API-key)
}

async function geocodeStad(query: string, apiKey: string): Promise<string | null> {
  try {
    const response = await axios.get(GOOGLE_GEOCODING_BASE, {
      params: { address: query, key: apiKey, language: 'nl' },
      timeout: 8000,
    })
    const result = response.data?.results?.[0]
    if (!result) return null
    const locality = result.address_components?.find(
      (c: { types: string[] }) => c.types.includes('locality')
    )
    return locality?.long_name ?? null
  } catch {
    return null
  }
}

async function fetchAfstandEnTijd(
  origin: string,
  destination: string,
  verwachtLocatie?: string
): Promise<AfstandEnTijd> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return { km: 0, uren: 0 }
  }

  try {
    const [distResponse, geocodedStad] = await Promise.all([
      axios.get(GOOGLE_MAPS_BASE, {
        params: {
          origins: origin,
          destinations: destination,
          mode: 'driving',
          language: 'nl',
          key: apiKey,
        },
        timeout: 10000,
      }),
      verwachtLocatie ? geocodeStad(destination, apiKey) : Promise.resolve(null),
    ])

    const data = distResponse.data

    if (data.status !== 'OK') {
      return { km: 0, uren: 0, error: `Maps-API fout (${data.status}) voor: "${destination}"` }
    }

    const element = data.rows?.[0]?.elements?.[0]

    if (!element || element.status !== 'OK') {
      return { km: 0, uren: 0, error: `Adres niet gevonden: "${destination}"` }
    }

    const kmOneWay = Math.round((element.distance.value / 1000) * 10) / 10
    const urenOneWay = Math.round((element.duration.value / 3600) * 100) / 100

    if (geocodedStad && verwachtLocatie) {
      const locLower = verwachtLocatie.toLowerCase()
      const stadLower = geocodedStad.toLowerCase()
      if (!locLower.includes(stadLower) && !stadLower.includes(locLower)) {
        return {
          km: kmOneWay,
          uren: urenOneWay,
          error: `Adres gevonden in ${geocodedStad}, maar verwacht in "${verwachtLocatie}". Controleer handmatig.`,
        }
      }
    }

    return { km: kmOneWay, uren: urenOneWay }
  } catch (error) {
    console.error('Error calling Google Maps API:', error)
    return { km: 0, uren: 0, error: `Netwerkfout bij opzoeken: "${destination}"` }
  }
}

/** Afstand en reistijd van Naaldwijk naar bestemming (one-way). */
export async function getAfstandEnTijd(bestemming: string, verwachtLocatie?: string): Promise<AfstandEnTijd> {
  return fetchAfstandEnTijd(NAALDWIJK, bestemming, verwachtLocatie)
}

/** Afstand en reistijd van een willekeurige origin naar destination (one-way). */
export async function getAfstandEnTijdVanNaar(origin: string, destination: string): Promise<AfstandEnTijd> {
  return fetchAfstandEnTijd(origin, destination)
}
