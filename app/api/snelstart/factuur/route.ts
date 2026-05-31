import { NextRequest } from 'next/server'
import { createSnelstartFactuur } from '@/lib/snelstart-factuur'
import type { Factuur } from '@/types'

export const dynamic = 'force-dynamic'

const MAAND_NUMMERS: Record<string, number> = {
  januari: 1, februari: 2, maart: 3, april: 4,
  mei: 5, juni: 6, juli: 7, augustus: 8,
  september: 9, oktober: 10, november: 11, december: 12,
}

function genereerFactuurnummer(factuur: Factuur): number {
  const maandNum = MAAND_NUMMERS[factuur.maand.toLowerCase()] ?? (new Date().getMonth() + 1)
  const rand = Math.floor(Math.random() * 900) + 100
  return factuur.jaar * 100000 + maandNum * 1000 + rand
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { factuur: Factuur }

    if (!body.factuur?.klussen?.length) {
      return Response.json({ error: 'Factuur bevat geen klussen.' }, { status: 400 })
    }

    const factuurnummer = genereerFactuurnummer(body.factuur)
    await createSnelstartFactuur(body.factuur, factuurnummer)

    return Response.json({ factuurnummer })
  } catch (err) {
    console.error('Snelstart factuur route error:', err)
    const message = err instanceof Error ? err.message : 'Onbekende fout.'
    return Response.json({ error: message }, { status: 500 })
  }
}
