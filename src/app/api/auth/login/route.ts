import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, nome, cognome, password } = body
    
    if (!email) {
      return NextResponse.json({ error: 'Email richiesta' }, { status: 400 })
    }
    
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } })
    
    if (!user) {
      // Create new user - check if admin email
      const isAdminEmail = email === 'admin@scrittore.site';
      user = await prisma.user.create({
        data: {
          email,
          name: `${nome} ${cognome}`,
          nome: nome || '',
          cognome: cognome || '',
          password: password || 'password',
          role: isAdminEmail ? 'admin' : 'scrittore'
        }
      })
    } else if (email === 'admin@scrittore.site' && user.role !== 'admin') {
      // Ensure admin always has admin role
      user = await prisma.user.update({
        where: { email },
        data: { role: 'admin' }
      })
    }
    
    // Fetch fresh user to get correct role
    const freshUser = await prisma.user.findUnique({ where: { email } })
    
    return NextResponse.json({ id: freshUser?.id, email: freshUser?.email, name: freshUser?.name, nome: freshUser?.nome, cognome: freshUser?.cognome, role: freshUser?.role, avatar: freshUser?.avatar })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}