import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

function checkAuth(req: NextRequest): Response | null {
  const origin = req.headers.get('origin')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (appUrl && origin !== appUrl) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function POST(req: NextRequest) {
  const authError = checkAuth(req)
  if (authError) return authError

  return Response.json({ error: 'Not implemented' }, { status: 501 })
}
