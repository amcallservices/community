import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser } from '@/lib/auth'

// POST /api/posts/like - toggle like (utente dalla sessione)
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireUser()
    if (error) return error
    const { postId } = await request.json()
    if (!postId) return NextResponse.json({ error: 'postId richiesto' }, { status: 400 })

    const existing = await prisma.like.findFirst({ where: { userId: user!.id, postId } })
    if (existing) {
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existing.id } }),
        prisma.post.update({ where: { id: postId }, data: { likes: { decrement: 1 } } }),
      ])
      return NextResponse.json({ liked: false })
    }
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, title: true } })
    if (!post) return NextResponse.json({ error: 'Post non trovato' }, { status: 404 })
    await prisma.$transaction([
      prisma.like.create({ data: { userId: user!.id, postId } }),
      prisma.post.update({ where: { id: postId }, data: { likes: { increment: 1 } } }),
    ])
    if (post.authorId !== user!.id) {
      const link = `/community#post-${postId}`
      const message = `${user!.nome || 'Qualcuno'} ${user!.cognome || ''}`.trim() + ` ha messo mi piace al tuo post "${post.title}"`
      const already = await prisma.notification.findFirst({ where: { userId: post.authorId, type: 'like', link, message, read: false } })
      if (!already) await prisma.notification.create({ data: { userId: post.authorId, type: 'like', title: 'Nuovo mi piace', message, link } })
    }
    return NextResponse.json({ liked: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
