import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin, getSessionUser } from '@/lib/auth'
import { SITE_URL } from '@/lib/site'

export async function GET() {
  try {
    const events = await prisma.event.findMany({ orderBy: { date: 'asc' }, take: 50 })
    const me = await getSessionUser().catch(() => null)
    const rsvps = await prisma.eventRsvp.findMany({ where: { eventId: { in: events.map(e => e.id) } }, select: { eventId: true, userId: true } })
    return NextResponse.json(events.map(e => ({
      ...e,
      going: rsvps.filter(r => r.eventId === e.id).length,
      mine: !!me && rsvps.some(r => r.eventId === e.id && r.userId === me.id),
    })))
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user: admin, error: authError } = await requireAdmin()
  if (authError || !admin) return authError ?? NextResponse.json({ error: 'Accesso richiesto' }, { status: 401 })
  try {
    const body = await request.json()
    const { title, date, time, meetLink, description } = body
    
    const dateTime = time ? `${date} ${time}` : date
    
    const event = await prisma.event.create({
      data: { title, date: dateTime, meetLink: meetLink || null, description: typeof description === 'string' && description.trim() ? description.trim().slice(0, 2000) : null }
    })
    // Post automatico in community + notifica a tutti gli iscritti
    try {
      const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      const when = new Date(dateTime.replace(' ', 'T'))
      const label = isNaN(when.getTime()) ? dateTime : when.toLocaleString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })
      const url = `${SITE_URL}/eventi/${event.id}`
      const content = `\u{1F4C5} Nuovo evento: ${event.title}\n${label}${event.description ? `\n\n${event.description}` : ''}\n\n<a href="${esc(url)}">Partecipa e iscriviti all'evento</a>`
      await prisma.post.create({ data: { title: '', content, authorId: admin.id, category: 'generale' } })
      const users = await prisma.user.findMany({ where: { id: { not: admin.id } }, select: { id: true } })
      if (users.length) await prisma.notification.createMany({ data: users.map(u => ({ userId: u.id, type: 'event', title: 'Nuovo evento', message: `${event.title} \u2014 ${label}`, link: `/eventi/${event.id}` })) })
    } catch {}
    return NextResponse.json(event)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { error: authError } = await requireAdmin()
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    await prisma.eventRsvp.deleteMany({ where: { eventId: id } })
    await prisma.event.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
