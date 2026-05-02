import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, nome, cognome, bio, avatarUrl } = body
    
    if (!email) {
      return NextResponse.json({ error: 'Email richiesta' }, { status: 400 })
    }
    
    // Update user in database
    const user = await prisma.user.update({
      where: { email },
      data: {
        nome: nome || '',
        cognome: cognome || '',
        bio: bio || '',
        avatar: avatarUrl || ''
      }
    })
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Errore nel salvataggio' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email richiesta' }, { status: 400 })
    }
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, nome: true, cognome: true, bio: true, avatar: true, role: true, createdAt: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
