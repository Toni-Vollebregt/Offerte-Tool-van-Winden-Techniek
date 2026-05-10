import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url') {
    return NextResponse.json([])
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('offertes')
      .select('*')
      .order('aangemaakt', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url') {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('offertes')
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
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
