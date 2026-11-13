import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin, newResetToken } from '@/lib/auth'

// Solo admin: genera un link di recupero da mandare a mano a un utente (WhatsApp, Telegram, ecc.)
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error
  const { userId } = await request.json()
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } })
  if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
  const { token, tokenHash } = newResetToken()
  await prisma.passwordReset.create({ data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } })
  const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
  return NextResponse.json({ link: `${base}/reset-password?token=${token}`, validFor: '24 ore' })
}
