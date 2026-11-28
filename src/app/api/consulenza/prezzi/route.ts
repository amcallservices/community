import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/consulenza/prezzi - prezzo più basso attivo per i tre formati (30, 60, 90 minuti), per la home.
// Le offerte di prova sotto 5 € non contano.
export async function GET() {
  try {
    const offers = await prisma.consulenzaOffer.findMany({
      where: { active: true, durationMin: { in: [30, 60, 90] }, priceCents: { gte: 500 } },
      select: { durationMin: true, priceCents: true, userId: true },
    })
    const ok = new Set((await prisma.user.findMany({ where: { id: { in: [...new Set(offers.map(o => o.userId))] }, banned: false }, select: { id: true } })).map(u => u.id))
    const out: Record<string, number> = {}
    for (const o of offers.filter(o => ok.has(o.userId))) {
      const k = String(o.durationMin)
      if (out[k] === undefined || o.priceCents < out[k]) out[k] = o.priceCents
    }
    return NextResponse.json(out, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
  } catch {
    return NextResponse.json({})
  }
}
