import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/messages - get messages for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) return NextResponse.json({ error: 'userId richiesto' }, { status: 400 })
    
    const uid = parseInt(userId)
    
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { receiverId: uid },
          { senderId: uid }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, nome: true, cognome: true, email: true } },
        receiver: { select: { id: true, nome: true, cognome: true, email: true } }
      }
    })
    
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/messages - send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { senderId, receiverId, content, senderEmail, senderNome, receiverEmail, receiverNome } = body
    
    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    }
    
    const sid = parseInt(senderId)
    const rid = parseInt(receiverId)
    
    if (isNaN(sid) || isNaN(rid)) {
      return NextResponse.json({ error: 'ID non validi' }, { status: 400 })
    }
    
    // Find or create sender
    let sender = await prisma.user.findUnique({ where: { id: sid } })
    if (!sender && senderEmail) {
      sender = await prisma.user.findFirst({ where: { email: senderEmail } })
    }
    if (!sender) {
      sender = await prisma.user.create({
        data: {
          email: senderEmail || `user${sid}@temp.com`,
          name: senderNome || 'Utente',
          nome: senderNome || 'Utente',
          cognome: '',
          password: 'temp123'
        }
      })
    }
    
    // Find or create receiver
    let receiver = await prisma.user.findUnique({ where: { id: rid } })
    if (!receiver && receiverEmail) {
      receiver = await prisma.user.findFirst({ where: { email: receiverEmail } })
    }
    if (!receiver) {
      return NextResponse.json({ error: 'Destinatario non trovato' }, { status: 404 })
    }
    
    const message = await prisma.message.create({
      data: {
        content,
        senderId: sender.id,
        receiverId: receiver.id
      }
    })
    
    return NextResponse.json({ id: message.id, success: true })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Errore nel database', details: String(error) }, { status: 500 })
  }
}

// PUT /api/messages - mark as read
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })
    
    const message = await prisma.message.update({
      where: { id: parseInt(id) },
      data: { read: true }
    })
    
    return NextResponse.json(message)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}