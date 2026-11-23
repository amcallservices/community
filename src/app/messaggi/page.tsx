"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { Send, ArrowLeft, Search, Check, CheckCheck, Clock, AlertCircle, Trash2, ArrowDown, MessageCircle, Smile } from "lucide-react";

type Person = { id: number; nome: string; cognome: string; email?: string; avatar?: string | null };
type Msg = { id: number; senderId: number; receiverId: number; content: string; createdAt: string; read: boolean; status?: "sending" | "failed"; tempKey?: string };

const PALETTE = ["#ffc83d", "#ff6b6b", "#2dd4a7", "#5b3df5", "#38bdf8", "#f472b6"];
const colorFor = (id?: number) => PALETTE[Math.abs(id || 0) % PALETTE.length];
const textOn = (c: string) => (c === "#5b3df5" || c === "#ff6b6b" ? "#fff" : "#1b1464");
const EMOJI = ["\u{1F600}", "\u{1F60D}", "\u{1F44D}", "\u{1F64F}", "\u{1F389}", "❤️", "\u{1F602}", "\u{1F4DA}"];
const POLL_MS = 2500;

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
function dayLabel(iso: string) {
  const d = new Date(iso); const now = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / 86400000);
  if (diff === 0) return "Oggi";
  if (diff === 1) return "Ieri";
  return d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}
