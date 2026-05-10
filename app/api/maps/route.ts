import { NextRequest, NextResponse } from 'next/server'
import { getAfstandEnTijd } from '@/lib/maps'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const locatie = searchParams.get('locatie')

  if (!locatie) {
    return NextResponse.json({ error: 'locatie parameter required' }, { status: 400 })
  }

  try {
    const result = await getAfstandEnTijd(locatie)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Maps API error:', error)
    return NextResponse.json({ km: 0, uren: 0 })
  }
}
