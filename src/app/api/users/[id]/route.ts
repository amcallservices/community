import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser, verifyPassword, hashPassword, validatePassword } from '@/lib/auth'

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
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const { id } = await params
    if (parseInt(id) !== user!.id) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    const { currentPassword, newPassword } = await request.json()
    const pwError = validatePassword(newPassword)
    if (pwError) return NextResponse.json({ error: pwError }, { status: 400 })
    if (!currentPassword || !verifyPassword(currentPassword, user!.password)) {
      return NextResponse.json({ error: 'Password attuale non corretta' }, { status: 400 })
    }
    await prisma.user.update({ where: { id: user!.id }, data: { password: hashPassword(newPassword) } })
    return NextResponse.json({ success: true, message: 'Password cambiata con successo' })
  } catch (e) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
