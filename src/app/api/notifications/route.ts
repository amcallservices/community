import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { romeToUtc } from '@/lib/events'

// Promemoria degli eventi a cui l'utente partecipa: 24 ore prima e 1 ora prima.
// Si generano quando l'utente apre il sito (al massimo una volta al minuto per persona).
const lastReminderRun = new Map<number, number>()
async function eventReminders(userId: number) {
  const now = Date.now()
  if ((lastReminderRun.get(userId) || 0) > now - 60_000) return
  lastReminderRun.set(userId, now)
  const rsvps = await prisma.eventRsvp.findMany({ where: { userId }, select: { eventId: true } })
  if (!rsvps.length) return
  const events = await prisma.event.findMany({ where: { id: { in: rsvps.map(r => r.eventId) } } })
  for (const e of events) {
    const start = romeToUtc(e.date)
    if (!start) continue
    const diff = start.getTime() - now
    if (diff <= 0 || diff > 24 * 3600 * 1000) continue
    const hhmm = start.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
    const soon = diff <= 65 * 60 * 1000
    const message = soon ? `Promemoria: "${e.title}" inizia tra meno di un'ora (alle ${hhmm})` : `Promemoria: "${e.title}" \u00e8 in programma nelle prossime 24 ore, alle ${hhmm}`
    const exists = await prisma.notification.findFirst({ where: { userId, type: 'event', message } })
    if (!exists) await prisma.notification.create({ data: { userId, type: 'event', title: 'Promemoria evento', message, link: '/eventi' } })
  }
}

// GET /api/notifications            -> ultime 30 notifiche + numero di non lette
// GET /api/notifications?count=1    -> solo il numero di non lette (leggero, per la campanella)
export async function GET(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    await eventReminders(user!.id).catch(() => {})
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
