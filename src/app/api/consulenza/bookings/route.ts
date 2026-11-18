import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser, avatarUrl } from '@/lib/auth'
import { stripe, markPaid } from '@/lib/consulenza'

// GET - le mie prenotazioni (come cliente e come consulente). Controlla anche i pagamenti ancora in attesa.
export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const where = { OR: [{ buyerId: user!.id }, { sellerId: user!.id }] }
    // pagamenti in sospeso: li verifico direttamente su Stripe (funziona anche senza webhook)
    const st = stripe()
    if (st) {
      const pend = await prisma.consulenzaBooking.findMany({ where: { AND: [where, { status: 'pending', stripeSessionId: { not: null }, createdAt: { gt: new Date(Date.now() - 48 * 3600 * 1000) } }] }, take: 10 })
      for (const b of pend) {
        try { const s = await st.checkout.sessions.retrieve(b.stripeSessionId!); if (s.payment_status === 'paid') await markPaid(b.id, s.id) } catch {}
      }
    }
    const all = await prisma.consulenzaBooking.findMany({ where: { AND: [where, { OR: [{ status: { not: 'pending' } }, { createdAt: { gt: new Date(Date.now() - 48 * 3600 * 1000) } }] }] }, orderBy: { createdAt: 'desc' }, take: 60 })
    const ids = [...new Set(all.flatMap(b => [b.buyerId, b.sellerId]))]
    const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, nome: true, cognome: true, avatar: true, updatedAt: true } })
    const who = (id: number) => { const u = users.find(x => x.id === id); return { id, nome: u?.nome || 'Utente', cognome: u?.cognome || '', avatar: u ? avatarUrl(u) : null } }
    const view = (b: typeof all[number]) => ({
      id: b.id, title: b.title, durationMin: b.durationMin, amountCents: b.amountCents, status: b.status, createdAt: b.createdAt.toISOString(), paidAt: b.paidAt?.toISOString() ?? null,
      room: b.status === 'paid' || b.status === 'completed' ? b.room : null,
      buyer: who(b.buyerId), seller: who(b.sellerId),
    })
    return NextResponse.json({
      asBuyer: all.filter(b => b.buyerId === user!.id).map(view),
      asSeller: all.filter(b => b.sellerId === user!.id && b.status !== 'pending').map(view),
    })
  } catch (e) {
    console.error('bookings', e)
    return NextResponse.json({ asBuyer: [], asSeller: [] })
  }
}

// PATCH { id, action: 'complete' } - il consulente segna la consulenza come svolta
export async function PATCH(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const { id, action } = await request.json()
    const b = await prisma.consulenzaBooking.findUnique({ where: { id: parseInt(id) } })
    if (!b || (b.sellerId !== user!.id && user!.role !== 'admin')) return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
    if (action !== 'complete' || b.status !== 'paid') return NextResponse.json({ error: 'Operazione non valida' }, { status: 400 })
    await prisma.consulenzaBooking.update({ where: { id: b.id }, data: { status: 'completed' } })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Errore' }, { status: 500 }) }
}

// DELETE ?id= - elimina una prenotazione: non pagata (cliente o admin) o svolta (consulente, cliente o admin).
// Una prenotazione pagata e non ancora svolta si può eliminare solo dall'admin.
export async function DELETE(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const id = parseInt(new URL(request.url).searchParams.get('id') || '')
    const b = id ? await prisma.consulenzaBooking.findUnique({ where: { id } }) : null
    const admin = user!.role === 'admin'
    const mine = !!b && (b.buyerId === user!.id || b.sellerId === user!.id)
    if (!b || (!mine && !admin)) return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })
    const ok = admin || (b.status === 'pending' && b.buyerId === user!.id) || b.status === 'completed'
    if (!ok) return NextResponse.json({ error: 'Una consulenza pagata si elimina dopo che è stata svolta' }, { status: 400 })
    // se il pagamento era ancora aperto su Stripe, lo chiudo così non può essere pagato dopo
    if (b.status === 'pending' && b.stripeSessionId) { try { await stripe()?.checkout.sessions.expire(b.stripeSessionId) } catch {} }
    await prisma.consulenzaBooking.delete({ where: { id: b.id } })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Errore' }, { status: 500 }) }
}
