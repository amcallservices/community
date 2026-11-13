import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { newResetToken, sendResetEmail } from '@/lib/auth'

// Risponde sempre uguale, così non si scopre quali email sono registrate.
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    const mail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const user = mail ? await prisma.user.findUnique({ where: { email: mail } }) : null

    if (user && !user.banned) {
      const recent = await prisma.passwordReset.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) } } })
      if (recent < 3) {
        const { token, tokenHash } = newResetToken()
        await prisma.passwordReset.create({ data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } })
        const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
        const sent = await sendResetEmail(user.email, `${base}/reset-password?token=${token}`)
        if (!sent) console.warn('RESEND_API_KEY mancante o invio fallito: usa il link generato dall\'admin in /utenti')
      }
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot error:', error)
    return NextResponse.json({ success: true })
  }
}
