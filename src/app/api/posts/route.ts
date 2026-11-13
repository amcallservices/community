import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: { select: { id: true, nome: true, cognome: true, role: true, avatar: true } }
      }
    })
    const transformed = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      authorNome: post.author?.nome || 'Anonimo',
      authorCogen: post.author?.cognome || '',
      authorRole: post.author?.role || 'scrittore',
      authorAvatar: post.author?.avatar || null,
      likes: post.likes,
      comments: post.comments,
      createdAt: post.createdAt.toISOString()
    }))
    return NextResponse.json(transformed)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await requireUser()
    if (authError) return authError
    const body = await request.json()
    const { title, content, category } = body
    if (typeof content !== 'string' || !content.trim() || content.length > 2_000_000) {
      return NextResponse.json({ error: 'Contenuto non valido' }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: { title: title || 'Untitled', content, authorId: user!.id, category: category || 'writing' }
    })
    return NextResponse.json({ 
      id: post.id, title: post.title, content: post.content, authorId: user!.id,
      authorNome: user!.nome || 'Anonimo', authorCogen: user!.cognome || '',
      authorRole: user!.role || 'scrittore', authorAvatar: user!.avatar || null,
      comments: 0, createdAt: post.createdAt.toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '')
    if (!id) return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })

    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return NextResponse.json({ error: 'Post non trovato' }, { status: 404 })
    if (user!.role !== 'admin' && post.authorId !== user!.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    await prisma.$transaction([
      prisma.like.deleteMany({ where: { postId: id } }),
      prisma.comment.deleteMany({ where: { postId: id } }),
      prisma.post.delete({ where: { id } }),
    ])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
