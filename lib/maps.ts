import axios from 'axios'

const ORIGIN = 'Naaldwijk, Zuid-Holland, Nederland'
const GOOGLE_MAPS_BASE = 'https://maps.googleapis.com/maps/api/distancematrix/json'

export interface AfstandEnTijd {
  km: number
  uren: number
}

export async function getAfstandEnTijd(bestemming: string): Promise<AfstandEnTijd> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY not configured, returning fallback distances')
    return { km: 0, uren: 0 }
  }

  try {
    const response = await axios.get(GOOGLE_MAPS_BASE, {
      params: {
        origins: ORIGIN,
        destinations: bestemming,
        mode: 'driving',
        language: 'nl',
        key: apiKey,
      },
      timeout: 10000,
    })

    const data = response.data

    if (data.status !== 'OK') {
      console.warn(`Maps API returned status: ${data.status}`)
      return { km: 0, uren: 0 }
    }

    const element = data.rows?.[0]?.elements?.[0]

    if (!element || element.status !== 'OK') {
      console.warn(`Maps element status: ${element?.status}`)
      return { km: 0, uren: 0 }
    }

    // Distance in meters, convert to km, round trip (x2)
    const distanceMeters = element.distance.value
    const kmOneWay = distanceMeters / 1000
    const kmRoundTrip = Math.round(kmOneWay * 2 * 10) / 10

    // Duration in seconds, convert to hours (one way)
    const durationSeconds = element.duration.value
    const urenOneWay = Math.round((durationSeconds / 3600) * 100) / 100

    return {
      km: kmRoundTrip,
      uren: urenOneWay,
    }
  } catch (error) {
    console.error('Error calling Google Maps API:', error)
    return { km: 0, uren: 0 }
  }
}
