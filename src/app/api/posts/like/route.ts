import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser } from '@/lib/auth'

const TYPES: Record<string, string> = {
  like: 'ha messo mi piace al',
  love: 'ha adorato il',
  haha: 'ha riso per il',
  wow: 'è rimasto a bocca aperta per il',
  clap: 'ha applaudito il',
  sad: 'si è commosso per il',
}

// POST /api/posts/like { postId, type? } - mette, cambia o toglie la reazione dell'utente
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireUser()
    if (error) return error
    const body = await request.json()
    const postId = parseInt(body.postId)
    const type = typeof body.type === 'string' && TYPES[body.type] ? body.type : 'like'
    if (!postId) return NextResponse.json({ error: 'postId richiesto' }, { status: 400 })

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, title: true } })
    if (!post) return NextResponse.json({ error: 'Post non trovato' }, { status: 404 })

    const existing = await prisma.like.findFirst({ where: { userId: user!.id, postId } })
    if (existing && (existing.type === type || !body.type)) {
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existing.id } }),
        prisma.post.update({ where: { id: postId }, data: { likes: { decrement: 1 } } }),
      ])
      return NextResponse.json({ reaction: null })
    }
    if (existing) {
      await prisma.like.update({ where: { id: existing.id }, data: { type } })
      return NextResponse.json({ reaction: type })
    }
    await prisma.$transaction([
      prisma.like.create({ data: { userId: user!.id, postId, type } }),
      prisma.post.update({ where: { id: postId }, data: { likes: { increment: 1 } } }),
    ])
    if (post.authorId !== user!.id) {
      const link = `/community#post-${postId}`
      const who = `${user!.nome || 'Qualcuno'} ${user!.cognome || ''}`.trim()
      const message = `${who} ${TYPES[type]} tuo post${post.title ? ` "${post.title}"` : ''}`
      const already = await prisma.notification.findFirst({ where: { userId: post.authorId, type: 'like', link, message, read: false } })
      if (!already) await prisma.notification.create({ data: { userId: post.authorId, type: 'like', title: 'Nuova reazione', message, link } })
    }
    return NextResponse.json({ reaction: type })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
