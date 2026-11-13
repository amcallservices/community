import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { hashPassword, validatePassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, nome, cognome, password } = await request.json()
    const mail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!mail || !/^\S+@\S+\.\S+$/.test(mail)) return NextResponse.json({ error: 'Email non valida' }, { status: 400 })
    if (!nome || !cognome) return NextResponse.json({ error: 'Nome e cognome richiesti' }, { status: 400 })
    const pwError = validatePassword(password)
    if (pwError) return NextResponse.json({ error: pwError }, { status: 400 })

    if (await prisma.user.findUnique({ where: { email: mail } })) {
      return NextResponse.json({ error: 'Email già registrata' }, { status: 409 })
    }

    // Il ruolo è sempre "scrittore": gli admin si creano solo con lo script update_admin.js
    await prisma.user.create({
      data: { email: mail, name: `${nome} ${cognome}`, nome, cognome, password: hashPassword(password), role: 'scrittore' },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
