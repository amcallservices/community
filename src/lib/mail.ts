// Invio email (Gmail con password per le app, altrimenti Resend). Nessuna dipendenza dal database.
export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {

  // Gmail (password per le app): funziona verso qualsiasi indirizzo, senza dominio da verificare.
  const gUser = process.env.GMAIL_USER
  const gPass = process.env.GMAIL_APP_PASSWORD
  if (gUser && gPass) {
    try {
      const nodemailer = (await import('nodemailer')).default
      const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: gUser, pass: gPass.replace(/\s+/g, '') } })
      await transport.sendMail({ from: `Self Publishing Italia <${gUser}>`, to, subject, html })
      return true
    } catch (e) {
      console.error('Invio Gmail fallito:', e)
      return false
    }
  }

  const key = process.env.RESEND_API_KEY
  if (!key) return false
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Self Publishing Italia <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  })
  return res.ok
}
