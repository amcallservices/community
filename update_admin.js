const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function updateAdmin() {
  try {
    // First find user
    let user = await prisma.user.findUnique({ where: { email: 'admin@scrittore.site' } });
    if (!user) {
      // Create admin user
      user = await prisma.user.create({
        data: {
          email: 'admin@scrittore.site',
          name: 'Admin',
          nome: 'Admin',
          cognome: 'Admin',
          password: 'admin123',
          role: 'admin'
        }
      });
      console.log('Created admin user:', user);
    } else {
      // Update role to admin
      const updated = await prisma.user.update({
        where: { email: 'admin@scrittore.site' },
        data: { role: 'admin' }
      });
      console.log('Updated admin user:', updated);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
updateAdmin();
