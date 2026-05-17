import { NextRequest } from 'next/server'
import { createSnelstartOfferte } from '@/lib/snelstart'
import type { Offerte } from '@/types'

export const dynamic = 'force-dynamic'

const MAAND_NUMMERS: Record<string, number> = {
  januari: 1, februari: 2, maart: 3, april: 4,
  mei: 5, juni: 6, juli: 7, augustus: 8,
  september: 9, oktober: 10, november: 11, december: 12,
}

function genereerOffertenummer(offerte: Offerte): number {
  const maandNum = MAAND_NUMMERS[offerte.maand.toLowerCase()] ?? (new Date().getMonth() + 1)
  const rand = Math.floor(Math.random() * 900) + 100
  // Format: JJJJMMRRR — e.g. 202610042 for oktober 2026
  return offerte.jaar * 100000 + maandNum * 1000 + rand
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { offerte: Offerte }

    if (!body.offerte?.klussen?.length) {
      return Response.json({ error: 'Offerte bevat geen klussen.' }, { status: 400 })
    }

    const offertenummer = genereerOffertenummer(body.offerte)
    await createSnelstartOfferte(body.offerte, offertenummer)

    return Response.json({ offertenummer })
  } catch (err) {
    console.error('Snelstart route error:', err)
    const message = err instanceof Error ? err.message : 'Onbekende fout.'
    return Response.json({ error: message }, { status: 500 })
  }
}
