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

export async function requireAdmin() {
  const { user, error } = await requireUser()
  if (error) return { user: null, error }
  if (user!.role !== 'admin') return { user: null, error: NextResponse.json({ error: 'Solo admin' }, { status: 403 }) }
  return { user: user!, error: null }
}

export function publicUser(u: { id: number; email: string; name: string; nome: string | null; cognome: string | null; role: string; avatar: string | null }) {
  return { id: u.id, email: u.email, name: u.name, nome: u.nome, cognome: u.cognome, role: u.role, avatar: u.avatar }
}

/* ---------- Recupero password ---------- */
export function newResetToken() {
  const token = randomBytes(32).toString('hex')
  return { token, tokenHash: createHash('sha256').update(token).digest('hex') }
}
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function sendResetEmail(to: string, link: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Self Publishing Italia <onboarding@resend.dev>',
      to,
      subject: 'Recupero password - Self Publishing Italia',
      html: `<p>Hai chiesto di reimpostare la password.</p><p><a href="${link}">Clicca qui per sceglierne una nuova</a> (il link vale 1 ora).</p><p>Se non sei stato tu, ignora questa email.</p>`,
    }),
  })
  return res.ok
}
