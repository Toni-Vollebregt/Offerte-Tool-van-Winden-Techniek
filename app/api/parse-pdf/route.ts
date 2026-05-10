import { NextRequest, NextResponse } from 'next/server'
import { parsePDF } from '@/lib/pdf-parser'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const klussen = await parsePDF(buffer)

    if (klussen.length === 0) {
      return NextResponse.json(
        { error: 'No planning data found in PDF. Check the PDF format.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ klussen, count: klussen.length })
  } catch (error) {
    console.error('PDF parse error:', error)
    return NextResponse.json(
      { error: 'Failed to parse PDF', details: String(error) },
      { status: 500 }
    )
  }
}
