// Modelli di consulenza già pronti: chi offre può partire da uno di questi e modificarlo.
export const TEMPLATES = [
  { k: 'copertina-cartaceo', label: 'Copertina libro cartaceo', title: 'Copertina completa per libro cartaceo (KDP)', description: 'Studio della copertina completa (fronte, dorso e retro) con le misure giuste per la stampa su Amazon KDP. Si parte dal genere e dal pubblico, con indicazioni su titolo, sottotitolo e testi di quarta.', durationMin: 60, price: 60 },
  { k: 'copertina-ebook', label: 'Copertina ebook', title: 'Copertina per ebook (Kindle, Kobo, Google Play)', description: 'Analisi della copertina del tuo ebook: cosa funziona nella tua nicchia, come deve apparire in miniatura e come migliorarla. Possibilità di impostare insieme una nuova copertina.', durationMin: 45, price: 40 },
  { k: 'stesura', label: 'Stesura del libro', title: 'Stesura e struttura del libro', description: 'Dalla tua idea a una scaletta chiara: struttura dei capitoli, ritmo, voce dell’autore e un piano di scrittura realistico per arrivare in fondo.', durationMin: 60, price: 70 },
  { k: 'vendite-organico', label: 'Vendite in organico', title: 'Vendite in organico su Amazon', description: 'Come far trovare il tuo libro senza pubblicità: parole chiave, categorie, titolo e sottotitolo, scheda libro e recensioni. Analisi del tuo libro e piano d’azione.', durationMin: 60, price: 80 },
  { k: 'nicchia', label: 'Scelta della nicchia', title: 'Scelta della nicchia e dell’idea di libro', description: 'Capire dove c’è domanda e poca concorrenza, valutare le tue idee e scegliere il libro da pubblicare per primo.', durationMin: 45, price: 50 },
  { k: 'pubblicazione', label: 'Pubblicazione sugli store', title: 'Pubblicazione su Amazon KDP, Liberamente.site e altri store', description: 'Ti accompagno passo passo nella pubblicazione del tuo libro: caricamento dei file, metadati, prezzi e categorie su Amazon KDP, su Liberamente.site e sugli altri store.', durationMin: 60, price: 60 },
  { k: 'revisione', label: 'Revisione della bozza', title: 'Revisione e feedback sulla bozza', description: 'Lettura di un estratto del tuo manoscritto e feedback su stile, coerenza e punti da migliorare prima della pubblicazione.', durationMin: 60, price: 70 },
  { k: 'marketing', label: 'Marketing e social', title: 'Promozione del libro e social', description: 'Piano di lancio e promozione per il tuo libro: pagina autore, contenuti sui social, mailing list e primi lettori.', durationMin: 60, price: 70 },
  { k: 'altro', label: 'Altro', title: '', description: '', durationMin: 30, price: 30 },
] as const

export const categoryLabel = (k: string) => TEMPLATES.find(t => t.k === k)?.label ?? 'Altro'

