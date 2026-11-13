import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { hashPassword, hashToken, validatePassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()
    const pwError = validatePassword(password)
    if (pwError) return NextResponse.json({ error: pwError }, { status: 400 })
    if (typeof token !== 'string' || !token) return NextResponse.json({ error: 'Link non valido' }, { status: 400 })

    const reset = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } })
    if (!reset || reset.used || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Link scaduto o già usato. Richiedine uno nuovo.' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { password: hashPassword(password) } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
    ])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
