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
      const isPdf = /\.pdf(\?|#|$)/i.test(url)
      out += /^https?:\/\//i.test(url)
        ? (isPdf
          ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow" class="inline-flex items-center gap-2 my-2 px-4 py-3 rounded-xl border border-line bg-ivory2 font-semibold text-navy hover:bg-white">${esc(m[2] || url)}</a>`
          : `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow" class="text-golddark underline hover:no-underline">${esc(m[2] || url)}</a>`)
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


// Come renderRich, ma separa foto e PDF dal testo, per mostrarli come galleria e riquadri.
export function parseRich(raw: string): { html: string; images: string[]; pdfs: { url: string; label: string }[] } {
  let html = ''
  const images: string[] = []
  const pdfs: { url: string; label: string }[] = []
  let last = 0
  for (const m of raw.matchAll(TOKEN)) {
    html += esc(raw.slice(last, m.index))
    last = (m.index ?? 0) + m[0].length
    if (m[1] !== undefined) {
      const url = m[1]
      if (!/^https?:\/\//i.test(url)) { html += esc(m[0]); continue }
      if (/\.pdf(\?|#|$)/i.test(url)) pdfs.push({ url, label: (m[2] || 'Documento PDF').replace(/^\s*\u{1F4C4}\s*/u, '') })
      else html += `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow" class="text-golddark underline hover:no-underline">${esc(m[2] || url)}</a>`
    } else {
      const src = m[3]
      if (/^(https:\/\/|data:image\/(png|jpe?g|gif|webp);base64,)/i.test(src)) images.push(src)
      else html += esc(m[0])
    }
  }
  html += esc(raw.slice(last))
  return { html: html.replace(/\n{3,}/g, '\n\n').trim(), images, pdfs }
}
