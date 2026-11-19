import { randomBytes } from 'crypto'
import Stripe from 'stripe'
import prisma from '@/lib/db'

import { TEMPLATES } from '@/lib/consulenza-templates'
export { TEMPLATES }

export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  return key ? new Stripe(key) : null
}

export const newRoom = () => `SPI-${randomBytes(12).toString('hex')}`

// Segna la prenotazione come pagata e avvisa le due persone (una sola volta).
export async function markPaid(bookingId: number, sessionId?: string) {
  const b = await prisma.consulenzaBooking.findUnique({ where: { id: bookingId } })
  if (!b || b.status !== 'pending') return b
  const updated = await prisma.consulenzaBooking.update({ where: { id: b.id }, data: { status: 'paid', paidAt: new Date(), ...(sessionId ? { stripeSessionId: sessionId } : {}) } })
  const [buyer, seller, staff] = await Promise.all([
    prisma.user.findUnique({ where: { id: b.buyerId }, select: { nome: true, cognome: true, email: true } }),
    prisma.user.findUnique({ where: { id: b.sellerId }, select: { nome: true, cognome: true, email: true } }),
    prisma.user.findMany({ where: { role: { in: ['admin', 'sottoadmin'] }, banned: false }, select: { id: true, email: true } }),
  ])
  const nm = (u: { nome: string | null; cognome: string | null } | null) => `${u?.nome || ''} ${u?.cognome || ''}`.trim() || 'Un utente'
  const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
  const eur = (b.amountCents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
  const url = 'https://selfpublishingitalia.site/consulenza'
  const row = `<p><b>${esc(b.title)}</b><br>${b.durationMin} minuti · ${eur}<br>Cliente: ${esc(nm(buyer))} · Consulente: ${esc(nm(seller))}</p>`
  const btn = `<p><a href="${url}">Apri la pagina Consulenza</a></p>`

  const notes: { userId: number; type: string; title: string; message: string; link: string }[] = [
    { userId: b.sellerId, type: 'consulenza', title: 'Nuova consulenza', message: `${nm(buyer)} ha prenotato: ${b.title}. Scrivigli per accordarvi sull’orario.`, link: '/consulenza' },
    { userId: b.buyerId, type: 'consulenza', title: 'Pagamento ricevuto', message: `Pagamento ricevuto per “${b.title}”. Scrivi a ${nm(seller)} per accordarvi sull’orario, poi entra nella videochiamata dalla pagina Consulenza.`, link: '/consulenza' },
  ]
  // anche tutti gli admin e i sotto admin sono avvisati
  for (const u of staff) if (u.id !== b.sellerId && u.id !== b.buyerId) notes.push({ userId: u.id, type: 'consulenza', title: 'Nuova consulenza prenotata', message: `${nm(buyer)} ha prenotato “${b.title}” con ${nm(seller)} (${eur}).`, link: '/consulenza' })
  await prisma.notification.createMany({ data: notes }).catch(() => {})

  return updated
}
