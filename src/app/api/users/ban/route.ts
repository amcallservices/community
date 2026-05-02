import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, banned } = body
    
    if (email) {
      const user = await prisma.user.update({
        where: { email },
        data: { banned: banned !== undefined ? banned : true }
      })
      return NextResponse.json(user)
    }
    
    if (name) {
      const user = await prisma.user.updateMany({
        where: { name },
        data: { banned: banned !== undefined ? banned : true }
      })
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Email or name required' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Error banning user' }, { status: 500 })
  }
}
