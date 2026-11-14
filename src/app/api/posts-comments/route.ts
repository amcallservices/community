import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser, avatarUrl } from '@/lib/auth'
import { findMentions } from '@/lib/mentions'

export async function POST(request: NextRequest) {
  const { user: sessionUser, error: authError } = await requireUser()
  if (authError) return authError
  const user = sessionUser!
  try {
    const body = await request.json()
    const { postId, text } = body
    const parentIdIn = parseInt(body.parentId) || null
    if (typeof text !== 'string' || !text.trim() || text.length > 500_000) {
      return NextResponse.json({ error: 'Commento non valido' }, { status: 400 })
    }

    // Get post to find author
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return NextResponse.json({ error: 'Post non trovato' }, { status: 404 })

    // Create comment
    const comment = await prisma.comment.create({
      data: { postId, content: text, userId: user.id, parentId: parentIdIn }
    })

    // Increment comment count on post
    await prisma.post.update({
      where: { id: postId },
      data: { comments: { increment: 1 } }
    })

    // Notifiche: all'autore del post e a chi ha già commentato (escluso chi scrive)
    const who = `${user.nome || 'Qualcuno'} ${user.cognome || ''}`.trim()
    const link = `/community#post-${postId}`
    const others = await prisma.comment.findMany({
      where: { postId, userId: { notIn: [user.id, post.authorId] } },
      select: { userId: true }, distinct: ['userId'],
    })
    const parent = parentIdIn ? await prisma.comment.findUnique({ where: { id: parentIdIn } }) : null
    const rows: { userId: number; type: string; title: string; message: string; link: string }[] = []
    if (post.authorId !== user.id) rows.push({ userId: post.authorId, type: 'comment', title: 'Nuovo commento', message: `${who} ha commentato il tuo post${post.title ? ` "${post.title}"` : ''}`, link })
    for (const o of others) rows.push({ userId: o.userId, type: 'comment', title: 'Nuovo commento', message: `${who} ha commentato anche un post${post.title ? ` ("${post.title}")` : ''} che segui`, link })
    if (parent && parent.userId !== user.id && parent.postId === postId) {
      const i = rows.findIndex(r => r.userId === parent.userId)
      const reply = { userId: parent.userId, type: 'comment', title: 'Risposta al tuo commento', message: `${who} ha risposto al tuo commento`, link }
      if (i >= 0) rows[i] = reply; else rows.push(reply)
    }
    // Menzioni: la notifica "ti ha menzionato" sostituisce le altre per la stessa persona
    const everyone = await prisma.user.findMany({ where: { banned: false, id: { not: user.id } }, select: { id: true, nome: true, cognome: true } })
    for (const id of findMentions(text, everyone)) {
      const m = { userId: id, type: 'mention', title: 'Menzione', message: `${who} ti ha menzionato in un commento`, link }
      const i = rows.findIndex(r => r.userId === id)
      if (i >= 0) rows[i] = m; else rows.push(m)
    }
    if (rows.length) await prisma.notification.createMany({ data: rows })

    return NextResponse.json({
      id: comment.id, text: comment.content, postId: comment.postId,
      authorId: user.id, authorNome: user.nome || '', authorCogen: user.cognome || '',
      authorAvatar: avatarUrl(user), time: comment.createdAt.toLocaleDateString('it-IT'),
      parentId: comment.parentId, createdAt: comment.createdAt.toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    if (!postId) return NextResponse.json([])

    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(postId) },
      include: { user: { select: { id: true, nome: true, cognome: true, avatar: true, updatedAt: true } } },
      orderBy: { createdAt: 'asc' }
    })
    const formatted = comments.map(c => ({
      id: c.id, text: c.content, authorId: c.userId,
      authorNome: c.user.nome || '', authorCogen: c.user.cognome || '',
      authorAvatar: avatarUrl(c.user), time: c.createdAt.toLocaleDateString('it-IT'),
      parentId: c.parentId, createdAt: c.createdAt.toISOString()
    }))
    return NextResponse.json(formatted)
  } catch (error) {
    return NextResponse.json([])
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '')
    if (!id) return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })

    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment) return NextResponse.json({ error: 'Commento non trovato' }, { status: 404 })
    if (user!.role !== 'admin' && comment.userId !== user!.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const removed = await prisma.comment.count({ where: { OR: [{ id }, { parentId: id }] } })
    await prisma.$transaction([
      prisma.report.deleteMany({ where: { commentId: id } }),
      prisma.comment.deleteMany({ where: { OR: [{ id }, { parentId: id }] } }),
      prisma.post.update({ where: { id: comment.postId }, data: { comments: { decrement: removed } } }),
    ])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
