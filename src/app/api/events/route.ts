import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const events = await prisma.event.findMany({ orderBy: { date: 'asc' }, take: 20 })
    return NextResponse.json(events)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, date, time, meetLink } = body
    
    const dateTime = time ? `${date} ${time}` : date
    
    const event = await prisma.event.create({
      data: { title, date: dateTime, meetLink }
    })
    return NextResponse.json(event)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    await prisma.event.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
