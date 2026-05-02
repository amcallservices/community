require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check if admin exists
  let admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  
  if (admin) {
    console.log('Admin già esistente:', admin.email);
    return;
  }
  
  // Create admin
  admin = await prisma.user.create({
    data: {
      email: 'admin@scrittore.site',
      name: 'Admin Master',
      nome: 'Admin',
      cognome: 'Master',
      password: 'admin123',
      role: 'admin'
    }
  });
  
  console.log('Admin creato!');
  console.log('Email:', admin.email);
  console.log('Password: admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
