import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

async function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url') return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(supabaseUrl, supabaseKey)
}

export async function GET() {
  const supabase = await getSupabase()
  if (!supabase) return Response.json([])

  try {
    const { data, error } = await supabase
      .from('medewerkers')
      .select('*')
      .order('naam', { ascending: true })

    if (error) throw error
    return Response.json(data ?? [])
  } catch (err) {
    console.error('Medewerkers GET error:', err)
    return Response.json({ error: 'Ophalen mislukt.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabase()
  if (!supabase) return Response.json({ error: 'Supabase niet geconfigureerd.' }, { status: 503 })

  try {
    const body = await req.json() as { naam: string; km_tarief?: number; reis_uur_tarief?: number; filemarge?: number }

    if (!body.naam?.trim()) {
      return Response.json({ error: 'Naam is verplicht.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('medewerkers')
      .insert({
        naam: body.naam.trim(),
        km_tarief: body.km_tarief ?? 0.50,
        reis_uur_tarief: body.reis_uur_tarief ?? 55,
        filemarge: body.filemarge ?? 1.15,
      })
      .select()
      .single()

    if (error) {
      console.error('Medewerker insert error:', error)
      return Response.json({ error: 'Aanmaken mislukt.' }, { status: 500 })
    }

    return Response.json(data)
  } catch (err) {
    console.error('Medewerkers POST error:', err)
    return Response.json({ error: 'Onverwachte fout.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const supabase = await getSupabase()
  if (!supabase) return Response.json({ error: 'Supabase niet geconfigureerd.' }, { status: 503 })

  try {
    const body = await req.json() as { id: string; naam?: string; km_tarief?: number; reis_uur_tarief?: number; filemarge?: number; actief?: boolean }

    if (!body.id) {
      return Response.json({ error: 'ID ontbreekt.' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (body.naam !== undefined) updates.naam = body.naam.trim()
    if (body.km_tarief !== undefined) updates.km_tarief = body.km_tarief
    if (body.reis_uur_tarief !== undefined) updates.reis_uur_tarief = body.reis_uur_tarief
    if (body.filemarge !== undefined) updates.filemarge = body.filemarge
    if (body.actief !== undefined) updates.actief = body.actief

    const { data, error } = await supabase
      .from('medewerkers')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('Medewerker update error:', error)
      return Response.json({ error: 'Bijwerken mislukt.' }, { status: 500 })
    }

    return Response.json(data)
  } catch (err) {
    console.error('Medewerkers PUT error:', err)
    return Response.json({ error: 'Onverwachte fout.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (!id) return Response.json({ error: 'ID ontbreekt.' }, { status: 400 })

  const supabase = await getSupabase()
  if (!supabase) return Response.json({ error: 'Supabase niet geconfigureerd.' }, { status: 503 })

  try {
    const { error } = await supabase
      .from('medewerkers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Medewerker delete error:', error)
      return Response.json({ error: 'Verwijderen mislukt.' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('Medewerkers DELETE error:', err)
    return Response.json({ error: 'Onverwachte fout.' }, { status: 500 })
  }
}
