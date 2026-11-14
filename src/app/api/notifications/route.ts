import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser } from '@/lib/auth'

// GET /api/notifications            -> ultime 30 notifiche + numero di non lette
// GET /api/notifications?count=1    -> solo il numero di non lette (leggero, per la campanella)
export async function GET(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const unread = await prisma.notification.count({ where: { userId: user!.id, read: false } })
    if (new URL(request.url).searchParams.get('count')) return NextResponse.json({ unread })
    const items = await prisma.notification.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    return NextResponse.json({ unread, items })
  } catch {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

// PATCH /api/notifications  { id? } -> segna come letta una notifica, o tutte se manca id
export async function PATCH(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const body = await request.json().catch(() => ({}))
    const id = parseInt(body?.id)
    await prisma.notification.updateMany({
      where: { userId: user!.id, read: false, ...(id ? { id } : {}) },
      data: { read: true },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
