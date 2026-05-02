import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, text, userEmail } = body
    let user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 400 })

    // Get post to find author
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return NextResponse.json({ error: 'Post non trovato' }, { status: 404 })

    // Create comment
    const comment = await prisma.comment.create({
      data: { postId, content: text, userId: user.id }
    })

    // Increment comment count on post
    await prisma.post.update({
      where: { id: postId },
      data: { comments: { increment: 1 } }
    })

    // Create notification for post author (if not same user)
    if (post.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'comment',
          title: 'Nuovo commento',
          message: `${user.nome || 'Qualcuno'} ha commentato il tuo post "${post.title}"`,
          link: '/community'
        }
      })
    }

    return NextResponse.json({
      id: comment.id, text: comment.content, postId: comment.postId,
      authorId: user.id, authorNome: user.nome || '', authorCogen: user.cognome || '',
      authorAvatar: user.avatar || null, time: comment.createdAt.toLocaleDateString('it-IT')
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
      include: { user: { select: { id: true, nome: true, cognome: true, avatar: true } } },
      orderBy: { createdAt: 'asc' }
    })
    const formatted = comments.map(c => ({
      id: c.id, text: c.content, authorId: c.userId,
      authorNome: c.user.nome || '', authorCogen: c.user.cognome || '',
      authorAvatar: c.user.avatar || null, time: c.createdAt.toLocaleDateString('it-IT')
    }))
    return NextResponse.json(formatted)
  } catch (error) {
    return NextResponse.json([])
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    
    if (!id || !userId) return NextResponse.json({ error: 'ID e userId richiesti' }, { status: 400 })
    
    const comment = await prisma.comment.findUnique({ where: { id: parseInt(id) } })
    if (!comment) return NextResponse.json({ error: 'Commento non trovato' }, { status: 404 })
    
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
    const isAdmin = user?.role === 'admin'
    
    if (!isAdmin && comment.userId !== parseInt(userId)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    await prisma.comment.delete({ where: { id: parseInt(id) } })
    
    // Decrement comment count on post
    await prisma.post.update({
      where: { id: comment.postId },
      data: { comments: { decrement: 1 } }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
