import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/admin/create - create default admin
export async function GET() {
  try {
    // Find or create admin
    let admin = await prisma.user.findFirst({ where: { role: 'admin' } })
    
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'admin@scrittore.site',
          name: 'Admin Master',
          nome: 'Admin',
          cognome: 'Master',
          password: 'admin123',
          role: 'admin'
        }
      })
      return NextResponse.json({ 
        success: true, 
        admin: { email: admin.email, password: 'admin123' },
        message: 'Admin creato!'
      })
    }
    
    return NextResponse.json({ 
      admin: { email: admin.email, role: admin.role },
      message: 'Admin già esistente'
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}