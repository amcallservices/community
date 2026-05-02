import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userName = searchParams.get('name')
    if (!userName) return NextResponse.json([])
    
    const user = await prisma.user.findFirst({ where: { name: decodeURIComponent(userName) } })
    if (!user) return NextResponse.json([])
    
    const comments = await prisma.comment.findMany({
      where: { userId: user.id },
      include: { post: { select: { title: true, content: true } } },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(comments.map(c => ({
      id: c.id,
      content: c.content,
      postTitle: c.post?.title || c.post?.content?.substring(0, 50),
      createdAt: c.createdAt
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
