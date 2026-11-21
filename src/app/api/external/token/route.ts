import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { newApiToken } from '@/lib/apitoken'

// Gestione della propria chiave per BOOST AI (solo da utente connesso nel sito).
export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  const t = await prisma.apiToken.findFirst({ where: { userId: user!.id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true, lastUsedAt: true } })
  return NextResponse.json({ active: !!t, createdAt: t?.createdAt ?? null, lastUsedAt: t?.lastUsedAt ?? null })
}

// Crea una nuova chiave (sostituisce quella precedente) e la mostra una sola volta.
export async function POST() {
  const { user, error } = await requireUser()
  if (error) return error
  const { token, tokenHash } = newApiToken()
  await prisma.$transaction([
    prisma.apiToken.deleteMany({ where: { userId: user!.id } }),
    prisma.apiToken.create({ data: { userId: user!.id, tokenHash } }),
  ])
  return NextResponse.json({ token })
}

export async function DELETE() {
  const { user, error } = await requireUser()
  if (error) return error
  await prisma.apiToken.deleteMany({ where: { userId: user!.id } })
  return NextResponse.json({ ok: true })
}
