import { NextRequest, NextResponse } from 'next/server'

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
  if (!supabase) return NextResponse.json([])

  try {
    const { data, error } = await supabase
      .from('facturen')
      .select('*')
      .order('aangemaakt', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Facturen GET error:', err)
    return NextResponse.json({ error: 'Ophalen mislukt.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase niet geconfigureerd.' }, { status: 503 })

  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from('facturen')
      .insert({
        maand: body.maand,
        jaar: body.jaar,
        totaal: body.totaal,
        data: body,
      })
      .select()

    if (error) throw error
    return NextResponse.json(data?.[0] || {})
  } catch (err) {
    console.error('Facturen POST error:', err)
    return NextResponse.json({ error: 'Opslaan mislukt.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID ontbreekt.' }, { status: 400 })

  const supabase = await getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase niet geconfigureerd.' }, { status: 503 })

  try {
    const { error } = await supabase
      .from('facturen')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Factuur DELETE error:', err)
    return NextResponse.json({ error: 'Verwijderen mislukt.' }, { status: 500 })
  }
}
