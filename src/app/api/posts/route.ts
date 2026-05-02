import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

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
      authorCogn: post.author?.cognome || '',
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
    const body = await request.json()
    const { title, content, category, userEmail } = body
    let user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 400 })

    const post = await prisma.post.create({
      data: { title: title || 'Untitled', content, authorId: user.id, category: category || 'writing' }
    })
    return NextResponse.json({ 
      id: post.id, title: post.title, content: post.content, authorId: user.id,
      authorNome: user.nome || 'Anonimo', authorCogn: user.cognome || '',
      authorRole: user.role || 'scrittore', authorAvatar: user.avatar || null,
      comments: 0, createdAt: post.createdAt.toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    
    if (!id || !userId) return NextResponse.json({ error: 'ID e userId richiesti' }, { status: 400 })
    
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } })
    if (!post) return NextResponse.json({ error: 'Post non trovato' }, { status: 404 })
    
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
    const isAdmin = user?.role === 'admin'
    
    if (!isAdmin && post.authorId !== parseInt(userId)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    await prisma.like.deleteMany({ where: { postId: parseInt(id) } })
    await prisma.comment.deleteMany({ where: { postId: parseInt(id) } })
    await prisma.post.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
