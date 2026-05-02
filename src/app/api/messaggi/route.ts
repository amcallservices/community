import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { senderId, receiverId, content } = body

    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        read: false
      }
    })

    return NextResponse.json({ success: true, id: message.id })
  } catch (error) {
    console.error('Message error:', error)
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const otherUserId = searchParams.get('otherUserId')

    if (!userId) {
      return NextResponse.json({ error: 'UserID richiesto' }, { status: 400 })
    }

    const where: any = {
      OR: [
        { senderId: parseInt(userId), receiverId: parseInt(otherUserId || '0') },
        { senderId: parseInt(otherUserId || '0'), receiverId: parseInt(userId) }
      ]
    }

    if (otherUserId) {
      where.OR = [
        { senderId: parseInt(userId), receiverId: parseInt(otherUserId) },
        { senderId: parseInt(otherUserId), receiverId: parseInt(userId) }
      ]
    } else {
      where.OR = [
        { senderId: parseInt(userId) },
        { receiverId: parseInt(userId) }
      ]
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, nome: true, cognome: true, avatar: true } },
        receiver: { select: { id: true, nome: true, cognome: true, avatar: true } }
      }
    })

    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
