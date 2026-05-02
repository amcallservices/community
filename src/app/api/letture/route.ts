import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const letture = await prisma.lettura.findMany({ orderBy: { createdAt: 'desc' }, take: 20 })
    return NextResponse.json(letture)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, dataUrl, description } = body
    const lettura = await prisma.lettura.create({
      data: { title, dataUrl, description: description || '' }
    })
    return NextResponse.json(lettura)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    await prisma.lettura.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
