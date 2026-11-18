import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireConsultant } from '@/lib/auth'

const KEY = 'riunione_live'
const MEET = /^https:\/\/meet\.google\.com\/[a-z0-9-]{6,}(\?.*)?$/i

// GET - la riunione condivisa del team (admin e sotto admin)
export async function GET() {
  const { error } = await requireConsultant()
  if (error) return error
  try {
    const f = await prisma.appFlag.findUnique({ where: { key: KEY } })
    const v = f?.value ? JSON.parse(f.value) : null
    return NextResponse.json({ live: v && v.url ? v : null })
  } catch { return NextResponse.json({ live: null }) }
}

// POST { url } - condivide il link Google Meet con gli altri admin e sotto admin ({ url: '' } lo toglie)
export async function POST(request: NextRequest) {
  const { user, error } = await requireConsultant()
  if (error) return error
  try {
    const { url } = await request.json()
    const raw = String(url || '').trim()
    if (raw && !MEET.test(raw)) return NextResponse.json({ error: 'Incolla un link di Google Meet (meet.google.com/...)' }, { status: 400 })
    const by = `${user!.nome || ''} ${user!.cognome || ''}`.trim() || 'Un admin'
    const value = raw ? JSON.stringify({ url: raw, by, at: new Date().toISOString() }) : ''
    await prisma.appFlag.upsert({ where: { key: KEY }, update: { value }, create: { key: KEY, value } })
    if (raw) {
      const team = await prisma.user.findMany({ where: { role: { in: ['admin', 'sottoadmin'] }, banned: false, id: { not: user!.id } }, select: { id: true } })
      if (team.length) await prisma.notification.createMany({ data: team.map(t => ({ userId: t.id, type: 'consulenza', title: 'Riunione del team', message: `${by} ha avviato una riunione su Google Meet: puoi partecipare dalla pagina Consulenza.`, link: '/consulenza' })) }).catch(() => {})
    }
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Errore' }, { status: 500 }) }
}
