import type { Offerte } from '@/types'

const AUTH_URL = 'https://auth.snelstart.nl/b2b/token'
const API_BASE = 'https://b2bapi.snelstart.nl/v2'

async function getAccessToken(): Promise<string> {
  const connectionKey = process.env.SNELSTART_CONNECTION_KEY
  const subscriptionKey = process.env.SNELSTART_SUBSCRIPTION_KEY

  if (!connectionKey || !subscriptionKey) {
    throw new Error('Snelstart API keys niet geconfigureerd.')
  }

  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
    body: JSON.stringify({ clientKey: connectionKey }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error('Snelstart auth error:', body)
    throw new Error('Snelstart authenticatie mislukt.')
  }

  const data = await response.json()
  return data.access_token as string
}

export async function createSnelstartOfferte(
  offerte: Offerte,
  offertenummer: number,
): Promise<{ nummer: number; id: string }> {
  const subscriptionKey = process.env.SNELSTART_SUBSCRIPTION_KEY
  const relatieId = process.env.SNELSTART_RELATIE_ID

  if (!relatieId) throw new Error('Snelstart relatie ID niet geconfigureerd.')

  const token = await getAccessToken()

  const datum = new Date().toISOString().split('T')[0]

  const regels = offerte.klussen.map(klus => ({
    omschrijving: `${klus.projectNaam} – ${klus.datum}`.slice(0, 250),
    aantal: 1,
    stuksprijs: klus.totaal,
    btwcode: 'Hoog',
  }))

  const body = {
    relatie: { id: relatieId },
    nummer: offertenummer,
    datum,
    verkooporderBtwIngaveModel: 'Exclusief',
    regels,
  }

  const response = await fetch(`${API_BASE}/offertes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': subscriptionKey!,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Snelstart offerte error:', err)
    throw new Error('Aanmaken offerte in Snelstart mislukt.')
  }

  return response.json()
}
