// Mostra contenuti dei post/commenti in modo sicuro: tutto l'HTML viene escapato,
// tranne i link http(s) e le immagini (https o data:image) generati dall'editor.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const TOKEN = /<a\s[^>]*?href="([^"]*)"[^>]*>([^<]*)<\/a>|<img\s[^>]*?src="([^"]*)"[^>]*\/?>/gi

export function renderRich(raw: string): string {
  let out = ''
  let last = 0
  for (const m of raw.matchAll(TOKEN)) {
    out += esc(raw.slice(last, m.index))
    last = (m.index ?? 0) + m[0].length
    if (m[1] !== undefined) {
      const url = m[1]
      out += /^https?:\/\//i.test(url)
        ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow" class="text-amber-400 hover:underline">${esc(m[2] || url)}</a>`
        : esc(m[0])
    } else {
      const src = m[3]
      out += /^(https:\/\/|data:image\/(png|jpe?g|gif|webp);base64,)/i.test(src)
        ? `<img src="${esc(src)}" alt="Immagine" loading="lazy" class="max-w-full rounded-lg my-2" />`
        : esc(m[0])
    }
  }
  return out + esc(raw.slice(last))
}
