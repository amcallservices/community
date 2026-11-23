"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Plus, Trash2, Play, Search, Share2, Check, ExternalLink, SkipForward, X, Clapperboard } from "lucide-react";
import { timeAgo } from "@/components/NotificationBell";

type Video = { id: number; title: string; youtubeUrl: string; description?: string | null; createdAt?: string };

// Accetta i vari formati di link YouTube (watch, youtu.be, shorts, embed, live) o l'ID da solo
function extractYoutubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
const thumb = (id: string, q: "hq" | "mq" = "hq") => `https://i.ytimg.com/vi/${id}/${q}default.jpg`;
const isNew = (iso?: string) => !!iso && Date.now() - new Date(iso).getTime() < 14 * 86400000;

export default function Page() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState(false);
  const player = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === "admin";

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400); };

  const loadVideos = async () => {
    try {
      const res = await fetch("/api/videos?_=" + Date.now());
      if (res.ok) {
        const data: Video[] = await res.json();
        setVideos(data);
        const h = location.hash.match(/^#v-([\w-]{11})$/);
        const fromHash = h && data.find(v => v.youtubeUrl === h[1]);
        setCurrentId(cur => cur && data.some(v => v.id === cur) ? cur : (fromHash ? fromHash.id : data[0]?.id ?? null));
        if (fromHash) setPlaying(true);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    loadVideos();
  }, []);

  const current = videos.find(v => v.id === currentId) || null;
  const idx = current ? videos.findIndex(v => v.id === current.id) : -1;
  const next = idx >= 0 && videos.length > 1 ? videos[(idx + 1) % videos.length] : null;

  const choose = (v: Video) => {
    setCurrentId(v.id); setPlaying(true);
    history.replaceState(null, "", `#v-${v.youtubeUrl}`);
    player.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const share = async () => {
    if (!current) return;
    try { await navigator.clipboard.writeText(`${location.origin}/video#v-${current.youtubeUrl}`); setCopied(true); setTimeout(() => setCopied(false), 1500); say("Link copiato"); } catch {}
  };

  const ytId = extractYoutubeId(url);

  const saveVideo = async () => {
    if (!title.trim() || !ytId || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/videos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), youtubeUrl: ytId, description: desc.trim() }) });
      if (!res.ok) throw new Error();
      setTitle(""); setUrl(""); setDesc(""); setShowForm(false);
      await loadVideos(); say("Video aggiunto");
    } catch { say("Non sono riuscito a salvare. Riprova."); }
    setSaving(false);
  };

  // Compila il titolo da solo quando incolli il link (se YouTube lo consente)
  useEffect(() => {
    if (!ytId || title) return;
    const ctl = new AbortController();
    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + ytId)}&format=json`, { signal: ctl.signal })
      .then(r => r.ok ? r.json() : null).then(d => { if (d?.title) setTitle(t => t || d.title); }).catch(() => {});
    return () => ctl.abort();
  }, [ytId]);

  const deleteVideo = async (id: number) => {
    if (!confirm("Eliminare questo video?")) return;
    const res = await fetch("/api/videos?id=" + id, { method: "DELETE" });
    if (res.ok) { say("Video eliminato"); setPlaying(false); loadVideos(); } else say("Errore");
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return videos.filter(v => v.id !== currentId && (!q || `${v.title} ${v.description || ""}`.toLowerCase().includes(q)));
  }, [videos, query, currentId]);

  const inp = "w-full p-3 rounded-xl bg-ivory2 border-2 border-transparent focus:border-wine outline-none transition";

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      <header className="rounded-3xl p-6 md:p-8 mb-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(120deg,#1b1464 0%,#5b3df5 70%)" }}>
        <span className="absolute -top-8 -right-6 w-36 h-36 rounded-full opacity-90" style={{ background: "#ffc83d" }} />
        <span className="absolute bottom-3 right-28 w-12 h-12 rounded-full" style={{ background: "#ff6b6b" }} />
        <span className="absolute bottom-6 right-6 w-14 h-14 rounded-2xl rotate-12" style={{ background: "#2dd4a7" }} />
        <div className="relative max-w-xl">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight flex items-center gap-3"><Clapperboard className="w-8 h-8 text-brass shrink-0" />Video corsi</h1>
          <p className="mt-2 text-white/85 text-lg">Impara il self publishing passo dopo passo: dall'idea al libro pubblicato.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {videos.length > 0 && <span className="px-3 py-1.5 rounded-full bg-white/15 text-sm font-semibold">{videos.length} {videos.length === 1 ? "video" : "video"} gratuiti</span>}
            {isAdmin && <button onClick={() => setShowForm(s => !s)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brass text-navy font-bold hover:brightness-105 active:scale-95 transition"><Plus className="w-4 h-4" />Aggiungi video</button>}
          </div>
        </div>
      </header>

      {showForm && isAdmin && (
        <div className="bg-white rounded-3xl border border-line shadow-sm p-5 mb-6 rise">
          <div className="flex items-center justify-between mb-3"><h2 className="font-extrabold text-lg">Nuovo video</h2><button onClick={() => setShowForm(false)} aria-label="Chiudi" className="p-2 rounded-full hover:bg-ivory2"><X className="w-5 h-5" /></button></div>
          <div className="grid md:grid-cols-[220px_1fr] gap-4">
            <div className="aspect-video rounded-2xl bg-ivory2 overflow-hidden grid place-items-center text-navy/50 text-sm text-center px-3">
              {ytId ? <img loading="lazy" decoding="async" src={thumb(ytId)} alt="Anteprima" className="w-full h-full object-cover" /> : "Incolla il link YouTube per vedere l'anteprima"}
            </div>
            <div className="space-y-3">
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Link YouTube (anche youtu.be o shorts)" className={inp} />
              {url && !ytId && <p className="text-sm text-red-600">Questo non sembra un link YouTube valido.</p>}
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titolo" className={inp} />
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Descrizione (facoltativa)" className={`${inp} resize-none`} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveVideo} disabled={!title.trim() || !ytId || saving} className="px-6 py-2.5 rounded-xl bg-wine text-white font-semibold disabled:opacity-40">{saving ? "Salvo…" : "Salva"}</button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl bg-white border-2 border-line font-semibold">Annulla</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse" aria-busy="true"><div className="aspect-video rounded-3xl bg-ivory2" /><div className="h-6 w-1/2 bg-ivory2 rounded mt-4" /></div>
      ) : videos.length === 0 ? (
        <div className="bg-white border border-line rounded-3xl p-10 text-center">
          <Clapperboard className="w-10 h-10 text-wine mx-auto" />
          <h2 className="text-xl font-extrabold mt-3">I video arrivano presto</h2>
          <p className="text-navy/70 mt-1">Intanto puoi seguire la community e fare le tue domande.</p>
          <Link href="/community" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-wine text-white font-semibold">Vai alla community</Link>
        </div>
      ) : (
        <>
          {current && (
            <section ref={player} className="scroll-mt-24">
              <div className="aspect-video rounded-3xl overflow-hidden bg-navy shadow-lg relative">
                {playing ? (
                  <iframe key={current.youtubeUrl} src={`https://www.youtube-nocookie.com/embed/${current.youtubeUrl}?autoplay=1&rel=0`} title={current.title} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
                ) : (
                  <button onClick={() => setPlaying(true)} aria-label={`Guarda: ${current.title}`} className="group absolute inset-0 w-full h-full">
                    <img loading="lazy" decoding="async" src={thumb(current.youtubeUrl)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <span className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
                    <span className="absolute inset-0 grid place-items-center"><span className="w-20 h-20 rounded-full bg-brass text-navy grid place-items-center shadow-2xl group-hover:scale-110 transition"><Play className="w-9 h-9 fill-navy ml-1" /></span></span>
                  </button>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl md:text-2xl font-extrabold leading-tight">{current.title}</h2>
                  <p className="text-sm text-navy/55 mt-1 flex items-center gap-2">{current.createdAt && timeAgo(current.createdAt)}{isNew(current.createdAt) && <span className="px-2 py-0.5 rounded-full bg-mint/30 text-navy text-xs font-bold">Nuovo</span>}</p>
                  {current.description && <p className="mt-2 text-navy/80 whitespace-pre-wrap leading-relaxed">{current.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={share} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-line font-semibold hover:border-wine transition active:scale-95">{copied ? <><Check className="w-4 h-4 text-green-600" />Copiato</> : <><Share2 className="w-4 h-4" />Condividi</>}</button>
                  <a href={`https://www.youtube.com/watch?v=${current.youtubeUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-line font-semibold hover:border-wine transition"><ExternalLink className="w-4 h-4" />YouTube</a>
                  {next && <button onClick={() => choose(next)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-wine text-white font-semibold hover:brightness-110 transition active:scale-95"><SkipForward className="w-4 h-4" />Prossimo</button>}
                  {isAdmin && <button onClick={() => deleteVideo(current.id)} aria-label="Elimina il video" className="p-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            </section>
          )}

          {videos.length > 1 && (
            <section className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-extrabold">Altri video</h2>
                <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy/50" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cerca un video" aria-label="Cerca un video" className="pl-9 pr-3 py-2 rounded-full bg-white border border-line text-sm w-44 focus:w-60 transition-all outline-none focus:border-wine" /></div>
              </div>
              {list.length === 0 ? <p className="text-navy/60">Nessun video trovato.</p> : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map(v => (
                    <div key={v.id} className="group bg-white rounded-2xl border border-line overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:border-wine transition rise relative">
                      <button onClick={() => choose(v)} className="block w-full text-left" aria-label={`Guarda: ${v.title}`}>
                        <div className="aspect-video relative overflow-hidden bg-ivory2">
                          <img src={thumb(v.youtubeUrl)} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                          <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition bg-navy/30"><span className="w-14 h-14 rounded-full bg-brass text-navy grid place-items-center"><Play className="w-6 h-6 fill-navy ml-0.5" /></span></span>
                          {isNew(v.createdAt) && <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-mint text-navy text-xs font-bold">Nuovo</span>}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold leading-snug line-clamp-2">{v.title}</h3>
                          {v.description && <p className="text-sm text-navy/65 mt-1 line-clamp-2">{v.description}</p>}
                          {v.createdAt && <p className="text-xs text-navy/45 mt-2">{timeAgo(v.createdAt)}</p>}
                        </div>
                      </button>
                      {isAdmin && <button onClick={() => deleteVideo(v.id)} aria-label="Elimina il video" className="absolute top-2 right-2 p-2 rounded-full bg-white/90 text-red-600 hover:bg-red-50 shadow"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="mt-10 rounded-3xl bg-white border border-line p-6 text-center">
            <h2 className="text-xl font-extrabold">Hai una domanda su un video?</h2>
            <p className="text-navy/70 mt-1">Chiedila agli altri autori nella community.</p>
            <Link href="/community" className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-wine text-white font-semibold hover:brightness-110">Vai alla community</Link>
          </section>
        </>
      )}
      {toast && <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-navy text-white px-5 py-3 rounded-full shadow-xl font-semibold text-sm toast">{toast}</div>}
    </main>
  );
}
