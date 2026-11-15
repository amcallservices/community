import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin, requireUser, avatarUrl } from '@/lib/auth'

// GET /api/utenti - list all users
export async function GET() {
  const { user: me, error: authError } = await requireUser()
  if (authError) return authError
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nome: true, cognome: true, email: true, avatar: true, role: true, updatedAt: true, banned: true, suspendedUntil: true },
      orderBy: { id: 'asc' }
    })
    // L'email degli iscritti la vedono solo gli admin
    return NextResponse.json(me!.role === 'admin' ? users : users.map(({ email, banned, suspendedUntil, ...u }) => u))
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// DELETE /api/utenti - delete users (and related data)
export async function DELETE(request: NextRequest) {
  const { user: me, error: authError } = await requireAdmin()
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')
    
    if (!ids) return NextResponse.json({ error: 'IDs richiesti' }, { status: 400 })
    
    const idsArray = ids.split(',').map(Number).filter(n => Number.isInteger(n) && n !== me!.id)
    
    // Get posts by these users first
    const userPosts = await prisma.post.findMany({ where: { authorId: { in: idsArray } }, select: { id: true } })
    const postIds = userPosts.map(p => p.id)
    
    // Delete related data in correct order
    const polls = await prisma.poll.findMany({ where: { postId: { in: postIds } }, select: { id: true } })
    await prisma.pollVote.deleteMany({ where: { OR: [{ pollId: { in: polls.map(p => p.id) } }, { userId: { in: idsArray } }] } })
    await prisma.poll.deleteMany({ where: { id: { in: polls.map(p => p.id) } } })
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
    await prisma.passwordReset.deleteMany({ where: { userId: { in: idsArray } } })
    await prisma.letturaComment.deleteMany({ where: { userId: { in: idsArray } } })
    await prisma.eventRsvp.deleteMany({ where: { userId: { in: idsArray } } })
    await prisma.report.deleteMany({ where: { reporterId: { in: idsArray } } })
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