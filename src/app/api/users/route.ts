import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const name = searchParams.get('name')
    
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } })
      return NextResponse.json(user)
    }
    
    if (name) {
      const user = await prisma.user.findFirst({ where: { name } })
      return NextResponse.json(user)
    }
    
    return NextResponse.json({ error: 'Email or name required' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching user' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, password, avatar, bio } = body
    const user = await prisma.user.create({ 
      data: { email, name, password, avatar, bio },
      select: { id: true, email: true, name: true, avatar: true, bio: true, role: true }
    })
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Error creating user' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nome, cognome, bio, avatar } = body
    
    const updated = await prisma.user.update({
      where: { id },
      data: { 
        nome: nome || '',
        cognome: cognome || '',
        bio: bio || null,
        avatar: avatar || null
      }
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 })
  }
}
