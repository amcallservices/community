// Rende cliccabili #hashtag e @menzioni in un testo già "pulito" da renderRich/parseRich.
// Non tocca i link già presenti: considera solo testo preceduto da spazio o inizio riga.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const rx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type Member = { id: number; nome: string; cognome: string };

export function decorate(html: string, members: Member[] = []): string {
  let out = html.replace(/(^|[\s(])#([\p{L}\p{N}_]{2,30})/gu, (_m, pre, tag) =>
    `${pre}<a href="#" data-tag="${tag}" class="text-wine font-semibold hover:underline">#${tag}</a>`);
  const list = members
    .map(m => ({ id: m.id, name: esc(`${m.nome || ""} ${m.cognome || ""}`.trim()) }))
    .filter(m => m.name.length >= 2)
    .sort((a, b) => b.name.length - a.name.length);
  if (list.length) {
    const byName = new Map(list.map(m => [m.name.toLowerCase(), m.id]));
    const re = new RegExp(`(^|[\\s(])@(${list.map(m => rx(m.name)).join("|")})(?![\\p{L}\\p{N}])`, "giu");
    out = out.replace(re, (_m, pre, name) => `${pre}<a href="/utente/${byName.get(String(name).toLowerCase())}" class="text-wine font-semibold hover:underline">@${name}</a>`);
  }
  out = out.replace(/(^|[\s(])@tutti(?![\p{L}\p{N}])/giu, (_m, pre) => `${pre}<span class="px-1.5 py-0.5 rounded-md bg-brass/40 text-navy font-bold">@tutti</span>`);
  return out;
}

export function hashtagsOf(html: string): string[] {
  const text = html.replace(/<[^>]*>?/g, " ");
  return Array.from(text.matchAll(/(?:^|\s)#([\p{L}\p{N}_]{2,30})/gu)).map(m => m[1].toLowerCase());
}
