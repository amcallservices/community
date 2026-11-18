import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import prisma from '@/lib/db'
import { requireUser, getSessionUser, avatarUrl, suspendedError, isStaff } from '@/lib/auth'

const DAY = 24 * 3600 * 1000

// GET /api/stories - storie attive (ultime 24 ore) raggruppate per persona
export async function GET() {
  try {
    const now = new Date()
    // pulizia delle scadute da più di un giorno (righe e file)
    const old = await prisma.story.findMany({ where: { expiresAt: { lt: new Date(now.getTime() - DAY) } }, select: { id: true, mediaUrl: true }, take: 50 })
    if (old.length) {
      await prisma.storyView.deleteMany({ where: { storyId: { in: old.map(o => o.id) } } })
      await prisma.story.deleteMany({ where: { id: { in: old.map(o => o.id) } } })
      del(old.map(o => o.mediaUrl)).catch(() => {})
    }

    const me = await getSessionUser().catch(() => null)
    const stories = await prisma.story.findMany({ where: { expiresAt: { gt: now } }, orderBy: { createdAt: 'asc' }, take: 300 })
    if (!stories.length) return NextResponse.json([])
    const users = await prisma.user.findMany({ where: { id: { in: [...new Set(stories.map(s => s.userId))] }, banned: false }, select: { id: true, nome: true, cognome: true, avatar: true, updatedAt: true } })
    const views = await prisma.storyView.findMany({ where: { storyId: { in: stories.map(s => s.id) } }, select: { storyId: true, userId: true } })

    const groups = users.map(u => {
      const items = stories.filter(s => s.userId === u.id).map(s => {
        const v = views.filter(x => x.storyId === s.id)
        return {
          id: s.id, url: s.mediaUrl, type: s.mediaType, caption: s.caption, createdAt: s.createdAt.toISOString(),
          seen: !!me && (me.id === u.id || v.some(x => x.userId === me.id)),
          views: me && me.id === u.id ? v.length : undefined,
        }
      })
      return { userId: u.id, nome: u.nome || '', cognome: u.cognome || '', avatar: avatarUrl(u), items, hasUnseen: items.some(i => !i.seen), mine: me?.id === u.id }
    }).filter(g => g.items.length)

    groups.sort((a, b) => Number(b.mine) - Number(a.mine) || Number(b.hasUnseen) - Number(a.hasUnseen) || a.nome.localeCompare(b.nome))
    return NextResponse.json(groups)
  } catch {
    return NextResponse.json([])
  }
}

// POST /api/stories { url, type, caption } - pubblica una storia (dura 24 ore)
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  const susp = suspendedError(user!)
  if (susp) return susp
  try {
    const { url, type, caption } = await request.json()
    let host = ''
    try { const u = new URL(String(url)); if (u.protocol === 'https:') host = u.hostname } catch {}
    if (!host.endsWith('.public.blob.vercel-storage.com')) return NextResponse.json({ error: 'File non valido' }, { status: 400 })
    if (!['image', 'video'].includes(type)) return NextResponse.json({ error: 'Tipo non valido' }, { status: 400 })
    const active = await prisma.story.count({ where: { userId: user!.id, expiresAt: { gt: new Date() } } })
    if (active >= 10) return NextResponse.json({ error: 'Puoi avere al massimo 10 storie attive. Elimina una storia per aggiungerne altre.' }, { status: 429 })
    const story = await prisma.story.create({
      data: { userId: user!.id, mediaUrl: String(url), mediaType: type, caption: typeof caption === 'string' && caption.trim() ? caption.trim().slice(0, 140) : null, expiresAt: new Date(Date.now() + DAY) },
    })
    return NextResponse.json({ id: story.id })
  } catch {
    return NextResponse.json({ error: 'Storia non pubblicata, riprova' }, { status: 500 })
  }
}

// DELETE /api/stories?id= - la elimina chi l'ha pubblicata, oppure admin e moderatori
export async function DELETE(request: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  try {
    const id = parseInt(new URL(request.url).searchParams.get('id') || '')
    const story = id ? await prisma.story.findUnique({ where: { id } }) : null
    if (!story) return NextResponse.json({ error: 'Storia non trovata' }, { status: 404 })
    if (story.userId !== user!.id && !isStaff(user!.role)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    await prisma.storyView.deleteMany({ where: { storyId: id } })
    await prisma.story.delete({ where: { id } })
    del(story.mediaUrl).catch(() => {})
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Errore' }, { status: 500 })
  }
}
