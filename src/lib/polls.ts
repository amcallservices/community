import prisma from '@/lib/db'

export type PollView = { options: { text: string; votes: number }[]; total: number; mine: number | null }

// Sondaggi dei post indicati, con i voti e la scelta di chi guarda.
export async function pollsFor(postIds: number[], meId: number | null): Promise<Map<number, PollView>> {
  const out = new Map<number, PollView>()
  if (!postIds.length) return out
  const polls = await prisma.poll.findMany({ where: { postId: { in: postIds } } })
  if (!polls.length) return out
  const votes = await prisma.pollVote.findMany({ where: { pollId: { in: polls.map(p => p.id) } }, select: { pollId: true, userId: true, option: true } })
  for (const p of polls) {
    let texts: string[] = []
    try { texts = JSON.parse(p.options) } catch {}
    const mine = votes.filter(v => v.pollId === p.id)
    out.set(p.postId, {
      options: texts.map((text, i) => ({ text, votes: mine.filter(v => v.option === i).length })),
      total: mine.length,
      mine: meId ? (mine.find(v => v.userId === meId)?.option ?? null) : null,
    })
  }
  return out
}

export function cleanOptions(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null
  const opts = raw.map(o => (typeof o === 'string' ? o.trim().slice(0, 80) : '')).filter(Boolean)
  return opts.length >= 2 && opts.length <= 6 ? opts : null
}
