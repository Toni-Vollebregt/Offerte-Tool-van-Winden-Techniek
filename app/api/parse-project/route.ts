import { NextRequest, NextResponse } from 'next/server'
import { parseProjectPDF } from '@/lib/project-parser'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand opgegeven.' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Bestand moet een PDF zijn.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const klus = await parseProjectPDF(buffer)

    if (!klus.projectNaam && !klus.datum && !klus.duur) {
      return NextResponse.json(
        { error: 'Geen projectgegevens gevonden in PDF. Controleer het documentformaat.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ klus })
  } catch (error) {
    console.error('Project PDF parse error:', error)
    return NextResponse.json(
      { error: 'Fout bij verwerken van project PDF.' },
      { status: 500 }
    )
  }
}
