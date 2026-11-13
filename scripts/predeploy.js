// Eseguito prima di "next build" (anche su Vercel):
// 1) crea/aggiorna le tabelle del database (prisma db push, senza mai cancellare dati)
// 2) crea gli account admin se mancano (password da ADMIN_PASSWORD) e assicura il ruolo admin
const { execSync } = require('child_process');
const { randomBytes, scryptSync } = require('crypto');

const url = process.env.PRISMA_DATABASE_URL;
if (!url) {
  console.warn('[predeploy] PRISMA_DATABASE_URL assente: salto database e admin.');
  process.exit(0);
}

try {
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
} catch (e) {
  console.error('[predeploy] prisma db push fallito');
  process.exit(1);
}

function hashPassword(p) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(p, salt, 64).toString('hex')}`;
}

(async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const emails = (process.env.ADMIN_EMAILS || 'admin@scrittore.site,stramantonio@gmail.com')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  const password = process.env.ADMIN_PASSWORD;
  try {
    for (const email of emails) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        if (existing.role !== 'admin') await prisma.user.update({ where: { email }, data: { role: 'admin' } });
        console.log(`[predeploy] admin presente: ${email}`);
      } else if (password) {
        await prisma.user.create({ data: { email, name: 'Admin', nome: 'Admin', cognome: '', password: hashPassword(password), role: 'admin' } });
        console.log(`[predeploy] admin creato: ${email}`);
      } else {
        console.log(`[predeploy] ADMIN_PASSWORD mancante: ${email} non creato`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
})().catch(e => { console.error('[predeploy]', e.message || e); process.exit(1); });
