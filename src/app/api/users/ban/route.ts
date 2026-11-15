import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { user: admin, error: authError } = await requireAdmin()
  if (authError) return authError
  try {
    const body = await request.json()
    const { email, name, banned, userId } = body

    if (userId) {
      const t = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
      if (!t) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
      if (t.id === admin!.id || t.role === 'admin') return NextResponse.json({ error: 'Non puoi bloccare un amministratore' }, { status: 403 })
      const u = await prisma.user.update({ where: { id: t.id }, data: { banned: banned !== undefined ? !!banned : true, ...(banned === false ? {} : { suspendedUntil: null }) } })
      return NextResponse.json({ id: u.id, banned: u.banned })
    }
    
    if (email) {
      const user = await prisma.user.update({
        where: { email },
        data: { banned: banned !== undefined ? banned : true }
      })
      return NextResponse.json({ id: user.id, banned: user.banned })
    }
    
    if (name) {
      const user = await prisma.user.updateMany({
        where: { name },
        data: { banned: banned !== undefined ? banned : true }
      })
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Email or name required' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Error banning user' }, { status: 500 })
  }
}
