import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import prisma from '@/lib/db'
import { userFromBearer, unauthorized } from '@/lib/apitoken'
import { suspendedError } from '@/lib/auth'
import { SITE_URL } from '@/lib/site'

export const maxDuration = 60

const CATEGORIES = ['generale', 'scrittura', 'kdp', 'copertine', 'marketing', 'recensioni', 'domande', 'novita']
const MAX_IMG = 25 * 1024 * 1024
const MAX_VIDEO = 200 * 1024 * 1024
const MAX_FILES = 10
const PER_DAY = 30
// I file vengono scaricati solo da questi server (archivio di BOOST AI): niente indirizzi arbitrari.
const HOSTS = (process.env.EXTERNAL_MEDIA_HOSTS || '.supabase.co').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
const hostOk = (u: URL) => u.protocol === 'https:' && HOSTS.some(h => (h.startsWith('.') ? u.hostname.endsWith(h) : u.hostname === h))
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

// POST /api/external/posts { title?, content, category?, media?: [{ url, type: 'image' | 'video' }] }
export async function POST(req: NextRequest) {
  const user = await userFromBearer(req)
  if (!user) return unauthorized()
  const susp = suspendedError(user)
  if (susp) return susp
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 }) }
  const text = typeof body.content === 'string' ? body.content.trim() : ''
  const media: { url: string; type: string }[] = Array.isArray(body.media) ? body.media.slice(0, MAX_FILES) : []
  if (!text && !media.length) return NextResponse.json({ error: 'Il post è vuoto' }, { status: 400 })
  if (text.length > 20000) return NextResponse.json({ error: 'Testo troppo lungo' }, { status: 400 })
  const recent = await prisma.post.count({ where: { authorId: user.id, createdAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) } } })
  if (recent >= PER_DAY) return NextResponse.json({ error: 'Limite giornaliero di post raggiunto' }, { status: 429 })

  // Copia i file sull'archivio della community: i link di BOOST AI scadono, i nostri no.
  let html = ''
  for (const m of media) {
    let u: URL
    try { u = new URL(String(m?.url)) } catch { return NextResponse.json({ error: 'Indirizzo del file non valido' }, { status: 400 }) }
    if (!hostOk(u)) return NextResponse.json({ error: 'Origine del file non consentita' }, { status: 400 })
    const isVideo = m.type === 'video'
    const r = await fetch(u, { redirect: 'error' })
    if (!r.ok || !r.body) return NextResponse.json({ error: 'File non scaricabile' }, { status: 400 })
    const ct = (r.headers.get('content-type') || '').split(';')[0]
    const len = Number(r.headers.get('content-length') || 0)
    if (len > (isVideo ? MAX_VIDEO : MAX_IMG)) return NextResponse.json({ error: 'File troppo grande' }, { status: 413 })
    if (isVideo ? !/^video\/(mp4|webm|quicktime)$/.test(ct) : !/^image\/(png|jpeg|webp|gif)$/.test(ct)) return NextResponse.json({ error: 'Tipo di file non consentito' }, { status: 400 })
    const ext = ct.split('/')[1].replace('jpeg', 'jpg').replace('quicktime', 'mov')
    const blob = await put(`boost/${user.id}-${Date.now()}.${ext}`, r.body, { access: 'public', contentType: ct, addRandomSuffix: true })
    html += isVideo ? `\n<video src="${esc(blob.url)}" controls></video>\n` : `\n<img src="${esc(blob.url)}" alt="Immagine" />\n`
  }

  const content = (text.replace(/(^|[\s(])@tutti/gi, '$1tutti') + html).trim()
  const post = await prisma.post.create({
    data: { title: typeof body.title === 'string' ? body.title.slice(0, 200) : '', content, authorId: user.id, category: CATEGORIES.includes(body.category) ? body.category : 'generale' },
  })
  return NextResponse.json({ id: post.id, url: `${SITE_URL}/community#post-${post.id}` })
}
