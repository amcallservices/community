import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser } from '@/lib/auth'

const personSelect = { id: true, nome: true, cognome: true, email: true, avatar: true }

// GET /api/messages            -> tutti i messaggi dell'utente loggato
// GET /api/messages?count=1    -> solo il numero di non letti (leggero, per la Navbar)
export async function GET(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const { searchParams } = new URL(request.url)
    if (searchParams.get('count')) {
      const unread = await prisma.message.count({ where: { receiverId: user!.id, read: false } })
      return NextResponse.json({ unread })
    }
    const messages = await prisma.message.findMany({
      where: { OR: [{ receiverId: user!.id }, { senderId: user!.id }] },
      orderBy: { createdAt: 'asc' },
      take: 500,
      include: { sender: { select: personSelect }, receiver: { select: personSelect } },
    })
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

// POST /api/messages - il mittente è sempre l'utente loggato
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const { receiverId, content } = await request.json()
    const rid = parseInt(receiverId)
    if (isNaN(rid) || !content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    }
    const receiver = await prisma.user.findUnique({ where: { id: rid } })
    if (!receiver) return NextResponse.json({ error: 'Destinatario non trovato' }, { status: 404 })

    const message = await prisma.message.create({ data: { content, senderId: user!.id, receiverId: receiver.id } })
    return NextResponse.json({ id: message.id, success: true })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Errore nel database' }, { status: 500 })
  }
}

// PUT /api/messages?id=X - segna come letto (solo i propri messaggi ricevuti)
export async function PUT(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })
    const result = await prisma.message.updateMany({ where: { id: parseInt(id), receiverId: user!.id }, data: { read: true } })
    return NextResponse.json({ success: result.count > 0 })
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
