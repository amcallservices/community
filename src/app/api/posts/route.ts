import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireUser, getSessionUser, avatarUrl, suspendedError } from '@/lib/auth'
import { findMentions } from '@/lib/mentions'
import { pollsFor, cleanOptions } from '@/lib/polls'

const CATEGORIES = ['generale', 'scrittura', 'kdp', 'copertine', 'marketing', 'recensioni', 'domande', 'novita']

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: { select: { id: true, nome: true, cognome: true, role: true, avatar: true, updatedAt: true } }
      }
    })
    const me = await getSessionUser().catch(() => null)
    const reacts = await prisma.like.findMany({ where: { postId: { in: posts.map(p => p.id) } }, select: { postId: true, userId: true, type: true } })
    const polls = await pollsFor(posts.map(p => p.id), me?.id ?? null)
    const transformed = posts.map(post => {
      const mine = reacts.filter(r => r.postId === post.id)
      const reactions: Record<string, number> = {}
      for (const r of mine) reactions[r.type] = (reactions[r.type] || 0) + 1
      return {
      reactions,
      myReaction: me ? (mine.find(r => r.userId === me.id)?.type ?? null) : null,
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      authorNome: post.author?.nome || 'Anonimo',
      authorCogen: post.author?.cognome || '',
      authorRole: post.author?.role || 'scrittore',
      authorAvatar: post.author ? avatarUrl(post.author) : null,
      category: post.category,
      poll: polls.get(post.id) ?? null,
      likes: post.likes,
      comments: post.comments,
      createdAt: post.createdAt.toISOString()
      }
    })
    return NextResponse.json(transformed)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await requireUser()
    if (authError) return authError
    const susp = suspendedError(user!)
    if (susp) return susp
    const body = await request.json()
    const { title, content, category, poll } = body
    if (typeof content !== 'string' || !content.trim() || content.length > 2_000_000) {
      return NextResponse.json({ error: 'Contenuto non valido' }, { status: 400 })
    }

    // @tutti: avvisa tutti gli iscritti. Admin senza limiti, gli altri una volta al giorno.
    const callsAll = /(^|[\s(>])@tutti(?![\p{L}\p{N}])/iu.test(content.replace(/<[^>]*>/g, ' '))
    if (callsAll && user!.role !== 'admin') {
      const recent = await prisma.post.count({ where: { authorId: user!.id, createdAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) }, content: { contains: '@tutti', mode: 'insensitive' } } })
      if (recent >= 1) return NextResponse.json({ error: 'Puoi usare @tutti una sola volta al giorno. Togli @tutti dal testo per pubblicare.' }, { status: 429 })
    }

    const post = await prisma.post.create({
      data: { title: typeof title === 'string' ? title.slice(0, 200) : '', content, authorId: user!.id, category: CATEGORIES.includes(category) ? category : 'generale' }
    })
    const pollOptions = poll ? cleanOptions(poll.options) : null
    if (poll && !pollOptions) {
      await prisma.post.delete({ where: { id: post.id } }).catch(() => {})
      return NextResponse.json({ error: 'Il sondaggio deve avere da 2 a 6 risposte' }, { status: 400 })
    }
    if (pollOptions) await prisma.poll.create({ data: { postId: post.id, options: JSON.stringify(pollOptions) } })
    // Notifica a chi è stato citato con @Nome Cognome
    const everyone = await prisma.user.findMany({ where: { banned: false, id: { not: user!.id } }, select: { id: true, nome: true, cognome: true } })
    const who = `${user!.nome || 'Qualcuno'} ${user!.cognome || ''}`.trim()
    const cited = callsAll ? everyone.map(e => e.id) : findMentions(content, everyone)
    if (cited.length) await prisma.notification.createMany({ data: cited.map(id => ({ userId: id, type: 'mention', title: 'Menzione', message: callsAll ? `${who} ha scritto a tutti in un post` : `${who} ti ha menzionato in un post`, link: `/community#post-${post.id}` })) })
    return NextResponse.json({ 
      id: post.id, title: post.title, content: post.content, authorId: user!.id,
      authorNome: user!.nome || 'Anonimo', authorCogen: user!.cognome || '',
      authorRole: user!.role || 'scrittore', authorAvatar: avatarUrl(user!),
      comments: 0, createdAt: post.createdAt.toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '')
    if (!id) return NextResponse.json({ error: 'ID richiesto' }, { status: 400 })

    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return NextResponse.json({ error: 'Post non trovato' }, { status: 404 })
    if (user!.role !== 'admin' && post.authorId !== user!.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const poll = await prisma.poll.findUnique({ where: { postId: id } })
    if (poll) {
      await prisma.pollVote.deleteMany({ where: { pollId: poll.id } })
      await prisma.poll.delete({ where: { id: poll.id } })
    }
    await prisma.$transaction([
      prisma.like.deleteMany({ where: { postId: id } }),
      prisma.comment.deleteMany({ where: { postId: id } }),
      prisma.report.deleteMany({ where: { postId: id } }),
      prisma.post.delete({ where: { id } }),
    ])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
