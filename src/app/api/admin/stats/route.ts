import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireStaff } from '@/lib/auth'

// Solo admin: numeri generali della community
export async function GET() {
  const { user, error } = await requireStaff()
  if (error) return error
  try {
    if (user!.role !== 'admin') return NextResponse.json({ reports: await prisma.report.count({ where: { status: 'open' } }) })
    const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [users, posts, comments, reactions, messages, newUsers, newPosts, banned, reports] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.message.count(),
      prisma.user.count({ where: { createdAt: { gte: week } } }),
      prisma.post.count({ where: { createdAt: { gte: week } } }),
      prisma.user.count({ where: { banned: true } }),
      prisma.report.count({ where: { status: 'open' } }),
    ])
    return NextResponse.json({ users, posts, comments, reactions, messages, newUsers, newPosts, banned, reports })
  } catch {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
