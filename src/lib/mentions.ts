// Menzioni con @: nel testo compare "@Nome Cognome"; qui si riconoscono gli utenti citati.
type U = { id: number; nome: string | null; cognome: string | null }

const rx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function findMentions(text: string, users: U[]): number[] {
  const ids: number[] = []
  for (const u of users) {
    const full = `${u.nome || ''} ${u.cognome || ''}`.trim()
    if (full.length < 2) continue
    if (new RegExp(`@${rx(full)}(?![\\p{L}\\p{N}])`, 'iu').test(text)) ids.push(u.id)
  }
  return ids
}
