import { NextRequest } from 'next/server'
import { createSnelstartFactuur } from '@/lib/snelstart-factuur'
import type { Factuur } from '@/types'

export const dynamic = 'force-dynamic'

function genereerFactuurnummer(factuur: Factuur): number {
  const rand = Math.floor(Math.random() * 900) + 100
  return factuur.jaar * 100000 + (factuur.weekNummer ?? 1) * 1000 + rand
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
