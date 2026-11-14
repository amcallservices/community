import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser, getSessionUser, verifyPassword, hashPassword, validatePassword } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = parseInt(id)
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, nome: true, cognome: true, role: true, avatar: true, bio: true, banned: true, createdAt: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // L'email è visibile solo al diretto interessato e agli admin
    const me = await getSessionUser().catch(() => null)
    const canSeePrivate = !!me && (me.id === user.id || me.role === 'admin')

    const [posts, comments, reactions, recent] = await Promise.all([
      prisma.post.count({ where: { authorId: userId } }),
      prisma.comment.count({ where: { userId } }),
      prisma.like.count({ where: { post: { authorId: userId } } }),
      prisma.post.findMany({
        where: { authorId: userId }, orderBy: { createdAt: 'desc' }, take: 8,
        select: { id: true, title: true, content: true, likes: true, comments: true, createdAt: true },
        // il contenuto intero può contenere foto: qui serve solo un'anteprima
      }),
    ])
    const { email, banned, ...pub } = user
    return NextResponse.json({
      ...pub,
      ...(canSeePrivate ? { email } : {}),
      ...(me?.role === 'admin' ? { banned } : {}),
      stats: { posts, comments, reactions },
      recentPosts: recent.map(p => ({
        id: p.id, title: p.title, likes: p.likes, comments: p.comments, createdAt: p.createdAt,
        excerpt: p.content.replace(/<[^>]*>?/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
        photos: (p.content.match(/<img\b/gi) || []).length,
        pdfs: (p.content.match(/\.pdf/gi) || []).length,
      })),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const { id } = await params
    if (parseInt(id) !== user!.id) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    const { currentPassword, newPassword } = await request.json()
    const pwError = validatePassword(newPassword)
    if (pwError) return NextResponse.json({ error: pwError }, { status: 400 })
    if (!currentPassword || !verifyPassword(currentPassword, user!.password)) {
      return NextResponse.json({ error: 'Password attuale non corretta' }, { status: 400 })
    }
    await prisma.user.update({ where: { id: user!.id }, data: { password: hashPassword(newPassword) } })
    return NextResponse.json({ success: true, message: 'Password cambiata con successo' })
  } catch (e) {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
