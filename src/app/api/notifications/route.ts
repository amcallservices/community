import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  const notifications = await prisma.notification.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json(notifications)
}
