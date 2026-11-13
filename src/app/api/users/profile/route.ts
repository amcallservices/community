import { NextResponse } from 'next/server'
import { requireUser, publicUser } from '@/lib/auth'

// Dati del proprio profilo
export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  return NextResponse.json(publicUser(user!))
}
