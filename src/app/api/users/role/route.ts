import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// POST /api/users/role { userId, role: 'sottoadmin' | 'moderatore' | 'scrittore' } - solo admin
export async function POST(request: NextRequest) {
  const { user: admin, error } = await requireAdmin()
  if (error) return error
  try {
    const { userId, role } = await request.json()
    const id = parseInt(userId)
    if (!id || !['sottoadmin', 'moderatore', 'scrittore'].includes(role)) return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    if (target.role === 'admin' || target.id === admin!.id) return NextResponse.json({ error: 'Il ruolo di un amministratore non si cambia da qui' }, { status: 403 })
    await prisma.user.update({ where: { id }, data: { role } })
    await prisma.notification.create({
      data: { userId: id, type: 'moderation', title: 'Ruolo', link: '/community',
        message: role === 'sottoadmin' ? 'Sei stato nominato sotto admin: sei moderatore della community e puoi offrire consulenze a pagamento.' : role === 'moderatore' ? 'Sei stato nominato moderatore: puoi eliminare post e commenti e gestire le segnalazioni.' : 'Non hai più un ruolo di moderazione nella community.' },
    }).catch(() => {})
    return NextResponse.json({ ok: true, role })
  } catch {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
