import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser, publicUser } from '@/lib/auth'

// Aggiorna il PROPRIO profilo (l'utente è quello della sessione, non quello del body)
export async function PUT(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const { nome, cognome, bio, avatar } = await request.json()
    const updated = await prisma.user.update({
      where: { id: user!.id },
      data: {
        nome: nome || '',
        cognome: cognome || '',
        name: `${nome || ''} ${cognome || ''}`.trim() || user!.name,
        bio: bio || null,
        avatar: avatar || null,
      },
    })
    return NextResponse.json(publicUser(updated))
  } catch (e) {
    return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 500 })
  }
}
