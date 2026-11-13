// Crea o aggiorna gli amministratori con password cifrata.
// Uso (la password NON è scritta nel codice):
//   ADMIN_PASSWORD='la-tua-password' node update_admin.js
// Per scegliere le email: ADMIN_EMAILS='a@x.it,b@y.it' (default: quelle sotto)
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('crypto');
const prisma = new PrismaClient();

const emails = (process.env.ADMIN_EMAILS || 'admin@scrittore.site,stramantonio@gmail.com')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
const password = process.env.ADMIN_PASSWORD;

function hashPassword(p) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(p, salt, 64).toString('hex')}`;
}

async function main() {
  if (!password) throw new Error("Imposta ADMIN_PASSWORD, es.: ADMIN_PASSWORD='...' node update_admin.js");
  for (const email of emails) {
    const hashed = hashPassword(password);
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'admin', password: hashed, banned: false },
      create: { email, name: 'Admin', nome: 'Admin', cognome: '', password: hashed, role: 'admin' },
    });
    console.log(`OK admin: ${user.email}`);
  }
}
main().catch(e => { console.error(e.message || e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
