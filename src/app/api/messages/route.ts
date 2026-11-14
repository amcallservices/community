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
    // ?after=ID -> solo i messaggi nuovi + quali dei miei sono stati letti (leggero, per l'aggiornamento continuo)
    if (searchParams.has('after')) {
      const after = parseInt(searchParams.get('after') || '0') || 0
      const [fresh, read] = await Promise.all([
        prisma.message.findMany({
          where: { id: { gt: after }, OR: [{ receiverId: user!.id }, { senderId: user!.id }] },
          orderBy: { id: 'asc' }, take: 200,
        }),
        prisma.message.findMany({ where: { senderId: user!.id, read: true }, select: { id: true }, orderBy: { id: 'desc' }, take: 100 }),
      ])
      return NextResponse.json({ messages: fresh, readIds: read.map(m => m.id) })
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
    if (isNaN(rid) || !content || typeof content !== 'string' || !content.trim() || content.length > 5000) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    }
    const receiver = await prisma.user.findUnique({ where: { id: rid } })
    if (!receiver || receiver.banned) return NextResponse.json({ error: 'Destinatario non trovato' }, { status: 404 })
    if (receiver.id === user!.id) return NextResponse.json({ error: 'Non puoi scrivere a te stesso' }, { status: 400 })

    const message = await prisma.message.create({ data: { content: content.trim(), senderId: user!.id, receiverId: receiver.id } })
    const who = `${user!.nome || 'Qualcuno'} ${user!.cognome || ''}`.trim()
    const text = `${who} ti ha mandato un messaggio`
    const already = await prisma.notification.findFirst({ where: { userId: receiver.id, type: 'message', message: text, read: false } })
    if (!already) await prisma.notification.create({ data: { userId: receiver.id, type: 'message', title: 'Nuovo messaggio', message: text, link: '/messaggi' } })
    return NextResponse.json({ id: message.id, success: true, message })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Errore nel database' }, { status: 500 })
  }
}

// PUT /api/messages?id=X  -> segna come letto un messaggio ricevuto
// PUT /api/messages?from=Y -> segna come letti tutti i messaggi ricevuti da Y (e chiude la notifica relativa)
export async function PUT(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const sp = new URL(request.url).searchParams
    const from = parseInt(sp.get('from') || '')
    if (from) {
      const result = await prisma.message.updateMany({ where: { senderId: from, receiverId: user!.id, read: false }, data: { read: true } })
      const sender = await prisma.user.findUnique({ where: { id: from }, select: { nome: true, cognome: true } })
      if (sender) {
        const who = `${sender.nome || 'Qualcuno'} ${sender.cognome || ''}`.trim()
        await prisma.notification.updateMany({ where: { userId: user!.id, type: 'message', read: false, message: `${who} ti ha mandato un messaggio` }, data: { read: true } })
      }
      return NextResponse.json({ success: true, count: result.count })
    }
    const id = sp.get('id')
    if (!id) return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })
    const result = await prisma.message.updateMany({ where: { id: parseInt(id), receiverId: user!.id }, data: { read: true } })
    return NextResponse.json({ success: result.count > 0 })
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

// DELETE /api/messages?id=X - elimina un proprio messaggio inviato
export async function DELETE(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const id = parseInt(new URL(request.url).searchParams.get('id') || '')
    if (!id) return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })
    const result = await prisma.message.deleteMany({ where: { id, senderId: user!.id } })
    return NextResponse.json({ success: result.count > 0 })
  } catch {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
