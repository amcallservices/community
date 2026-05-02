const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const admin = await prisma.user.findFirst({ where: { email: 'admin@scrittore.site' } });
  console.log('Admin user:', JSON.stringify(admin));
  await prisma.$disconnect();
}
check();
