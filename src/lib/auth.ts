import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

const COOKIE = 'spi_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 giorni

function secret(): string {
  // Imposta AUTH_SECRET su Vercel/Netlify. In mancanza, deriva dal database (comunque non pubblico).
  return process.env.AUTH_SECRET || createHash('sha256').update(process.env.PRISMA_DATABASE_URL || 'dev-secret').digest('hex')
}

/* ---------- Password ---------- */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function isHashed(stored: string): boolean {
  return stored.startsWith('scrypt$')
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!isHashed(stored)) {
    // Vecchi account con password in chiaro: confronto sicuro, poi il login le converte in hash.
    const a = Buffer.from(password)
    const b = Buffer.from(stored)
    return a.length === b.length && timingSafeEqual(a, b)
  }
  const [, salt, hash] = stored.split('$')
  const test = scryptSync(password, salt, 64)
  const real = Buffer.from(hash, 'hex')
  return test.length === real.length && timingSafeEqual(test, real)
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8) return 'La password deve avere almeno 8 caratteri'
  if (password.length > 200) return 'Password troppo lunga'
  return null
}

/* ---------- Sessione (cookie firmato) ---------- */
function sign(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('hex')
}

export function setSession(res: NextResponse, userId: number): void {
  const exp = Date.now() + MAX_AGE * 1000
  const payload = `${userId}.${exp}`
  res.cookies.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export function clearSession(res: NextResponse): void {
  res.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export async function getSessionUser() {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const [id, exp, sig] = token.split('.')
  if (!id || !exp || !sig) return null
  const expected = sign(`${id}.${exp}`)
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  if (Number(exp) < Date.now()) return null
  const user = await prisma.user.findUnique({ where: { id: Number(id) } })
  if (!user || user.banned) return null
  return user
}

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Accesso richiesto' }, { status: 401 }) }
  return { user, error: null }
}

// Se l'utente è sospeso (non può pubblicare) restituisce la risposta d'errore, altrimenti null.
export function suspendedError(u: { suspendedUntil?: Date | null }) {
  if (!u.suspendedUntil || u.suspendedUntil.getTime() <= Date.now()) return null
  const until = u.suspendedUntil.toLocaleString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })
  return NextResponse.json({ error: `Sei sospeso: non puoi pubblicare fino a ${until}.`, suspendedUntil: u.suspendedUntil }, { status: 403 })
}

export async function requireAdmin() {
  const { user, error } = await requireUser()
  if (error) return { user: null, error }
  if (user!.role !== 'admin') return { user: null, error: NextResponse.json({ error: 'Solo admin' }, { status: 403 }) }
  return { user: user!, error: null }
}

// Ruoli: admin, sottoadmin (moderatore + consulenze), moderatore, scrittore
export const isStaff = (role?: string | null) => role === 'admin' || role === 'sottoadmin' || role === 'moderatore'
// Chi può offrire consulenze a pagamento
export const canConsult = (role?: string | null) => role === 'admin' || role === 'sottoadmin'

// Admin o moderatore: può eliminare post/commenti e gestire le segnalazioni (non gli utenti).
export async function requireStaff() {
  const { user, error } = await requireUser()
  if (error) return { user: null, error }
  if (!isStaff(user!.role)) return { user: null, error: NextResponse.json({ error: 'Solo admin e moderatori' }, { status: 403 }) }
  return { user: user!, error: null }
}

export async function requireConsultant() {
  const { user, error } = await requireUser()
  if (error) return { user: null, error }
  if (!canConsult(user!.role)) return { user: null, error: NextResponse.json({ error: 'Solo admin e sotto admin' }, { status: 403 }) }
  return { user: user!, error: null }
}

// Le foto profilo salvate come testo (data:...) si servono da /api/avatar/ID: leggere e con cache.
export function avatarUrl(u: { id: number; avatar: string | null; updatedAt?: Date | null }): string | null {
  if (!u.avatar) return null
  if (!u.avatar.startsWith('data:')) return u.avatar
  return `/api/avatar/${u.id}?v=${u.updatedAt ? u.updatedAt.getTime() : 0}`
}

export function publicUser(u: { id: number; email: string; name: string; nome: string | null; cognome: string | null; role: string; avatar: string | null; updatedAt?: Date | null }) {
  return { id: u.id, email: u.email, name: u.name, nome: u.nome, cognome: u.cognome, role: u.role, avatar: avatarUrl(u) }
}

/* ---------- Recupero password ---------- */
export function newResetToken() {
  const token = randomBytes(32).toString('hex')
  return { token, tokenHash: createHash('sha256').update(token).digest('hex') }
}
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export { sendMail } from './mail'
import { sendMail } from './mail'

export async function sendResetEmail(to: string, link: string): Promise<boolean> {
  return sendMail(to, 'Recupero password - Self Publishing Italia', `<p>Hai chiesto di reimpostare la password.</p><p><a href="${link}">Clicca qui per sceglierne una nuova</a> (il link vale 1 ora).</p><p>Se non sei stato tu, ignora questa email.</p>`)
}
