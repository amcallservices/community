import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin, getSessionUser } from '@/lib/auth'

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
  const { error: authError } = await requireAdmin()
  if (authError) return authError
  try {
    const body = await request.json()
    const { title, date, time, meetLink, description } = body
    
    const dateTime = time ? `${date} ${time}` : date
    
    const event = await prisma.event.create({
      data: { title, date: dateTime, meetLink: meetLink || null, description: typeof description === 'string' && description.trim() ? description.trim().slice(0, 2000) : null }
    })
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
