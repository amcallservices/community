import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// POST /api/users/suspend { userId, hours: 24 | 48 | 0 }  (0 = revoca la sospensione)
export async function POST(request: NextRequest) {
  const { user: admin, error } = await requireAdmin()
  if (error) return error
  try {
    const { userId, hours } = await request.json()
    const id = parseInt(userId)
    const h = Number(hours)
    if (!id || ![0, 24, 48].includes(h)) return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
    if (id === admin!.id) return NextResponse.json({ error: 'Non puoi sospendere te stesso' }, { status: 400 })
    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    if (target.role === 'admin') return NextResponse.json({ error: 'Non puoi sospendere un amministratore' }, { status: 403 })

    const until = h ? new Date(Date.now() + h * 3600 * 1000) : null
    await prisma.user.update({ where: { id }, data: { suspendedUntil: until } })
    const when = until?.toLocaleString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })
    await prisma.notification.create({
      data: {
        userId: id, type: 'moderation',
        title: h ? 'Sospensione' : 'Sospensione revocata',
        message: h ? `Un amministratore ha sospeso la tua possibilità di pubblicare post e commenti fino a ${when}.` : 'La sospensione è stata revocata: puoi tornare a pubblicare.',
        link: '/community',
      },
    }).catch(() => {})
    return NextResponse.json({ ok: true, suspendedUntil: until })
  } catch {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
