import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser, suspendedError } from '@/lib/auth'
import { stripe, newRoom } from '@/lib/consulenza'
import { SITE_URL } from '@/lib/site'

// POST { offerId } - crea la prenotazione e la pagina di pagamento Stripe
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  const st = stripe()
  if (!st) return NextResponse.json({ error: 'I pagamenti non sono ancora attivi. Riprova più avanti.' }, { status: 503 })
  try {
    const { offerId } = await request.json()
    const offer = await prisma.consulenzaOffer.findUnique({ where: { id: parseInt(offerId) } })
    if (!offer || !offer.active) return NextResponse.json({ error: 'Consulenza non disponibile' }, { status: 404 })
    if (offer.userId === user!.id) return NextResponse.json({ error: 'Non puoi prenotare una tua consulenza' }, { status: 400 })
    const seller = await prisma.user.findUnique({ where: { id: offer.userId }, select: { nome: true, cognome: true, banned: true } })
    if (!seller || seller.banned) return NextResponse.json({ error: 'Consulenza non disponibile' }, { status: 404 })

    const booking = await prisma.consulenzaBooking.create({
      data: { offerId: offer.id, buyerId: user!.id, sellerId: offer.userId, title: offer.title, durationMin: offer.durationMin, amountCents: offer.priceCents, room: newRoom() },
    })
    const base = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL
    const session = await st.checkout.sessions.create({
      mode: 'payment',
      customer_email: user!.email,
      line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: offer.priceCents, product_data: { name: offer.title, description: `Consulenza di ${offer.durationMin} minuti con ${seller.nome || ''} ${seller.cognome || ''}`.trim() } } }],
      metadata: { bookingId: String(booking.id) },
      success_url: `${base}/consulenza?pagato=${booking.id}`,
      cancel_url: `${base}/consulenza?annullato=1`,
    })
    await prisma.consulenzaBooking.update({ where: { id: booking.id }, data: { stripeSessionId: session.id } })
    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('checkout', e)
    return NextResponse.json({ error: 'Non riesco ad aprire il pagamento, riprova' }, { status: 500 })
  }
}
