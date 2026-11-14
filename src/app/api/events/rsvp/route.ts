import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { romeToUtc } from '@/lib/events'

// POST /api/events/rsvp { eventId } - "Partecipo" / "Non partecipo più"
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const eventId = parseInt((await request.json()).eventId)
    const event = eventId ? await prisma.event.findUnique({ where: { id: eventId } }) : null
    if (!event) return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 })

    const existing = await prisma.eventRsvp.findUnique({ where: { eventId_userId: { eventId, userId: user!.id } } })
    if (existing) {
      await prisma.eventRsvp.deleteMany({ where: { eventId, userId: user!.id } })
    } else {
      const start = romeToUtc(event.date)
      if (start && start.getTime() < Date.now() - 3 * 3600 * 1000) return NextResponse.json({ error: 'Evento già concluso' }, { status: 400 })
      await prisma.eventRsvp.upsert({ where: { eventId_userId: { eventId, userId: user!.id } }, update: {}, create: { eventId, userId: user!.id } })
    }
    const going = await prisma.eventRsvp.count({ where: { eventId } })
    return NextResponse.json({ mine: !existing, going })
  } catch (e) {
    console.error('rsvp', e)
    return NextResponse.json({ error: 'Salvataggio non riuscito, riprova tra qualche secondo' }, { status: 500 })
  }
}
