import { NextRequest, NextResponse } from 'next/server'
import type { Tarief } from '@/types'

const DEFAULT_TARIEVEN: Tarief[] = [
  { id: '1', code: 'O-G', omschrijving: 'Onderhoud Garagedeuren', uurtarief: 60.00 },
  { id: '2', code: 'O-R', omschrijving: 'Onderhoud Roldeuren', uurtarief: 60.00 },
  { id: '3', code: 'O-B', omschrijving: 'Onderhoud Borstels', uurtarief: 67.00 },
  { id: '4', code: 'O-O', omschrijving: 'Onderhoud Overig', uurtarief: 65.00 },
  { id: '5', code: 'O-V', omschrijving: 'Onderhoud Vliegendeuren', uurtarief: 60.00 },
  { id: '6', code: 'O-VB', omschrijving: 'Onderhoud Vluchtbalken', uurtarief: 67.00 },
  { id: '7', code: 'O-VGB', omschrijving: 'Onderhoud VG Balken', uurtarief: 67.00 },
  { id: '8', code: 'O-RIVG', omschrijving: 'Onderhoud RI VG', uurtarief: 55.00 },
  { id: '9', code: 'O-VG', omschrijving: 'Onderhoud Veiligheidsgordijnen', uurtarief: 60.00 },
  { id: '10', code: 'O-VG+REINIGEN', omschrijving: 'Onderhoud VG + Reinigen', uurtarief: 60.00 },
  { id: '11', code: 'PAC/MOBIEL', omschrijving: 'ONDERHOUD PAC EN MOBIEL ABONNEMENT', uurtarief: 60.00 },
  { id: '12', code: 'O-ROLSCHERMEN', omschrijving: 'Onderhoud Rolschermen', uurtarief: 55.00 },
  { id: '13', code: 'O-BEHEER BMI/RWA', omschrijving: 'Onderhoud Beheer BMI/RWA', uurtarief: 65.00 },
  { id: '14', code: 'STORINGEN', omschrijving: 'Storingen Arbeidsuren', uurtarief: 60.00 },
]

export async function GET() {
  // Try Supabase first
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey && supabaseUrl !== 'your_supabase_url') {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data, error } = await supabase
        .from('tarieven')
        .select('*')
        .order('code')

      if (!error && data && data.length > 0) {
        return NextResponse.json(data)
      }
    } catch (err) {
      console.warn('Supabase not available, using defaults:', err)
    }
  }

  return NextResponse.json(DEFAULT_TARIEVEN)
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url') {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    if (!body.omschrijving?.trim()) {
      return NextResponse.json({ error: 'Omschrijving is verplicht.' }, { status: 400 })
    }
    // Auto-genereer code als niet meegegeven
    const baseCode = (body.omschrijving as string)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30)
    const code = body.code?.trim() || `${baseCode}-${Date.now().toString().slice(-4)}`

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('tarieven')
      .insert({ code, omschrijving: body.omschrijving, uurtarief: body.uurtarief })
      .select()

    if (error) {
      console.error('tarieven POST error:', error)
      return NextResponse.json({ error: 'Opslaan mislukt.' }, { status: 500 })
    }
    return NextResponse.json(data?.[0] ?? {})
  } catch (err) {
    console.error('tarieven POST error:', err)
    return NextResponse.json({ error: 'Onverwachte fout.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
      .from('tarieven')
      .update({ omschrijving: body.omschrijving, uurtarief: body.uurtarief })
      .eq('id', body.id)
      .select()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url') {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error } = await supabase.from('tarieven').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
