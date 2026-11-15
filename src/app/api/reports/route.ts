import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser, requireStaff } from '@/lib/auth'

const REASONS = ['spam', 'offensivo', 'regole', 'altro']

// POST /api/reports { postId | commentId, reason, note? } - qualsiasi utente segnala un contenuto
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const body = await request.json()
    const postId = parseInt(body.postId) || null
    const commentId = parseInt(body.commentId) || null
    if (!postId && !commentId) return NextResponse.json({ error: 'Contenuto mancante' }, { status: 400 })
    if (!REASONS.includes(body.reason)) return NextResponse.json({ error: 'Motivo non valido' }, { status: 400 })
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : null

    // il contenuto deve esistere e non può essere il proprio
    let authorId: number | null = null
    if (commentId) authorId = (await prisma.comment.findUnique({ where: { id: commentId }, select: { userId: true } }))?.userId ?? null
    else authorId = (await prisma.post.findUnique({ where: { id: postId! }, select: { authorId: true } }))?.authorId ?? null
    if (authorId === null) return NextResponse.json({ error: 'Contenuto non trovato' }, { status: 404 })
    if (authorId === user!.id) return NextResponse.json({ error: 'Non puoi segnalare un tuo contenuto' }, { status: 400 })

    const already = await prisma.report.findFirst({ where: { reporterId: user!.id, status: 'open', ...(commentId ? { commentId } : { postId, commentId: null }) } })
    if (already) return NextResponse.json({ success: true, already: true })

    await prisma.report.create({ data: { postId: commentId ? null : postId, commentId, reporterId: user!.id, reason: body.reason, note: note || null } })

    // avvisa gli admin (una sola notifica non letta alla volta)
    const admins = await prisma.user.findMany({ where: { role: { in: ['admin', 'moderatore'] } }, select: { id: true } })
    const message = 'C’è una nuova segnalazione da controllare'
    for (const a of admins) {
      const exists = await prisma.notification.findFirst({ where: { userId: a.id, type: 'report', read: false } })
      if (!exists) await prisma.notification.create({ data: { userId: a.id, type: 'report', title: 'Segnalazione', message, link: '/admin/segnalazioni' } })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

// GET /api/reports?status=open|closed - solo admin
export async function GET(request: NextRequest) {
  const { error } = await requireStaff()
  if (error) return error
  try {
    const closed = new URL(request.url).searchParams.get('status') === 'closed'
    const reports = await prisma.report.findMany({
      where: { status: closed ? { not: 'open' } : 'open' },
      orderBy: { createdAt: 'desc' }, take: 100,
    })
    const reporters = await prisma.user.findMany({ where: { id: { in: reports.map(r => r.reporterId) } }, select: { id: true, nome: true, cognome: true } })
    const items = await Promise.all(reports.map(async r => {
      let target: any = null
      if (r.commentId) {
        const c = await prisma.comment.findUnique({ where: { id: r.commentId }, include: { user: { select: { id: true, nome: true, cognome: true } } } })
        if (c) target = { kind: 'commento', postId: c.postId, authorId: c.userId, author: `${c.user.nome || ''} ${c.user.cognome || ''}`.trim(), text: c.content.replace(/<[^>]*>?/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400) }
      } else if (r.postId) {
        const p = await prisma.post.findUnique({ where: { id: r.postId }, include: { author: { select: { id: true, nome: true, cognome: true } } } })
        if (p) target = { kind: 'post', postId: p.id, authorId: p.authorId, author: `${p.author.nome || ''} ${p.author.cognome || ''}`.trim(), title: p.title, text: p.content.replace(/<[^>]*>?/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400) }
      }
      const rep = reporters.find(u => u.id === r.reporterId)
      return { id: r.id, reason: r.reason, note: r.note, status: r.status, createdAt: r.createdAt, reporter: rep ? `${rep.nome || ''} ${rep.cognome || ''}`.trim() : 'Utente eliminato', target }
    }))
    return NextResponse.json(items)
  } catch {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

// PATCH /api/reports { id, action: 'dismiss' | 'resolve' | 'delete' } - solo admin
export async function PATCH(request: NextRequest) {
  const { error } = await requireStaff()
  if (error) return error
  try {
    const { id, action } = await request.json()
    const report = await prisma.report.findUnique({ where: { id: parseInt(id) } })
    if (!report) return NextResponse.json({ error: 'Segnalazione non trovata' }, { status: 404 })

    if (action === 'delete') {
      if (report.commentId) {
        const c = await prisma.comment.findUnique({ where: { id: report.commentId } })
        if (c) {
          const removed = await prisma.comment.count({ where: { OR: [{ id: c.id }, { parentId: c.id }] } })
          await prisma.$transaction([
            prisma.report.updateMany({ where: { commentId: { in: [c.id] }, status: 'open' }, data: { status: 'resolved' } }),
            prisma.comment.deleteMany({ where: { OR: [{ id: c.id }, { parentId: c.id }] } }),
            prisma.post.update({ where: { id: c.postId }, data: { comments: { decrement: removed } } }),
          ])
        }
      } else if (report.postId) {
        const pid = report.postId
        await prisma.$transaction([
          prisma.like.deleteMany({ where: { postId: pid } }),
          prisma.comment.deleteMany({ where: { postId: pid } }),
          prisma.report.updateMany({ where: { postId: pid, status: 'open' }, data: { status: 'resolved' } }),
          prisma.post.deleteMany({ where: { id: pid } }),
        ])
      }
      await prisma.report.update({ where: { id: report.id }, data: { status: 'resolved' } }).catch(() => {})
      return NextResponse.json({ success: true })
    }
    if (action !== 'dismiss' && action !== 'resolve') return NextResponse.json({ error: 'Azione non valida' }, { status: 400 })
    await prisma.report.update({ where: { id: report.id }, data: { status: action === 'dismiss' ? 'dismissed' : 'resolved' } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
