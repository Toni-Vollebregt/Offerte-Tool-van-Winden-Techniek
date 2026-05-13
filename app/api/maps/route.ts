import { NextRequest, NextResponse } from 'next/server'
import { getAfstandEnTijd, getAfstandEnTijdVanNaar } from '@/lib/maps'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const locatie = searchParams.get('locatie')
  const origin = searchParams.get('origin') // optioneel, default = Naaldwijk

  if (!locatie) {
    return NextResponse.json({ error: 'locatie parameter required' }, { status: 400 })
  }

  try {
    const result = origin
      ? await getAfstandEnTijdVanNaar(origin, locatie)
      : await getAfstandEnTijd(locatie)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Maps API error:', error)
    return NextResponse.json({ km: 0, uren: 0 })
  }
}
