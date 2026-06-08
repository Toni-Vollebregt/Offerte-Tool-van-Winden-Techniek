import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const DEFAULTS = {
  km_tarief: '0.50',
  reis_uur_tarief: '55',
  filemarge: '1.15',
}

async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url === 'your_supabase_url') return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key)
}

export async function GET() {
  const supabase = await getSupabase()
  if (supabase) {
    try {
      const { data, error } = await supabase.from('instellingen').select('key, value')
      if (!error && data && data.length > 0) {
        const result: Record<string, string> = { ...DEFAULTS }
        for (const row of data) result[row.key] = row.value
        return Response.json(result)
      }
    } catch {
      // fall through to defaults
    }
  }
  return Response.json(DEFAULTS)
}

export async function PUT(req: NextRequest) {
  const supabase = await getSupabase()
  if (!supabase) return Response.json({ error: 'Supabase niet geconfigureerd.' }, { status: 503 })

  try {
    const body = await req.json() as { key: string; value: string }
    if (!body.key || body.value === undefined) {
      return Response.json({ error: 'key en value zijn verplicht.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('instellingen')
      .upsert({ key: body.key, value: String(body.value) }, { onConflict: 'key' })

    if (error) {
      console.error('instellingen PUT error:', error)
      return Response.json({ error: 'Opslaan mislukt.' }, { status: 500 })
    }
    return Response.json({ success: true })
  } catch (err) {
    console.error('instellingen PUT error:', err)
    return Response.json({ error: 'Onverwachte fout.' }, { status: 500 })
  }
}
