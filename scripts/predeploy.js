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

// Il database ha un numero limitato di connessioni: se sono tutte occupate riproviamo
// qualche volta. Se non si riesce, il sito va online lo stesso (lo schema esiste già)
// e l'avviso resta nei log.
function sleep(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
let pushed = false;
for (let i = 1; i <= 5 && !pushed; i++) {
  try {
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    pushed = true;
  } catch (e) {
    console.error(`[predeploy] prisma db push fallito (tentativo ${i}/5)`);
    if (i < 5) sleep(15000);
  }
}
if (!pushed) console.warn('[predeploy] db push non riuscito: proseguo senza aggiornare lo schema.');

function hashPassword(p) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(p, salt, 64).toString('hex')}`;
}

(async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url: /connection_limit=/i.test(url) || !/^postgres(ql)?:\/\//i.test(url) ? url : url + (url.includes('?') ? '&' : '?') + 'connection_limit=1' } } });
  const emails = (process.env.ADMIN_EMAILS || 'stramantonio@gmail.com')
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
    // Tre pacchetti di consulenza di partenza (una sola volta): si possono modificare, mettere in pausa o eliminare.
    try {
      const done = await prisma.appFlag.findUnique({ where: { key: 'consulenza_seed' } });
      if (!done) {
        const owner = await prisma.user.findFirst({ where: { role: 'admin' }, orderBy: { id: 'asc' } });
        if (owner) {
          const pk = [
            { category: 'altro', title: 'Consulenza lampo (30 minuti)', description: 'Una sessione breve per sciogliere un dubbio preciso: una copertina, un titolo, un passaggio della pubblicazione. Ideale per avere una risposta chiara in poco tempo.', durationMin: 30, priceCents: 20000 },
            { category: 'altro', title: 'Consulenza completa (60 minuti)', description: 'Un\u2019ora dedicata al tuo libro: analizziamo la situazione, scegliamo cosa migliorare e ti lascio un piano d\u2019azione concreto da seguire subito.', durationMin: 60, priceCents: 35000 },
            { category: 'altro', title: 'Consulenza approfondita (90 minuti)', description: 'Una sessione lunga per lavorare insieme sul progetto dall\u2019idea alla pubblicazione: struttura, copertina, vendite e promozione, con tutto il tempo per le tue domande.', durationMin: 90, priceCents: 50000 },
          ];
          for (const o of pk) await prisma.consulenzaOffer.create({ data: { ...o, userId: owner.id } });
          await prisma.appFlag.create({ data: { key: 'consulenza_seed', value: new Date().toISOString() } });
          console.log('[predeploy] creati i 3 pacchetti di consulenza');
        }
      }
    } catch (e) { console.warn('[predeploy] pacchetti non creati:', e.message || e); }
    // Allinea i prezzi dei tre pacchetti già creati (una sola volta).
    try {
      const v2 = await prisma.appFlag.findUnique({ where: { key: 'consulenza_prezzi_v2' } });
      if (!v2) {
        for (const [t, c] of [['Consulenza lampo (30 minuti)', 20000], ['Consulenza completa (60 minuti)', 35000], ['Consulenza approfondita (90 minuti)', 50000]])
          await prisma.consulenzaOffer.updateMany({ where: { title: t }, data: { priceCents: c } });
        await prisma.appFlag.upsert({ where: { key: 'consulenza_prezzi_v2' }, update: {}, create: { key: 'consulenza_prezzi_v2', value: new Date().toISOString() } });
      }
    } catch (e) { console.warn('[predeploy] prezzi non aggiornati:', e.message || e); }
  } finally {
    await prisma.$disconnect();
  }
})().catch(e => { console.warn('[predeploy] admin non verificati:', e.message || e); process.exit(0); });
