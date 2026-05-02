import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email richiesta' }, { status: 400 })
    }
    
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json([])
    }
    
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    
    return NextResponse.json(notifications)
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
