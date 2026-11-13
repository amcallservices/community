import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser } from '@/lib/auth'

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
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  try {
    const body = await request.json()
    const { content, letturaId } = body
    if (typeof content !== 'string' || !content.trim()) return NextResponse.json({ error: 'Commento vuoto' }, { status: 400 })
    
    const comment = await prisma.letturaComment.create({
      data: { content, userId: user!.id, letturaId },
      include: { user: { select: { id: true, name: true, avatar: true } } }
    })
    return NextResponse.json(comment)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
