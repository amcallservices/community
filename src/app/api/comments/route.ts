import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/comments?postId=X - get comments for a post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    if (!postId) return NextResponse.json({ error: 'postId richiesto' }, { status: 400 })
    
    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(postId) },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, nome: true, cognome: true, avatar: true, role: true } }
      }
    })
    
    // Transform to include author info
    const result = comments.map(c => ({
      id: c.id,
      content: c.content,
      postId: c.postId,
      authorId: c.user?.id,
      authorNome: c.user?.nome || 'Anonimo',
      authorCognome: c.user?.cognome || '',
      createdAt: c.createdAt.toISOString()
    }))
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/comments - add a comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, content, userId, userNome, userCogn, userRole, userEmail } = body
    
    if (!postId || !content) return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    
    // Find or create user
    let user = userId ? await prisma.user.findFirst({ where: { id: userId } }) : await prisma.user.findFirst({ where: { email: userEmail || 'test@test.com' } })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail || 'test@test.com',
          name: userNome || 'Anonimo',
          nome: userNome || 'Anonimo',
          cognome: userCogn || '',
          password: 'default123',
          role: userRole || 'scrittore'
        }
      })
    }
    
    const comment = await prisma.comment.create({
      data: {
        content,
        userId: user.id,
        postId: parseInt(postId)
      }
    })
    
    // Update post comment count
    await prisma.post.update({
      where: { id: parseInt(postId) },
      data: { comments: { increment: 1 } }
    })
    
    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      authorId: user.id,
      authorNome: user.nome || 'Anonimo',
      authorCognome: user.cognome || '',
      createdAt: comment.createdAt.toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// DELETE /api/comments?id=X - delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const postId = searchParams.get('postId')
    
    if (!id) return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })
    
    await prisma.comment.delete({ where: { id: parseInt(id) } })
    
    if (postId) {
      await prisma.post.update({
        where: { id: parseInt(postId) },
        data: { comments: { decrement: 1 } }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}