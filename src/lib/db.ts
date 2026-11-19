import { PrismaClient } from '@prisma/client'
import { sendMail } from './mail'

// Su Vercel ogni istanza apre le sue connessioni: ne limitiamo il numero per non
// esaurire quelle del database ("too many connections") quando c'è molto traffico.
function dbUrl() {
  const u = process.env.PRISMA_DATABASE_URL
  if (!u || !/^postgres(ql)?:\/\//i.test(u) || /connection_limit=/i.test(u)) return u
  return u + (u.includes('?') ? '&' : '?') + 'connection_limit=1&pool_timeout=20'
}

const SITE = 'https://selfpublishingitalia.site'
const esc = (t: string) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

type N = { userId: number; title?: string | null; message?: string | null; link?: string | null; type?: string | null }

function create() {
  const base = new PrismaClient({ datasources: { db: { url: dbUrl() } } })

  // Ogni notifica creata sul sito viene inviata anche per email all'indirizzo dell'utente.
  async function mailNotifications(list: N[]) {
    try {
      const ids = [...new Set(list.map(n => n.userId))]
      if (!ids.length) return
      const users = (await base.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true, nome: true, banned: true } })) as unknown as { id: number; email: string | null; nome: string | null; banned: boolean }[]
      const byId = new Map(users.map(u => [u.id, u]))
      await Promise.allSettled(list.map(n => {
        const u = byId.get(n.userId)
        if (!u || !u.email || u.banned) return Promise.resolve(false)
        const link = n.link ? (n.link.startsWith('http') ? n.link : SITE + n.link) : SITE + '/notifiche'
        const title = n.title || 'Nuova notifica'
        const html = `<p>Ciao${u.nome ? ' ' + esc(u.nome) : ''},</p><p><b>${esc(title)}</b></p>${n.message ? `<p>${esc(n.message)}</p>` : ''}<p><a href="${link}">Apri su Self Publishing Italia</a></p>`
        return sendMail(u.email, `${title} - Self Publishing Italia`, html)
      }))
    } catch (e) { console.error('Email notifica fallita:', e) }
  }
  // l'invio prosegue dopo la risposta (su Vercel altrimenti verrebbe interrotto)
  async function queue(list: N[]) {
    if (!list.length) return
    try { const { after } = await import('next/server'); after(() => mailNotifications(list)) }
    catch { mailNotifications(list).catch(() => {}) }
  }

  return base.$extends({
    query: {
      notification: {
        async create({ args, query }) { const r = await query(args); await queue([args.data as unknown as N]); return r },
        async createMany({ args, query }) { const r = await query(args); await queue((Array.isArray(args.data) ? args.data : [args.data]) as unknown as N[]); return r },
      },
    },
  })
}

type Client = ReturnType<typeof create>
const globalForPrisma = global as { prisma?: Client }

export const prisma = globalForPrisma.prisma ?? create()

globalForPrisma.prisma = prisma

export default prisma
