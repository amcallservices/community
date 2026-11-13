import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { hashPassword, isHashed, verifyPassword, setSession, publicUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ error: 'Email e password richieste' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    // Stesso errore per email inesistente e password errata
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 })
    }
    if (user.banned) return NextResponse.json({ error: 'Account sospeso' }, { status: 403 })

    // Migra le vecchie password in chiaro
    if (!isHashed(user.password)) {
      await prisma.user.update({ where: { id: user.id }, data: { password: hashPassword(password) } })
    }

    const res = NextResponse.json(publicUser(user))
    setSession(res, user.id)
    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
