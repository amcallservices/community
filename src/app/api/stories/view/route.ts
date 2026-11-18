import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// POST /api/stories/view { id } - segna la storia come vista
export async function POST(request: NextRequest) {
  const me = await getSessionUser().catch(() => null)
  if (!me) return NextResponse.json({ ok: false })
  try {
    const id = parseInt((await request.json()).id)
    const story = id ? await prisma.story.findUnique({ where: { id } }) : null
    if (!story || story.userId === me.id) return NextResponse.json({ ok: false })
    await prisma.storyView.upsert({ where: { storyId_userId: { storyId: id, userId: me.id } }, update: {}, create: { storyId: id, userId: me.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
