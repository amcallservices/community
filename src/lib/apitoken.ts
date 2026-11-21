import { createHash, randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// Chiavi personali per pubblicare da servizi esterni (es. BOOST AI) a nome dell'utente.
// Si salva solo l'impronta (hash): la chiave in chiaro si vede una volta sola, alla creazione.
export const TOKEN_PREFIX = 'spi_'
export const hashApiToken = (t: string) => createHash('sha256').update(t).digest('hex')
export function newApiToken() {
  const token = TOKEN_PREFIX + randomBytes(32).toString('hex')
  return { token, tokenHash: hashApiToken(token) }
}

// Utente a cui appartiene la chiave "Authorization: Bearer spi_…" (null se manca o non vale).
export async function userFromBearer(req: NextRequest) {
  const h = req.headers.get('authorization') || ''
  const m = /^Bearer\s+(spi_[a-f0-9]{64})$/i.exec(h.trim())
  if (!m) return null
  const tok = await prisma.apiToken.findUnique({ where: { tokenHash: hashApiToken(m[1].toLowerCase()) } })
  if (!tok) return null
  const user = await prisma.user.findUnique({ where: { id: tok.userId } })
  if (!user || user.banned) return null
  prisma.apiToken.update({ where: { id: tok.id }, data: { lastUsedAt: new Date() } }).catch(() => {})
  return user
}

export const unauthorized = () => NextResponse.json({ error: 'Chiave non valida o revocata' }, { status: 401 })
