import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/utenti - list all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nome: true, cognome: true, email: true, avatar: true, role: true },
      orderBy: { id: 'asc' }
    })
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// DELETE /api/utenti - delete users (and related data)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')
    
    if (!ids) return NextResponse.json({ error: 'IDs richiesti' }, { status: 400 })
    
    const idsArray = ids.split(',').map(Number)
    
    // Get posts by these users first
    const userPosts = await prisma.post.findMany({ where: { authorId: { in: idsArray } }, select: { id: true } })
    const postIds = userPosts.map(p => p.id)
    
    // Delete related data in correct order
    // Delete likes on these posts
    await prisma.like.deleteMany({ where: { postId: { in: postIds } } })
    // Delete likes by these users
    await prisma.like.deleteMany({ where: { userId: { in: idsArray } } })
    // Delete comments on these posts
    await prisma.comment.deleteMany({ where: { postId: { in: postIds } } })
    // Delete posts
    await prisma.post.deleteMany({ where: { authorId: { in: idsArray } } })
    // Delete comments by these users (on other posts)
    await prisma.comment.deleteMany({ where: { userId: { in: idsArray } } })
    // Delete notifications
    await prisma.notification.deleteMany({ where: { userId: { in: idsArray } } })
    // Delete messages
    await prisma.message.deleteMany({ 
      where: { 
        OR: [
          { senderId: { in: idsArray } },
          { receiverId: { in: idsArray } }
        ]
      } 
    })
    
    // Then delete user
    await prisma.user.deleteMany({
      where: { id: { in: idsArray } }
    })
    
    return NextResponse.json({ success: true, deleted: idsArray })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}