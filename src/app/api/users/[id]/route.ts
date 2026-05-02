import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = parseInt(id)
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, nome: true, cognome: true, role: true, avatar: true, bio: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = parseInt(id)
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
      }
      
      if (user.password !== currentPassword) {
        return NextResponse.json({ error: 'Password attuale non corretta' }, { status: 400 })
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { password: newPassword }
      })

      return NextResponse.json({ success: true, message: 'Password cambiata con successo' })
    }

    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
