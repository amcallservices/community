import { NextRequest, NextResponse } from 'next/server'
import { userFromBearer, unauthorized } from '@/lib/apitoken'

// BOOST AI lo usa per controllare la chiave quando l'utente collega la community.
export async function GET(req: NextRequest) {
  const u = await userFromBearer(req)
  if (!u) return unauthorized()
  return NextResponse.json({ id: u.id, name: `${u.nome || u.name || ''} ${u.cognome || ''}`.trim() })
}
