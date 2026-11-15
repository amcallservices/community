import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { pollsFor } from '@/lib/polls'

// POST /api/polls/vote { postId, option } - vota; stessa risposta di nuovo = toglie il voto
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const { postId, option } = await request.json()
    const pid = parseInt(postId)
    const opt = Number(option)
    const poll = pid ? await prisma.poll.findUnique({ where: { postId: pid } }) : null
    if (!poll) return NextResponse.json({ error: 'Sondaggio non trovato' }, { status: 404 })
    let n = 0
    try { n = JSON.parse(poll.options).length } catch {}
    if (!Number.isInteger(opt) || opt < 0 || opt >= n) return NextResponse.json({ error: 'Risposta non valida' }, { status: 400 })

    const existing = await prisma.pollVote.findUnique({ where: { pollId_userId: { pollId: poll.id, userId: user!.id } } })
    if (existing && existing.option === opt) await prisma.pollVote.deleteMany({ where: { pollId: poll.id, userId: user!.id } })
    else await prisma.pollVote.upsert({ where: { pollId_userId: { pollId: poll.id, userId: user!.id } }, update: { option: opt }, create: { pollId: poll.id, userId: user!.id, option: opt } })

    const view = (await pollsFor([pid], user!.id)).get(pid)
    return NextResponse.json(view)
  } catch {
    return NextResponse.json({ error: 'Voto non riuscito, riprova' }, { status: 500 })
  }
}
