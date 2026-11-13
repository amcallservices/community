"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, CalendarDays, MessagesSquare, BookOpen, Mail, Store, Sparkles, PenLine, Wand2, Rocket, ChevronDown, ArrowRight } from "lucide-react";

type PostPreview = { id: number; title: string; content: string; authorNome: string; authorCogen?: string; likes?: number };
const plain = (html: string) => (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const TABS = {
  impara: { label: "Impara", items: [
    { href: "/video", icon: GraduationCap, title: "Video corsi", text: "Il self publishing spiegato passo dopo passo." },
    { href: "/eventi", icon: CalendarDays, title: "Eventi e webinar", text: "Incontri dal vivo con altri autori, con link diretto." },
  ]},
  condividi: { label: "Condividi", items: [
    { href: "/community", icon: MessagesSquare, title: "Community", text: "Pubblica, commenta e metti like ai post degli altri autori." },
    { href: "/letture", icon: BookOpen, title: "Letture", text: "Scopri e leggi i libri scritti dai membri." },
    { href: "/messaggi", icon: Mail, title: "Messaggi", text: "Scrivi in privato a chi vuoi conoscere meglio." },
    { href: "https://liberamente.site", icon: Store, title: "Liberamente", text: "Lo store di ebook degli autori indipendenti: scopri e pubblica i tuoi libri.", external: true },
  ]},
  scrivi: { label: "Scrivi", items: [
    { href: "https://scrittoresite.streamlit.app/", icon: Sparkles, title: "Scrittore Site", text: "Il software con chat guidata che ti accompagna dall'idea al libro finito.", external: true },
  ]},
} as const;
type TabKey = keyof typeof TABS;

const FAQ = [
  { q: "Come mi iscrivo?", a: "Clicca su Registrati, inserisci nome, email e una password di almeno 8 caratteri. Dopo l'iscrizione puoi subito pubblicare e commentare." },
  { q: "Ho perso la password, cosa faccio?", a: "Dalla pagina di accesso scegli \"Password dimenticata?\": ti prepariamo un link per sceglierne una nuova." },
  { q: "Cos'è Scrittore Site?", a: "È il nostro software di scrittura: una chat guidata ti aiuta a costruire il libro capitolo dopo capitolo." },
  { q: "Posso scrivere agli altri autori?", a: "Sì, dalla sezione Messaggi puoi scrivere in privato a qualsiasi membro della community." },
];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [tab, setTab] = useState<TabKey>("impara");
  const [faq, setFaq] = useState<number | null>(0);

  useEffect(() => {
    try { const s = localStorage.getItem("user"); if (s) setUser(JSON.parse(s)); } catch {}
    fetch("/api/posts").then(r => (r.ok ? r.json() : [])).then(d => Array.isArray(d) && setPosts(d.slice(0, 3))).catch(() => {});
  }, []);

  const join = user ? "/community" : "/registrati";
  const btnGold = "inline-flex items-center justify-center gap-2 bg-wine text-white font-semibold px-6 py-3.5 rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition";
  const btnRose = "inline-flex items-center justify-center gap-2 bg-gold text-navy font-semibold px-6 py-3.5 rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition";
  const btnLine = "inline-flex items-center justify-center gap-2 bg-white text-navy font-semibold px-6 py-3.5 rounded-xl border border-line hover:-translate-y-0.5 hover:shadow-md transition";

  return (
    <div className="text-navy">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f7e8df] to-ivory">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold bg-white border border-line rounded-full px-4 py-1.5 mb-6"><span className="w-2 h-2 rounded-full bg-gold" />La community degli scrittori italiani</span>
            <h1 className="rise text-4xl md:text-6xl font-bold leading-[1.05]">Scrivi, pubblica e cresci insieme ad altri autori.</h1>
            <p className="rise rise-2 mt-6 text-lg md:text-xl text-navy/75 max-w-xl">Confrontati, impara il self publishing e condividi il tuo percorso con chi scrive come te.</p>
            <div className="rise rise-3 mt-8 flex flex-col sm:flex-row gap-3">
              <Link href={join} className={btnGold}>{user ? "Vai alla community" : "Entra nella community"}<ArrowRight className="w-5 h-5" /></Link>
              <a href="#video" className={btnLine}>Guarda il video</a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
            <div className="absolute -inset-4 bg-gold/20 rounded-[2.5rem] rotate-3" />
            <svg viewBox="0 0 520 520" className="relative w-full drop-shadow-xl">
              <g transform="rotate(-7 170 330)"><rect x="50" y="110" width="230" height="340" rx="10" fill="#3a1420" /><rect x="50" y="110" width="24" height="340" rx="6" fill="#8c2f39" /><text x="96" y="200" fontFamily="Literata Variable, serif" fontStyle="italic" fontSize="32" fill="#fbf5ee">Il mio</text><text x="96" y="240" fontFamily="Literata Variable, serif" fontStyle="italic" fontSize="32" fill="#fbf5ee">primo libro</text><circle cx="165" cy="360" r="32" fill="#8c2f39" /></g>
              <g transform="rotate(6 350 280)"><rect x="240" y="60" width="220" height="330" rx="10" fill="#ffffff" stroke="#e6d9cc" strokeWidth="3" /><text x="266" y="140" fontFamily="Literata Variable, serif" fontStyle="italic" fontSize="30" fill="#3a1420">Storie</text><text x="266" y="176" fontFamily="Literata Variable, serif" fontStyle="italic" fontSize="30" fill="#3a1420">di mare</text><rect x="266" y="320" width="168" height="44" rx="6" fill="#3a1420" /></g>
              <g transform="rotate(-2 330 440)"><rect x="290" y="330" width="190" height="170" rx="10" fill="#8c2f39" /><text x="312" y="395" fontFamily="Literata Variable, serif" fontWeight="700" fontSize="26" fill="#3a1420">Guida KDP</text><text x="312" y="428" fontFamily="Literata Variable, serif" fontSize="17" fill="#3a1420">per principianti</text></g>
            </svg>
          </div>
        </div>
      </section>

      {/* COSA TROVI: tab interattive */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center">Tutto quello che serve a chi scrive</h2>
        <p className="text-center text-navy/70 mt-3">Scegli da dove iniziare.</p>
        <div role="tablist" className="mt-8 flex justify-center gap-2 flex-wrap">
          {(Object.keys(TABS) as TabKey[]).map(k => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`px-6 py-2.5 rounded-full font-semibold border transition ${tab === k ? "bg-navy text-ivory border-navy shadow-md" : "bg-white border-line hover:border-gold"}`}>{TABS[k].label}</button>
          ))}
        </div>
        <div key={tab} className="rise mt-8 grid gap-5 md:grid-cols-3 justify-center">
          {TABS[tab].items.map((it: any) => {
            const Icon = it.icon;
            const inner = (<>
              <span className="w-12 h-12 rounded-xl bg-gold/25 text-golddark grid place-items-center group-hover:bg-gold group-hover:text-navy transition"><Icon className="w-6 h-6" /></span>
              <h3 className="mt-4 text-xl font-bold">{it.title}</h3>
              <p className="mt-2 text-navy/70">{it.text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-golddark font-semibold">Apri <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" /></span>
            </>);
            const cls = "group block bg-white rounded-2xl p-6 border border-line shadow-sm hover:shadow-lg hover:-translate-y-1 transition";
            return it.external
              ? <a key={it.title} href={it.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
              : <Link key={it.title} href={it.href} className={cls}>{inner}</Link>;
          })}
        </div>
      </section>

      {/* SCRITTORE SITE */}
      <section className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="bg-navy text-ivory rounded-3xl p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center overflow-hidden relative">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gold/20" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold">Scrittore Site</h2>
            <p className="mt-4 text-lg text-ivory/80">Il nostro software di scrittura: una chat guidata ti porta dall&rsquo;idea al libro finito, capitolo dopo capitolo.</p>
            <a href="https://scrittoresite.streamlit.app/" target="_blank" rel="noopener noreferrer" className={`${btnRose} mt-8`}>Prova il software<ArrowRight className="w-5 h-5" /></a>
          </div>
          <ol className="relative grid gap-3">
            {[[PenLine, "Scrivi", "Racconti l'idea, la chat ti guida."], [Wand2, "Rivedi", "Migliori il testo capitolo per capitolo."], [Rocket, "Pubblica", "Arrivi al libro pronto da pubblicare."]].map(([I, t, d]: any, i) => (
              <li key={t} className="flex items-center gap-4 bg-white/10 rounded-2xl p-4">
                <span className="w-11 h-11 rounded-xl bg-gold text-navy grid place-items-center shrink-0"><I className="w-5 h-5" /></span>
                <span><b className="block">{i + 1}. {t}</b><span className="text-ivory/75 text-sm">{d}</span></span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* VIDEO (mantenuto) */}
      <section id="video" className="max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-20 scroll-mt-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center">Guarda il video</h2>
        <p className="text-center text-navy/70 mt-3">Due minuti per capire come funziona la community.</p>
        <div className="mt-8 relative w-full rounded-2xl overflow-hidden shadow-xl border border-line" style={{ aspectRatio: "16 / 9" }}>
          <iframe src="https://www.youtube.com/embed/A53E5DZ00sU" title="Video Self Publishing Italia" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" className="absolute inset-0 w-full h-full border-0" />
        </div>
      </section>

      {/* DALLA COMMUNITY */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-16 md:pb-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl md:text-4xl font-bold">Dalla community</h2>
          <Link href="/community" className="text-golddark font-semibold inline-flex items-center gap-1 hover:underline">Vedi tutti <ArrowRight className="w-4 h-4" /></Link>
        </div>
        {posts.length === 0 ? (
          <div className="mt-8 bg-white border border-line rounded-2xl p-8 text-center shadow-sm">
            <h3 className="text-xl font-bold">Qui compariranno i primi post</h3>
            <p className="mt-2 text-navy/70">La community è appena ripartita: scrivi tu il primo, presentati e racconta a cosa stai lavorando.</p>
            <Link href={join} className={`${btnGold} mt-6`}>{user ? "Scrivi un post" : "Registrati e scrivi"}</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {posts.map(p => (
              <article key={p.id} className="bg-white border border-line rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition flex flex-col">
                <h3 className="text-xl font-bold">{p.title}</h3>
                <p className="mt-2 text-navy/70 flex-1">{plain(p.content).slice(0, 140)}{plain(p.content).length > 140 ? "…" : ""}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold"><span className="w-8 h-8 rounded-full bg-gold text-navy grid place-items-center">{(p.authorNome || "?")[0]}</span>{p.authorNome}</span>
                  <Link href="/community" className="text-golddark font-semibold text-sm inline-flex items-center gap-1 hover:underline">Leggi <ArrowRight className="w-4 h-4" /></Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 md:px-8 pb-16 md:pb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center">Domande frequenti</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f, i) => (
            <div key={f.q} className="bg-white border border-line rounded-2xl shadow-sm">
              <button onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i} className="w-full flex items-center justify-between gap-4 text-left p-5 font-semibold">
                {f.q}<ChevronDown className={`w-5 h-5 shrink-0 transition ${faq === i ? "rotate-180 text-golddark" : ""}`} />
              </button>
              {faq === i && <p className="px-5 pb-5 text-navy/75 -mt-1">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA + FOOTER */}
      <section className="bg-navy text-ivory">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">{user ? "Bentornato!" : "Pronto a unirti?"}</h2>
          <p className="mt-3 text-ivory/80 max-w-xl mx-auto">{user ? "Pubblica un post o scrivi a un altro autore." : "Registrati, presentati e pubblica il tuo primo post. Ci vuole un minuto."}</p>
          <Link href={join} className={`${btnRose} mt-8`}>{user ? "Vai alla community" : "Registrati"}<ArrowRight className="w-5 h-5" /></Link>
          <nav className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-ivory/70">
            <Link href="/community" className="hover:text-gold">Community</Link><Link href="/video" className="hover:text-gold">Video corsi</Link><Link href="/eventi" className="hover:text-gold">Eventi</Link><Link href="/letture" className="hover:text-gold">Letture</Link><a href="https://liberamente.site" target="_blank" rel="noopener noreferrer" className="hover:text-gold">Liberamente</a><Link href="/login" className="hover:text-gold">Accedi</Link>
          </nav>
          <p className="mt-6 text-sm text-ivory/50">&copy; 2026 Self Publishing Italia. Tutti i diritti riservati.</p>
        </div>
      </section>
    </div>
  );
}
