import { NextRequest, NextResponse } from 'next/server'
import { stripe, markPaid } from '@/lib/consulenza'

// Stripe avvisa qui appena un pagamento è completato (facoltativo: la pagina Consulenza controlla comunque da sola).
export async function POST(request: NextRequest) {
  const st = stripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!st || !secret) return NextResponse.json({ error: 'Non configurato' }, { status: 503 })
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature') || ''
    const event = st.webhooks.constructEvent(body, sig, secret)
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as { id: string; payment_status: string; metadata?: Record<string, string> | null }
      const id = parseInt(s.metadata?.bookingId || '')
      if (id && s.payment_status === 'paid') await markPaid(id, s.id)
    }
    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Firma non valida' }, { status: 400 })
  }
}