function short(iso: string) {
  const d = new Date(iso); const diff = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (diff === 0) return hhmm(iso);
  if (diff === 1) return "Ieri";
  if (diff < 7) return d.toLocaleDateString("it-IT", { weekday: "short" });
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
}
function linkify(text: string) {
  return text.split(/(https?:\/\/[^\s<]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow" className="underline break-all">{part}</a> : <span key={i}>{part}</span>);
}

function Avatar({ p, size = "w-11 h-11" }: { p: Person; size?: string }) {
  const c = colorFor(p.id);
  return <span className={`${size} rounded-full grid place-items-center font-bold overflow-hidden shrink-0`} style={{ background: c, color: textOn(c) }}>{p.avatar ? <img loading="lazy" decoding="async" src={p.avatar} alt="" className="w-full h-full object-cover" /> : (p.nome?.[0] || p.email?.[0] || "?").toUpperCase()}</span>;
}

export default function MessaggiPage() {
  const [me, setMe] = useState<Person | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [selId, setSelId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [fresh, setFresh] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const lastId = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);
  const selRef = useRef<number | null>(null);
  selRef.current = selId;

  // ---- merge dei messaggi in arrivo (senza duplicati) ----
  const merge = useCallback((incoming: Msg[], readIds: number[] = []) => {
    setMsgs(prev => {
      const byId = new Map<number, Msg>();
      const temps: Msg[] = [];
      for (const m of prev) (m.id > 0 ? byId.set(m.id, m) : temps.push(m));
      let added = 0;
      for (const m of incoming) { if (!byId.has(m.id)) added++; byId.set(m.id, { ...byId.get(m.id), ...m }); }
      const rd = new Set(readIds);
      const all = Array.from(byId.values()).map(m => (rd.has(m.id) && !m.read ? { ...m, read: true } : m));
      // i messaggi "in invio" spariscono quando il server ce li ha restituiti
      const keep = temps.filter(t => !all.some(m => m.senderId === t.senderId && m.content === t.content && Math.abs(new Date(m.createdAt).getTime() - new Date(t.createdAt).getTime()) < 60000));
      if (added) {
        const mx = Math.max(...incoming.map(m => m.id));
        if (mx > lastId.current) lastId.current = mx;
      }
      return [...all, ...keep].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { setLoading(false); return; }
    const u = JSON.parse(stored); setMe(u);
    (async () => {
      try {
        const [pr, mr] = await Promise.all([fetch("/api/utenti"), fetch("/api/messages")]);
        if (pr.ok) setPeople((await pr.json()).filter((p: Person) => p.id !== u.id));
        if (mr.ok) { const d: Msg[] = await mr.json(); lastId.current = d.reduce((a, m) => Math.max(a, m.id), 0); setMsgs(d); }
      } catch {}
      const to = parseInt(new URLSearchParams(location.search).get("to") || "");
      if (to) setSelId(to);
      setLoading(false);
    })();
  }, []);

  // ---- aggiornamento quasi in tempo reale: solo i messaggi nuovi, ogni 2,5 s con la scheda aperta ----
  useEffect(() => {
    if (!me) return;
    let busy = false;
    const tick = async () => {
      if (document.hidden || busy) return;
      busy = true;
      try {
        const r = await fetch(`/api/messages?after=${lastId.current}`);
        if (r.ok) {
          const d = await r.json();
          const incoming: Msg[] = d.messages || [];
          const fromOthers = incoming.filter(m => m.senderId !== me.id && m.id > lastId.current);
          if (fromOthers.length && selRef.current && !stick.current) setFresh(f => f + fromOthers.filter(m => m.senderId === selRef.current).length);
          merge(incoming, d.readIds || []);
        }
      } catch {}
      busy = false;
    };
    const t = setInterval(tick, POLL_MS);
    const v = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", v);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", v); };
  }, [me, merge]);

  const peerById = useMemo(() => new Map(people.map(p => [p.id, p])), [people]);
  const sel = selId ? peerById.get(selId) || null : null;

  const convs = useMemo(() => {
    const map = new Map<number, { last: Msg; unread: number }>();
    if (!me) return map;
    for (const m of msgs) {
      const other = m.senderId === me.id ? m.receiverId : m.senderId;
      const c = map.get(other) || { last: m, unread: 0 };
      c.last = m;
      if (m.receiverId === me.id && !m.read) c.unread++;
      map.set(other, c);
    }
    return map;
  }, [msgs, me]);

  const q = query.trim().toLowerCase();
  const matches = (p: Person) => !q || `${p.nome} ${p.cognome}`.toLowerCase().includes(q);
  const withChat = people.filter(p => convs.has(p.id) && matches(p)).sort((a, b) => new Date(convs.get(b.id)!.last.createdAt).getTime() - new Date(convs.get(a.id)!.last.createdAt).getTime());
  const others = people.filter(p => !convs.has(p.id) && matches(p));
  const totalUnread = Array.from(convs.values()).reduce((a, c) => a + c.unread, 0);

  const thread = useMemo(() => me && selId ? msgs.filter(m => (m.senderId === me.id && m.receiverId === selId) || (m.senderId === selId && m.receiverId === me.id)) : [], [msgs, me, selId]);

  // segna come letti i messaggi della conversazione aperta (una sola chiamata)
  useEffect(() => {
    if (!me || !selId || document.hidden) return;
    if (thread.some(m => m.senderId === selId && !m.read)) {
      setMsgs(ms => ms.map(m => (m.senderId === selId && m.receiverId === me.id && !m.read ? { ...m, read: true } : m)));
      fetch(`/api/messages?from=${selId}`, { method: "PUT" }).catch(() => {});
    }
  }, [thread, selId, me]);

  // scorrimento: resta in fondo se ci sei già, altrimenti mostra "nuovi messaggi"
  useEffect(() => {
    const el = box.current; if (!el) return;
    const mine = thread[thread.length - 1]?.senderId === me?.id;
    if (stick.current || mine) { el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); setFresh(0); }
  }, [thread.length, selId]);
  useEffect(() => { stick.current = true; setFresh(0); setTimeout(() => { box.current && (box.current.scrollTop = box.current.scrollHeight); input.current?.focus(); }, 30); }, [selId]);
  useEffect(() => { document.title = totalUnread ? `(${totalUnread}) Messaggi` : "Messaggi"; }, [totalUnread]);

  const onScroll = () => { const el = box.current; if (!el) return; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; if (stick.current) setFresh(0); };

  const post = async (temp: Msg) => {
    try {
      const r = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: temp.receiverId, content: temp.content }) });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setMsgs(ms => ms.filter(m => m.tempKey !== temp.tempKey));
      merge([d.message]);
    } catch {
      setMsgs(ms => ms.map(m => (m.tempKey === temp.tempKey ? { ...m, status: "failed" } : m)));
    }
  };

  const send = () => {
    const content = text.trim();
    if (!content || !me || !selId) return;
    const temp: Msg = { id: -Date.now(), tempKey: String(Date.now()), senderId: me.id, receiverId: selId, content, createdAt: new Date().toISOString(), read: false, status: "sending" };
    setMsgs(ms => [...ms, temp]);
    setText(""); setShowEmoji(false);
    if (input.current) input.current.style.height = "";
    stick.current = true;
    post(temp);
  };

  const retry = (m: Msg) => { setMsgs(ms => ms.map(x => (x.tempKey === m.tempKey ? { ...x, status: "sending" } : x))); post(m); };
  const remove = async (m: Msg) => {
    if (m.id < 0) { setMsgs(ms => ms.filter(x => x.tempKey !== m.tempKey)); return; }
    if (!confirm("Eliminare questo messaggio?")) return;
    const r = await fetch(`/api/messages?id=${m.id}`, { method: "DELETE" });
    if (r.ok) setMsgs(ms => ms.filter(x => x.id !== m.id));
  };

  if (loading) return <div className="max-w-5xl mx-auto p-4 animate-pulse"><div className="h-[70vh] rounded-3xl bg-ivory2" /></div>;
  if (!me) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <MessageCircle className="w-10 h-10 text-wine mx-auto" />
      <h1 className="text-2xl font-extrabold mt-3">Messaggi</h1>
      <p className="text-navy/70 mt-1">Accedi per scrivere agli altri autori.</p>
      <Link href="/login" className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-wine text-white font-semibold">Accedi</Link>
    </div>
  );

  const row = (p: Person) => {
    const c = convs.get(p.id);
    const active = selId === p.id;
    return (
      <button key={p.id} onClick={() => setSelId(p.id)} className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition active:scale-[0.99] ${active ? "bg-wine/10" : "hover:bg-ivory2"}`}>
        <Avatar p={p} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <b className={`truncate ${c?.unread ? "" : "font-semibold"}`}>{p.nome} {p.cognome}</b>
            {c && <span className={`text-xs shrink-0 ${c.unread ? "text-wine font-bold" : "text-navy/50"}`}>{short(c.last.createdAt)}</span>}
          </span>
          {c ? (
            <span className="flex items-center justify-between gap-2">
              <span className={`text-sm truncate ${c.unread ? "font-semibold text-navy" : "text-navy/60"}`}>{c.last.senderId === me.id ? "Tu: " : ""}{c.last.content}</span>
              {c.unread > 0 && <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-wine text-white text-xs font-bold grid place-items-center shrink-0">{c.unread}</span>}
            </span>
          ) : <span className="text-sm text-navy/45">Inizia una conversazione</span>}
        </span>
      </button>
    );
  };

  let lastDay = "";

  return (
    <div className="max-w-5xl mx-auto md:p-4">
      <div className="bg-white md:rounded-3xl md:border border-line md:shadow-sm overflow-hidden flex h-[calc(100dvh-64px)] md:h-[calc(100dvh-64px-2rem)]">
        {/* Elenco */}
        <aside className={`w-full md:w-[340px] md:border-r border-line flex flex-col ${sel ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 pb-2">
            <h1 className="text-2xl font-extrabold flex items-center gap-2">Messaggi{totalUnread > 0 && <span className="px-2.5 py-0.5 rounded-full bg-wine text-white text-sm">{totalUnread}</span>}</h1>
            <div className="relative mt-3"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy/50" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cerca una persona" aria-label="Cerca una persona" className="w-full pl-9 pr-3 py-2.5 rounded-full bg-ivory2 outline-none focus:ring-2 focus:ring-wine/40" /></div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {withChat.length > 0 && <>{withChat.map(row)}</>}
            {others.length > 0 && <><p className="px-3 pt-4 pb-1 text-xs font-bold uppercase tracking-wide text-navy/45">{withChat.length ? "Altri membri" : "Membri"}</p>{others.map(row)}</>}
            {withChat.length === 0 && others.length === 0 && <p className="p-6 text-center text-navy/60">Nessuna persona trovata.</p>}
          </div>
        </aside>

        {/* Chat */}
        <section className={`relative flex-1 min-w-0 flex flex-col bg-ivory/60 ${sel ? "flex" : "hidden md:flex"}`}>
          {sel ? (
            <>
              <header className="bg-white px-3 md:px-4 py-3 border-b border-line flex items-center gap-3">
                <button onClick={() => setSelId(null)} aria-label="Indietro" className="md:hidden p-2 -ml-1 rounded-full hover:bg-ivory2"><ArrowLeft className="w-5 h-5" /></button>
                <Link href={`/utente/${sel.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80"><Avatar p={sel} size="w-10 h-10" /><b className="truncate">{sel.nome} {sel.cognome}</b></Link>
              </header>

              <div ref={box} onScroll={onScroll} className="flex-1 overflow-y-auto px-3 md:px-5 py-4 relative">
                {thread.length === 0 && (
                  <div className="h-full grid place-items-center text-center text-navy/60">
                    <div><Avatar p={sel} size="w-16 h-16 mx-auto text-2xl" /><p className="mt-3 font-semibold text-navy">Scrivi a {sel.nome}</p><p className="text-sm">Il tuo primo messaggio comparirà qui.</p></div>
                  </div>
                )}
                {thread.map((m, i) => {
                  const mine = m.senderId === me.id;
                  const day = dayLabel(m.createdAt);
                  const sep = day !== lastDay; lastDay = day;
                  const prev = thread[i - 1]; const nextM = thread[i + 1];
                  const firstOfGroup = !prev || prev.senderId !== m.senderId || sep;
                  const lastOfGroup = !nextM || nextM.senderId !== m.senderId || dayLabel(nextM.createdAt) !== day;
                  return (
                    <div key={m.tempKey || m.id}>
                      {sep && <div className="text-center my-3"><span className="px-3 py-1 rounded-full bg-white border border-line text-xs font-semibold text-navy/60 capitalize">{day}</span></div>}
                      <div className={`group flex items-end gap-1.5 ${mine ? "justify-end" : "justify-start"} ${firstOfGroup ? "mt-2" : "mt-0.5"}`}>
                        {mine && m.status !== "sending" && <button onClick={() => remove(m)} aria-label="Elimina messaggio" className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-full text-navy/40 hover:text-red-600 hover:bg-white transition"><Trash2 className="w-3.5 h-3.5" /></button>}
                        <div className={`max-w-[80%] px-3.5 py-2 text-[15px] leading-snug whitespace-pre-wrap break-words shadow-sm ${mine ? "bg-wine text-white" : "bg-white border border-line"} ${mine ? `rounded-2xl ${lastOfGroup ? "rounded-br-md" : ""}` : `rounded-2xl ${lastOfGroup ? "rounded-bl-md" : ""}`} ${m.status === "failed" ? "opacity-70" : ""} ${i === thread.length - 1 ? "rise" : ""}`}>
                          {linkify(m.content)}
                          <span className={`float-right ml-3 mt-1.5 text-[11px] inline-flex items-center gap-1 ${mine ? "text-white/70" : "text-navy/45"}`}>
                            {hhmm(m.createdAt)}
                            {mine && (m.status === "sending" ? <Clock className="w-3.5 h-3.5" /> : m.status === "failed" ? <AlertCircle className="w-3.5 h-3.5 text-brass" /> : m.read ? <CheckCheck className="w-4 h-4 text-mint" aria-label="Letto" /> : <Check className="w-4 h-4" aria-label="Inviato" />)}
                          </span>
                        </div>
                      </div>
                      {m.status === "failed" && <div className="text-right text-xs mt-1 text-red-600 font-semibold">Non inviato. <button onClick={() => retry(m)} className="underline">Riprova</button> · <button onClick={() => remove(m)} className="underline">Elimina</button></div>}
                    </div>
                  );
                })}
              </div>

              {fresh > 0 && <button onClick={() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); setFresh(0); }} className="absolute left-1/2 -translate-x-1/2 bottom-24 bg-wine text-white font-semibold px-4 py-2 rounded-full shadow-lg inline-flex items-center gap-2 rise"><ArrowDown className="w-4 h-4" />{fresh} {fresh === 1 ? "nuovo messaggio" : "nuovi messaggi"}</button>}

              <footer className="bg-white border-t border-line p-3">
                {showEmoji && <div className="flex flex-wrap gap-1 mb-2 rise">{EMOJI.map(e => <button key={e} onClick={() => { setText(t => t + e); input.current?.focus(); }} className="w-9 h-9 rounded-full hover:bg-ivory2 hover:scale-125 transition text-xl">{e}</button>)}</div>}
                <div className="flex items-end gap-2">
                  <button onClick={() => setShowEmoji(s => !s)} aria-label="Emoji" aria-pressed={showEmoji} className={`p-2.5 rounded-full transition ${showEmoji ? "bg-ivory2" : "hover:bg-ivory2"} text-navy/60`}><Smile className="w-6 h-6" /></button>
                  <textarea ref={input} rows={1} value={text} maxLength={5000}
                    onChange={e => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"; }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Scrivi un messaggio…" className="flex-1 resize-none rounded-2xl bg-ivory2 px-4 py-2.5 outline-none focus:ring-2 focus:ring-wine/40" />
                  <button onClick={send} disabled={!text.trim()} aria-label="Invia" className="w-11 h-11 rounded-full bg-wine text-white grid place-items-center disabled:opacity-40 hover:brightness-110 active:scale-90 transition"><Send className="w-5 h-5" /></button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-center text-navy/60 p-6"><div><MessageCircle className="w-12 h-12 text-wine/40 mx-auto" /><p className="mt-3 font-semibold text-navy">Scegli una conversazione</p><p className="text-sm">Oppure cerca una persona e scrivile.</p></div></div>
          )}
        </section>
      </div>
    </div>
  );
}
