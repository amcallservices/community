import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireConsultant, getSessionUser, avatarUrl, canConsult } from '@/lib/auth'
import { TEMPLATES } from '@/lib/consulenza'

// GET /api/consulenza/offers - offerte attive (pubbliche). ?mine=1 = tutte le mie, anche sospese
export async function GET(request: NextRequest) {
  try {
    const me = await getSessionUser().catch(() => null)
    const mine = new URL(request.url).searchParams.get('mine') === '1' && !!me
    const offers = await prisma.consulenzaOffer.findMany({
      where: mine ? (me!.role === 'admin' ? {} : { userId: me!.id }) : { active: true }, // l'admin gestisce anche le offerte dei sotto admin
      orderBy: { createdAt: 'desc' }, take: 100,
    })
    const users = await prisma.user.findMany({ where: { id: { in: [...new Set(offers.map(o => o.userId))] }, banned: false }, select: { id: true, nome: true, cognome: true, role: true, avatar: true, bio: true, updatedAt: true } })
    return NextResponse.json({
      payments: !!process.env.STRIPE_SECRET_KEY,
      canOffer: !!me && canConsult(me.role),
      offers: offers.filter(o => users.some(u => u.id === o.userId)).map(o => {
        const u = users.find(x => x.id === o.userId)!
        return { id: o.id, category: o.category, title: o.title, description: o.description, durationMin: o.durationMin, priceCents: o.priceCents, active: o.active, mine: me?.id === o.userId,
          seller: { id: u.id, nome: u.nome || '', cognome: u.cognome || '', role: u.role, avatar: avatarUrl(u), bio: u.bio } }
      }),
    })
  } catch {
    return NextResponse.json({ payments: false, canOffer: false, offers: [] })
  }
}

function parse(body: any, role?: string) {
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : ''
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 10000) : ''
  const durationMin = Math.round(Number(body.durationMin))
  const price = Number(String(body.price).replace(',', '.'))
  const category = TEMPLATES.some(t => t.k === body.category) ? body.category : 'altro'
  if (title.length < 4) return { error: 'Scrivi un titolo' }
  if (description.length < 10) return { error: 'Scrivi una breve descrizione' }
  if (!(durationMin >= 15 && durationMin <= 240)) return { error: 'La durata deve essere tra 15 e 240 minuti' }
  const min = role === 'admin' || role === 'sottoadmin' ? 1 : 5 // admin e sotto admin possono creare anche consulenze da 1 euro
  if (!(price >= min && price <= 2000)) return { error: `Il prezzo deve essere tra ${min} e 2000 euro` }
  return { data: { title, description, durationMin, priceCents: Math.round(price * 100), category } }
}

// POST - crea un'offerta (solo admin e moderatori)
export async function POST(request: NextRequest) {
  const { user, error } = await requireConsultant()
  if (error) return error
  try {
    const p = parse(await request.json(), user!.role)
    if (p.error) return NextResponse.json({ error: p.error }, { status: 400 })
    const count = await prisma.consulenzaOffer.count({ where: { userId: user!.id } })
    if (count >= 30) return NextResponse.json({ error: 'Hai già troppe offerte' }, { status: 400 })
    const o = await prisma.consulenzaOffer.create({ data: { ...p.data!, userId: user!.id } })
    return NextResponse.json({ id: o.id })
  } catch { return NextResponse.json({ error: 'Errore' }, { status: 500 }) }
}

// PATCH { id, active? , ...campi } - modifica o sospende la propria offerta
export async function PATCH(request: NextRequest) {
  const { user, error } = await requireConsultant()
  if (error) return error
  try {
    const body = await request.json()
    const o = await prisma.consulenzaOffer.findUnique({ where: { id: parseInt(body.id) } })
    if (!o || (o.userId !== user!.id && user!.role !== 'admin')) return NextResponse.json({ error: 'Offerta non trovata' }, { status: 404 })
    if (typeof body.active === 'boolean' && Object.keys(body).length <= 2) {
      await prisma.consulenzaOffer.update({ where: { id: o.id }, data: { active: body.active } })
      return NextResponse.json({ ok: true })
    }
    const p = parse(body, user!.role)
    if (p.error) return NextResponse.json({ error: p.error }, { status: 400 })
    await prisma.consulenzaOffer.update({ where: { id: o.id }, data: p.data! })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Errore' }, { status: 500 }) }
}

// DELETE ?id= - elimina l'offerta (le prenotazioni già fatte restano)
export async function DELETE(request: NextRequest) {
  const { user, error } = await requireConsultant()
  if (error) return error
  try {
    const id = parseInt(new URL(request.url).searchParams.get('id') || '')
    const o = id ? await prisma.consulenzaOffer.findUnique({ where: { id } }) : null
    if (!o || (o.userId !== user!.id && user!.role !== 'admin')) return NextResponse.json({ error: 'Offerta non trovata' }, { status: 404 })
    await prisma.consulenzaOffer.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Errore' }, { status: 500 }) }
}
