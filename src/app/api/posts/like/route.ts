import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// POST /api/posts/like - toggle like on a post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, userId } = body
    
    if (!postId) return NextResponse.json({ error: 'postId richiesto' }, { status: 400 })
    
    // Find user by id or email
    let user = userId ? await prisma.user.findFirst({ where: { id: userId } }) : await prisma.user.findFirst({ where: { email: 'test@test.com' } })
    
    if (!user) {
      user = await prisma.user.create({
        data: { email: 'test@test.com', name: 'Anonimo', password: 'default123' }
      })
    }
    
    // Toggle like
    const existing = await prisma.like.findFirst({
      where: { userId: user.id, postId }
    })
    
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } })
      await prisma.post.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } }
      })
      return NextResponse.json({ liked: false })
    } else {
      await prisma.like.create({
        data: { userId: user.id, postId }
      })
      await prisma.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } }
      })
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}