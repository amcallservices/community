import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const videos = await prisma.video.findMany({ orderBy: { createdAt: 'desc' }, take: 20 })
    return NextResponse.json(videos)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, youtubeUrl, description } = body
    const video = await prisma.video.create({
      data: { title, youtubeUrl, description }
    })
    return NextResponse.json(video)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    await prisma.video.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
