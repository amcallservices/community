import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const letturaId = parseInt(searchParams.get('letturaId') || '0')
    
    const comments = await prisma.letturaComment.findMany({
      where: { letturaId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return NextResponse.json(comments)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, userId, letturaId } = body
    
    const comment = await prisma.letturaComment.create({
      data: { content, userId, letturaId },
      include: { user: { select: { id: true, name: true, avatar: true } } }
    })
    return NextResponse.json(comment)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
