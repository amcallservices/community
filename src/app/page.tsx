"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FAQ } from "@/lib/site";
import { GraduationCap, CalendarDays, MessagesSquare, Mail, Sparkles, PenLine, Wand2, Rocket, Store, ChevronDown, ArrowRight } from "lucide-react";

type PostPreview = { id: number; title: string; content: string; authorNome: string };
const plain = (html: string) => (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${on ? "in" : ""} ${className}`}>{children}</div>;
}

const WORDS = [
  { w: "scrivere", c: "bg-gold text-navy" },
  { w: "pubblicare", c: "bg-coral text-white" },
  { w: "vendere", c: "bg-mint text-navy" },
  { w: "crescere", c: "bg-wine text-white" },
];
const TOPICS = ["Scrittura", "Self publishing", "Amazon KDP", "Copertine", "Marketing per autori", "Ebook", "Webinar", "Feedback tra autori"];

const STARTS = [
  { key: "idea", emoji: "💡", label: "Ho solo un'idea", title: "Trasforma l'idea in un libro", text: "Con Scrittore Site una chat guidata ti aiuta a costruire il libro capitolo dopo capitolo.", href: "https://scrittoresite.streamlit.app/", cta: "Prova Scrittore Site", external: true },
  { key: "scrivo", emoji: "✍️", label: "Sto scrivendo", title: "Confrontati con altri autori", text: "Condividi i tuoi dubbi nella community e chiedi un parere a chi ci è già passato.", href: "/community", cta: "Vai alla community" },
  { key: "pronto", emoji: "🚀", label: "Il libro è pronto", title: "Portalo ai lettori", text: "Pubblica il tuo ebook su Liberamente, lo store degli autori indipendenti.", href: "https://liberamente.site", cta: "Pubblica su Liberamente", external: true },
  { key: "imparo", emoji: "🎓", label: "Voglio imparare", title: "Guarda i video corsi", text: "Il self publishing spiegato passo dopo passo, quando vuoi.", href: "/video", cta: "Guarda i video" },
] as const;

const QUICK = [
  { href: "/community", icon: MessagesSquare, title: "Community", text: "Pubblica, commenta, metti like.", bg: "bg-gold" },
  { href: "/video", icon: GraduationCap, title: "Video corsi", text: "Impara passo dopo passo.", bg: "bg-coral text-white" },
  { href: "/eventi", icon: CalendarDays, title: "Eventi", text: "Incontri dal vivo con link diretto.", bg: "bg-mint" },
  { href: "/messaggi", icon: Mail, title: "Messaggi", text: "Scrivi in privato agli autori.", bg: "bg-wine text-white" },
];


export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [word, setWord] = useState(0);
  const [start, setStart] = useState<(typeof STARTS)[number]["key"]>("idea");
  const [faq, setFaq] = useState<number | null>(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    try { const s = localStorage.getItem("user"); if (s) setUser(JSON.parse(s)); } catch {}
    fetch("/api/posts").then(r => (r.ok ? r.json() : [])).then(d => Array.isArray(d) && setPosts(d.slice(0, 3))).catch(() => {});
    const t = setInterval(() => setWord(w => (w + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);

  const join = user ? "/community" : "/registrati";
  const base = "inline-flex items-center justify-center gap-2 font-semibold px-6 py-3.5 rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 transition";
  const btnMain = `${base} bg-wine text-white`;
  const btnYellow = `${base} bg-gold text-navy`;
  const btnLine = "inline-flex items-center justify-center gap-2 bg-white text-navy font-semibold px-6 py-3.5 rounded-xl border-2 border-navy/10 hover:border-wine hover:-translate-y-0.5 transition";
  const cur = STARTS.find(s => s.key === start)!;

  return (
    <main className="text-navy overflow-x-hidden">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-[#efe9ff] via-ivory to-[#fff1c9]">
        <div className="absolute -left-20 top-24 w-56 h-56 rounded-full bg-coral/20 blur-2xl" aria-hidden="true" />
        <div className="absolute right-0 bottom-0 w-72 h-72 rounded-full bg-mint/20 blur-2xl" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold bg-white border border-line rounded-full px-4 py-1.5 mb-6 shadow-sm"><span className="w-2 h-2 rounded-full bg-mint animate-pulse" />La community degli scrittori italiani</span>
            <h1 className="rise text-4xl md:text-6xl font-extrabold leading-[1.08]">
              La community per chi vuole{" "}
              <span key={word} className={`rise inline-block px-3 -rotate-1 rounded-xl ${WORDS[word].c}`}>{WORDS[word].w}</span>.
            </h1>
            <p className="rise rise-2 mt-6 text-lg md:text-xl text-navy/75 max-w-xl">Confrontati con altri autori, impara il self publishing e porta i tuoi libri ai lettori.</p>
            <div className="rise rise-3 mt-8 flex flex-col sm:flex-row gap-3">
              <Link href={join} className={btnMain}>{user ? "Vai alla community" : "Entra nella community"}<ArrowRight className="w-5 h-5" /></Link>
              <a href="#video" className={btnLine}>Guarda il video</a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md select-none"
            onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 14, y: ((e.clientY - r.top) / r.height - 0.5) * 14 }); }}
            onMouseLeave={() => setTilt({ x: 0, y: 0 })} aria-hidden="true">
            <div className="absolute -inset-3 bg-wine/10 rounded-[2.5rem] rotate-3" />
            <div className="relative aspect-square" style={{ transform: `translate(${tilt.x}px, ${tilt.y}px)`, transition: "transform .15s" }}>
              <div className="floaty absolute left-[4%] top-[18%] w-[46%] aspect-[2/3] rounded-xl bg-wine shadow-xl p-4 text-white" style={{ ["--r" as any]: "-8deg" }}>
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gold rounded-l-xl" />
                <p className="italic text-lg leading-tight mt-6 ml-3">Il mio primo libro</p><span className="absolute bottom-5 left-7 w-10 h-10 rounded-full bg-gold" />
              </div>
              <div className="floaty absolute right-[2%] top-[4%] w-[44%] aspect-[2/3] rounded-xl bg-white border-2 border-line shadow-xl p-4" style={{ ["--r" as any]: "7deg", animationDelay: ".8s" }}>
                <p className="italic text-lg leading-tight mt-3">Storie di mare</p><span className="absolute bottom-4 left-4 right-4 h-8 rounded-md bg-coral" />
              </div>
              <div className="floaty absolute right-[6%] bottom-[4%] w-[42%] aspect-[4/3] rounded-xl bg-gold shadow-xl p-4" style={{ ["--r" as any]: "-3deg", animationDelay: "1.6s" }}>
                <p className="font-bold text-lg leading-tight">Guida KDP</p><p className="text-sm">per principianti</p>
              </div>
              <span className="absolute left-[40%] bottom-[10%] w-14 h-14 rounded-full bg-mint shadow-lg floaty" />
            </div>
          </div>
        </div>
        {/* striscia argomenti */}
        <div className="relative bg-navy text-ivory py-3 overflow-hidden" aria-hidden="true">
          <div className="marquee flex w-max gap-10 whitespace-nowrap font-semibold">
            {[...TOPICS, ...TOPICS, ...TOPICS, ...TOPICS].map((t, i) => <span key={i} className="flex items-center gap-10">{t}<span className="text-gold">✦</span></span>)}
          </div>
        </div>
      </section>

      {/* DA DOVE PARTI */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-extrabold text-center">Da dove parti?</h2>
          <p className="text-center text-navy/70 mt-3">Scegli dove sei con il tuo libro: ti indichiamo il prossimo passo.</p>
          <div role="tablist" className="mt-8 flex justify-center gap-2 flex-wrap">
            {STARTS.map(s => (
              <button key={s.key} role="tab" aria-selected={start === s.key} onClick={() => setStart(s.key)}
                className={`px-5 py-2.5 rounded-full font-semibold border-2 transition hover:scale-105 ${start === s.key ? "bg-wine text-white border-wine shadow-lg" : "bg-white border-line hover:border-wine"}`}>
                <span aria-hidden="true">{s.emoji}</span> {s.label}
              </button>
            ))}
          </div>
          <div key={cur.key} className="rise mt-8 max-w-2xl mx-auto bg-white border-2 border-line rounded-3xl p-8 text-center shadow-lg">
            <div className="text-5xl" aria-hidden="true">{cur.emoji}</div>
            <h3 className="mt-3 text-2xl font-extrabold">{cur.title}</h3>
            <p className="mt-2 text-navy/75 text-lg">{cur.text}</p>
            {"external" in cur
              ? <a href={cur.href} target="_blank" rel="noopener noreferrer" className={`${btnMain} mt-6`}>{cur.cta}<ArrowRight className="w-5 h-5" /></a>
              : <Link href={cur.href} className={`${btnMain} mt-6`}>{cur.cta}<ArrowRight className="w-5 h-5" /></Link>}
          </div>
        </Reveal>
        <Reveal className="mt-12 grid gap-4 grid-cols-2 md:grid-cols-4">
          {QUICK.map(q => { const I = q.icon; return (
            <Link key={q.title} href={q.href} className={`group ${q.bg} rounded-2xl p-5 shadow-md hover:-translate-y-1.5 hover:rotate-1 hover:shadow-xl transition`}>
              <I className="w-8 h-8 group-hover:scale-110 transition" />
              <h3 className="mt-6 text-lg font-extrabold">{q.title}</h3>
              <p className="text-sm opacity-80">{q.text}</p>
            </Link>); })}
        </Reveal>
      </section>

      {/* SCRITTORE SITE */}
      <section className="max-w-6xl mx-auto px-4 md:px-8">
        <Reveal>
          <div className="bg-navy text-ivory rounded-3xl p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center overflow-hidden relative">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-wine/60" aria-hidden="true" />
            <div className="absolute right-24 -bottom-10 w-28 h-28 rounded-full bg-gold/80" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-extrabold">Scrittore Site</h2>
              <p className="mt-4 text-lg text-ivory/85">Il nostro software di scrittura: una chat guidata ti porta dall&rsquo;idea al libro finito, capitolo dopo capitolo.</p>
              <a href="https://scrittoresite.streamlit.app/" target="_blank" rel="noopener noreferrer" className={`${btnYellow} mt-8`}>Prova il software<ArrowRight className="w-5 h-5" /></a>
            </div>
            <ol className="relative grid gap-3">
              {[[PenLine, "Scrivi", "Racconti l'idea, la chat ti guida."], [Wand2, "Rivedi", "Migliori il testo capitolo per capitolo."], [Rocket, "Pubblica", "Arrivi al libro pronto da pubblicare."]].map(([I, t, d]: any, i) => (
                <li key={t} className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 hover:bg-white/20 hover:translate-x-1 transition">
                  <span className="w-11 h-11 rounded-xl bg-gold text-navy grid place-items-center shrink-0"><I className="w-5 h-5" /></span>
                  <span><b className="block">{i + 1}. {t}</b><span className="text-ivory/75 text-sm">{d}</span></span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* LIBERAMENTE */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 mt-8">
        <Reveal>
          <div className="bg-gradient-to-br from-gold to-[#ffe08a] rounded-3xl p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center shadow-md">
            <ol className="grid gap-3 order-2 md:order-1">
              {[[PenLine, "Scrivi il libro", "Con Scrittore Site o a modo tuo."], [Store, "Pubblicalo su Liberamente", "Il tuo ebook entra nello store."], [Rocket, "Fatti trovare", "Nuovi lettori scoprono i tuoi libri."]].map(([I, t, d]: any, i) => (
                <li key={t} className="flex items-center gap-4 bg-white/70 rounded-2xl p-4 hover:bg-white hover:translate-x-1 transition">
                  <span className="w-11 h-11 rounded-xl bg-wine text-white grid place-items-center shrink-0"><I className="w-5 h-5" /></span>
                  <span><b className="block">{i + 1}. {t}</b><span className="text-navy/70 text-sm">{d}</span></span>
                </li>
              ))}
            </ol>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-extrabold">Liberamente</h2>
              <p className="mt-4 text-lg text-navy/80">Lo store di ebook degli autori indipendenti. Quando il tuo libro è pronto, puoi pubblicarlo su Liberamente e farlo scoprire a nuovi lettori.</p>
              <a href="https://liberamente.site" target="_blank" rel="noopener noreferrer" className={`${btnMain} mt-8`}>Pubblica su Liberamente<ArrowRight className="w-5 h-5" /></a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* VIDEO (mantenuto) */}
      <section id="video" className="max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-20 scroll-mt-20">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-extrabold text-center">Guarda il video</h2>
          <p className="text-center text-navy/70 mt-3">Due minuti per capire come funziona la community.</p>
          <div className="mt-8 relative w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-2 ring-wine/20" style={{ aspectRatio: "16 / 9" }}>
            <iframe src="https://www.youtube.com/embed/A53E5DZ00sU" title="Video Self Publishing Italia" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" className="absolute inset-0 w-full h-full border-0" />
          </div>
        </Reveal>
      </section>

      {/* DALLA COMMUNITY */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-16 md:pb-20">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl md:text-4xl font-extrabold">Dalla community</h2>
            <Link href="/community" className="text-golddark font-semibold inline-flex items-center gap-1 hover:underline">Vedi tutti <ArrowRight className="w-4 h-4" /></Link>
          </div>
          {posts.length === 0 ? (
            <div className="mt-8 bg-white border-2 border-line rounded-3xl p-8 text-center shadow-sm">
              <h3 className="text-xl font-extrabold">Qui compariranno i primi post</h3>
              <p className="mt-2 text-navy/70">La community è appena ripartita: scrivi tu il primo, presentati e racconta a cosa stai lavorando.</p>
              <Link href={join} className={`${btnMain} mt-6`}>{user ? "Scrivi un post" : "Registrati e scrivi"}</Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {posts.map((p, i) => (
                <article key={p.id} className="bg-white border-2 border-line rounded-3xl p-6 shadow-sm flex flex-col" style={{ borderTopColor: ["#ffc83d", "#ff6b6b", "#2dd4a7"][i % 3], borderTopWidth: 6 }}>
                  <h3 className="text-xl font-extrabold">{p.title}</h3>
                  <p className="mt-2 text-navy/70 flex-1">{plain(p.content).slice(0, 140)}{plain(p.content).length > 140 ? "…" : ""}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold"><span className="w-8 h-8 rounded-full bg-wine text-white grid place-items-center">{(p.authorNome || "?")[0]}</span>{p.authorNome}</span>
                    <Link href="/community" className="text-golddark font-semibold text-sm inline-flex items-center gap-1 hover:underline">Leggi <ArrowRight className="w-4 h-4" /></Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 md:px-8 pb-16 md:pb-20">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-extrabold text-center">Domande frequenti</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((f, i) => (
              <div key={f.q} className={`bg-white border-2 rounded-2xl transition ${faq === i ? "border-wine shadow-md" : "border-line"}`}>
                <button onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i} className="w-full flex items-center justify-between gap-4 text-left p-5 font-bold">
                  {f.q}<ChevronDown className={`w-5 h-5 shrink-0 transition ${faq === i ? "rotate-180 text-wine" : ""}`} />
                </button>
                {faq === i && <p className="px-5 pb-5 text-navy/75 -mt-1">{f.a}</p>}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CTA + FOOTER */}
      <section className="bg-navy text-ivory relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-coral/50" aria-hidden="true" />
        <div className="absolute right-10 bottom-10 w-24 h-24 rounded-full bg-gold/70" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold">{user ? "Bentornato!" : "Pronto a unirti?"}</h2>
          <p className="mt-3 text-ivory/85 max-w-xl mx-auto">{user ? "Pubblica un post o scrivi a un altro autore." : "Registrati, presentati e pubblica il tuo primo post. Ci vuole un minuto."}</p>
          <Link href={join} className={`${btnYellow} mt-8`}>{user ? "Vai alla community" : "Registrati"}<ArrowRight className="w-5 h-5" /></Link>
          <nav className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-ivory/75">
            <Link href="/community" className="hover:text-gold">Community</Link><Link href="/video" className="hover:text-gold">Video corsi</Link><Link href="/eventi" className="hover:text-gold">Eventi</Link><Link href="/login" className="hover:text-gold">Accedi</Link>
          </nav>
          <p className="mt-6 text-sm text-ivory/50">&copy; 2026 Self Publishing Italia. Tutti i diritti riservati.</p>
        </div>
      </section>
    </main>
  );
}
