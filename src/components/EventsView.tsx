"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Trash2, CalendarDays, Video, Check, Users, X, Clock, Share2, Link2, MessageCircle } from "lucide-react";
import { SITE_URL } from "@/lib/site";

type Ev = { id: number; title: string; date: string; meetLink?: string | null; description?: string | null; going: number; mine: boolean };

const toDate = (s: string) => new Date(s.replace(" ", "T"));
const pad = (n: number) => String(n).padStart(2, "0");
const utcStamp = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

function when(d: Date) {
  const diff = d.getTime() - Date.now();
  const hhmm = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  if (diff < -3 * 3600000) return { label: "Concluso", live: false, past: true };
  if (diff < 0) return { label: "In corso adesso", live: true, past: false };
  if (diff < 3600000) return { label: `Tra ${Math.max(1, Math.round(diff / 60000))} minuti`, live: true, past: false };
  const days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()) / 86400000);
  if (days === 0) return { label: `Oggi alle ${hhmm}`, live: true, past: false };
  if (days === 1) return { label: `Domani alle ${hhmm}`, live: false, past: false };
  return { label: `Tra ${days} giorni`, live: false, past: false };
}

export default function EventsView({ onlyId }: { onlyId?: number }) {
  const [events, setEvents] = useState<Ev[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState(""); const [link, setLink] = useState(""); const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [toast, setToast] = useState("");
  const isAdmin = user?.role === "admin";
  const say = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  const load = async () => {
    try { const r = await fetch("/api/events?_=" + Date.now()); if (r.ok) setEvents(await r.json()); } catch {}
    setLoading(false);
  };
  useEffect(() => { const s = localStorage.getItem("user"); if (s) setUser(JSON.parse(s)); load(); }, []);

  const { upcoming, past } = useMemo(() => {
    const withD = events.filter(e => !onlyId || e.id === onlyId).map(e => ({ e, d: toDate(e.date) })).filter(x => !isNaN(x.d.getTime()));
    return {
      upcoming: withD.filter(x => !when(x.d).past).sort((a, b) => a.d.getTime() - b.d.getTime()),
      past: withD.filter(x => when(x.d).past).sort((a, b) => b.d.getTime() - a.d.getTime()),
    };
  }, [events]);

  const saveEvent = async () => {
    if (!title.trim() || !date || !time || saving) return;
    setSaving(true);
    try {
      const r = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), date, time, meetLink: link.trim(), description: desc }) });
      if (!r.ok) throw new Error();
      setTitle(""); setDate(""); setTime(""); setLink(""); setDesc(""); setShowForm(false); await load(); say("Evento aggiunto");
    } catch { say("Non sono riuscito a salvare. Riprova."); }
    setSaving(false);
  };

  const deleteEvent = async (id: number) => {
    if (!confirm("Eliminare questo evento? Spariscono anche le iscrizioni.")) return;
    const r = await fetch("/api/events?id=" + id, { method: "DELETE" });
    if (r.ok) { say("Evento eliminato"); load(); } else say("Errore");
  };

  const rsvp = async (ev: Ev) => {
    if (!user) { say("Accedi per partecipare"); return; }
    const before = events;
    setEvents(es => es.map(x => x.id === ev.id ? { ...x, mine: !x.mine, going: x.going + (x.mine ? -1 : 1) } : x));
    try {
      const r = await fetch("/api/events/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: ev.id }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "");
      setEvents(es => es.map(x => x.id === ev.id ? { ...x, mine: d.mine, going: d.going } : x));
      say(d.mine ? "Ti ho iscritto: riceverai un promemoria" : "Iscrizione annullata");
    } catch (e: any) { setEvents(before); say(e?.message || "Non sono riuscito a salvare"); }
  };

  const share = async (ev: Ev, how: "wa" | "fb" | "copy" | "native") => {
    const url = `${SITE_URL}/eventi/${ev.id}`;
    const d = toDate(ev.date);
    const text = `${ev.title} \u2014 ${d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })} alle ${d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}. Iscriviti qui:`;
    if (how === "wa") window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank", "noopener");
    else if (how === "fb") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener");
    else if (how === "native") { try { await navigator.share({ title: ev.title, text, url }); } catch {} }
    else { try { await navigator.clipboard.writeText(url); say("Link copiato"); } catch { say(url); } }
  };
  const canNative = typeof navigator !== "undefined" && !!(navigator as any).share;

  const inp = "w-full p-3 rounded-xl bg-ivory2 border-2 border-transparent focus:border-wine outline-none transition";

  const Card = ({ ev, d }: { ev: Ev; d: Date }) => {
    const w = when(d);
    return (
      <article className={`bg-white rounded-3xl border p-4 md:p-5 transition hover:shadow-md rise ${w.live ? "border-wine shadow-sm" : "border-line"} ${w.past ? "opacity-75" : ""}`}>
        <div className="flex gap-4">
          <div className="w-16 shrink-0 rounded-2xl overflow-hidden text-center border border-line self-start">
            <div className="bg-wine text-white text-xs font-bold uppercase py-1">{d.toLocaleDateString("it-IT", { month: "short" })}</div>
            <div className="text-2xl font-extrabold py-1.5">{d.getDate()}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-lg md:text-xl font-extrabold leading-snug">{ev.title}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-bold shrink-0 ${w.live ? "bg-brass text-navy" : w.past ? "bg-ivory2 text-navy/60" : "bg-ivory2"}`}>{w.label}</span>
            </div>
            <p className="text-navy/65 text-sm mt-1 flex items-center gap-2"><CalendarDays className="w-4 h-4 shrink-0" />{d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ore {d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</p>
            {ev.description && <p className="mt-2 text-navy/80 whitespace-pre-wrap leading-relaxed">{ev.description}</p>}
            <p className="mt-3 text-sm text-navy/60 flex items-center gap-2"><Users className="w-4 h-4" />{ev.going === 0 ? "Sii il primo a iscriverti" : ev.going === 1 ? "1 persona partecipa" : `${ev.going} persone partecipano`}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {!w.past && (
                <button onClick={() => rsvp(ev)} aria-pressed={ev.mine} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition active:scale-95 ${ev.mine ? "bg-mint/30 text-navy hover:bg-mint/50" : "bg-wine text-white hover:brightness-110"}`}>
                  {ev.mine ? <><Check className="w-4 h-4" />Partecipi · annulla</> : "Partecipo"}
                </button>
              )}
              {ev.meetLink && !w.past && <a href={ev.meetLink} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold border-2 transition ${w.live ? "bg-brass border-brass text-navy hover:brightness-105" : "bg-white border-line hover:border-wine"}`}><Video className="w-4 h-4" />Entra su Google Meet</a>}
              {isAdmin && <button onClick={() => deleteEvent(ev.id)} aria-label="Elimina evento" className="p-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 ml-auto"><Trash2 className="w-4 h-4" /></button>}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-line">
              <span className="text-sm font-semibold text-navy/60 flex items-center gap-1.5 mr-1"><Share2 className="w-4 h-4" />Invita un amico</span>
              <button onClick={() => share(ev, "wa")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25d366]/15 text-navy text-sm font-semibold hover:bg-[#25d366]/30"><MessageCircle className="w-4 h-4" />WhatsApp</button>
              <button onClick={() => share(ev, "fb")} className="px-3 py-1.5 rounded-full bg-[#1877f2]/15 text-navy text-sm font-semibold hover:bg-[#1877f2]/30">Facebook</button>
              <button onClick={() => share(ev, "copy")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ivory2 text-sm font-semibold hover:bg-line"><Link2 className="w-4 h-4" />Copia link</button>
              {canNative && <button onClick={() => share(ev, "native")} className="px-3 py-1.5 rounded-full bg-ivory2 text-sm font-semibold hover:bg-line">Altro\u2026</button>}
            </div>
            {ev.mine && !w.past && <p className="mt-3 text-sm text-navy/60 flex items-center gap-2"><Clock className="w-4 h-4" />Riceverai un promemoria 24 ore e 1 ora prima, nella campanella.</p>}
          </div>
        </div>
      </article>
    );
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 md:py-8">
      <header className="rounded-3xl p-6 md:p-8 mb-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(120deg,#1b1464 0%,#5b3df5 70%)" }}>
        <span className="absolute -top-8 -right-6 w-36 h-36 rounded-full opacity-90" style={{ background: "#2dd4a7" }} />
        <span className="absolute bottom-3 right-28 w-12 h-12 rounded-full" style={{ background: "#ffc83d" }} />
        <span className="absolute bottom-6 right-6 w-14 h-14 rounded-2xl rotate-12" style={{ background: "#ff6b6b" }} />
        <div className="relative max-w-xl">
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3"><CalendarDays className="w-8 h-8 text-brass shrink-0" />{onlyId ? "Evento" : "Eventi"}</h1>
          <p className="mt-2 text-white/85 text-lg">Webinar e incontri online con gli altri autori. Iscriviti e ricevi il promemoria.</p>
          {onlyId ? <Link href="/eventi" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 font-semibold hover:bg-white/25">Tutti gli eventi</Link> : isAdmin && <button onClick={() => setShowForm(s => !s)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brass text-navy font-bold hover:brightness-105 active:scale-95 transition"><Plus className="w-4 h-4" />Aggiungi evento</button>}
        </div>
      </header>

      {showForm && isAdmin && (
        <div className="bg-white rounded-3xl border border-line shadow-sm p-5 mb-6 rise">
          <div className="flex items-center justify-between mb-3"><h2 className="font-extrabold text-lg">Nuovo evento</h2><button onClick={() => setShowForm(false)} aria-label="Chiudi" className="p-2 rounded-full hover:bg-ivory2"><X className="w-5 h-5" /></button></div>
          <div className="space-y-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titolo" className={inp} />
            <div className="grid grid-cols-2 gap-3"><input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} aria-label="Data" /><input type="time" value={time} onChange={e => setTime(e.target.value)} className={inp} aria-label="Ora" /></div>
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="Link Google Meet (facoltativo)" className={inp} />
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Di cosa si parla? (facoltativo)" className={`${inp} resize-none`} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveEvent} disabled={!title.trim() || !date || !time || saving} className="px-6 py-2.5 rounded-xl bg-wine text-white font-semibold disabled:opacity-40">{saving ? "Salvo…" : "Salva"}</button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl bg-white border-2 border-line font-semibold">Annulla</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse" aria-busy="true">{[0, 1].map(i => <div key={i} className="h-40 rounded-3xl bg-ivory2" />)}</div>
      ) : (
        <>
          {upcoming.length === 0 ? (
            <div className="bg-white border border-line rounded-3xl p-10 text-center">
              <CalendarDays className="w-10 h-10 text-wine mx-auto" />
              <h2 className="text-xl font-extrabold mt-3">{onlyId ? "Evento non trovato" : "Nessun evento in programma"}</h2>
              <p className="text-navy/70 mt-1">Quando ne pubblichiamo uno, lo trovi qui e ti arriva una notifica.</p>
              <Link href="/community" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-wine text-white font-semibold">Vai alla community</Link>
            </div>
          ) : <div className="space-y-4">{upcoming.map(x => <Card key={x.e.id} ev={x.e} d={x.d} />)}</div>}

          {past.length > 0 && (
            <section className="mt-8">
              <button onClick={() => setShowPast(s => !s)} aria-expanded={showPast} className="font-bold text-navy/70 hover:text-navy">{showPast ? "Nascondi" : "Mostra"} gli eventi passati ({past.length})</button>
              {showPast && <div className="space-y-4 mt-4">{past.map(x => <Card key={x.e.id} ev={x.e} d={x.d} />)}</div>}
            </section>
          )}
        </>
      )}
      {toast && <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-navy text-white px-5 py-3 rounded-full shadow-xl font-semibold text-sm toast">{toast}</div>}
    </main>
  );
}
