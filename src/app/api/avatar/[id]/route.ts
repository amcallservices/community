import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// Serve la foto profilo come immagine vera (con cache), invece di incollarla dentro ogni risposta.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = parseInt(id)
  if (isNaN(userId)) return new NextResponse(null, { status: 404 })
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } })
  if (!u?.avatar) return new NextResponse(null, { status: 404 })
  const m = u.avatar.match(/^data:(image\/(?:png|jpe?g|gif|webp));base64,([\s\S]+)$/)
  if (!m) {
    if (/^https:\/\//.test(u.avatar)) return NextResponse.redirect(u.avatar)
    return new NextResponse(null, { status: 404 })
  }
  return new NextResponse(Buffer.from(m[2], 'base64'), {
    headers: { 'Content-Type': m[1], 'Cache-Control': 'public, max-age=31536000, immutable' },
  })
}
