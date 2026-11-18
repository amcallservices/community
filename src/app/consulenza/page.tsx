"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, Video, Clock, Mail, Plus, X, Check, Pause, Play, Trash2, Pencil, CreditCard, MessageCircle } from "lucide-react";
import { TEMPLATES, categoryLabel } from "@/lib/consulenza-templates";
import { timeAgo } from "@/components/NotificationBell";

type Seller = { id: number; nome: string; cognome: string; role: string; avatar: string | null; bio: string | null };
type Offer = { id: number; category: string; title: string; description: string; durationMin: number; priceCents: number; active: boolean; mine: boolean; seller: Seller };
type Party = { id: number; nome: string; cognome: string; avatar: string | null };
type Booking = { id: number; title: string; durationMin: number; amountCents: number; status: string; createdAt: string; paidAt: string | null; room: string | null; buyer: Party; seller: Party };

const eur = (c: number) => (c / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: c % 100 ? 2 : 0 });
const COLORS = ["#5b3df5", "#2dd4a7", "#ffc83d", "#ff6b6b", "#38bdf8", "#f472b6"];
const Face = ({ p, size = 44 }: { p: { id: number; nome: string; avatar: string | null }; size?: number }) => p.avatar
  ? <img src={p.avatar} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  : <span className="rounded-full grid place-items-center font-bold text-navy shrink-0" style={{ width: size, height: size, background: COLORS[p.id % COLORS.length] }}>{(p.nome?.[0] || "?").toUpperCase()}</span>;

const STATUS: Record<string, { l: string; c: string }> = {
  pending: { l: "In attesa di pagamento", c: "bg-ivory2" },
  paid: { l: "Pagata: da fissare", c: "bg-mint/30" },
  completed: { l: "Svolta", c: "bg-ivory2 text-navy/60" },
};

export default function ConsulenzaPage() {
  const [user, setUser] = useState<any>(null);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [mine, setMine] = useState<Offer[]>([]);
  const [payments, setPayments] = useState(true);
  const [canOffer, setCanOffer] = useState(false);
  const [bookings, setBookings] = useState<{ asBuyer: Booking[]; asSeller: Booking[]; asStaff?: Booking[] } | null>(null);
  const [cat, setCat] = useState("tutte");
  const [toast, setToast] = useState("");
  const [buying, setBuying] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [banner, setBanner] = useState("");
  const say = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3200); };

  // form offerta
  const [form, setForm] = useState<null | { id?: number; category: string; title: string; description: string; durationMin: string; price: string }>(null);
  const [saving, setSaving] = useState(false);

  const loadOffers = useCallback(async () => {
    try {
      const r = await fetch("/api/consulenza/offers"); const d = await r.json();
      setOffers(d.offers || []); setPayments(!!d.payments); setCanOffer(!!d.canOffer);
      if (d.canOffer) { const m = await (await fetch("/api/consulenza/offers?mine=1")).json(); setMine(m.offers || []); }
    } catch { setOffers([]); }
  }, []);
  const loadBookings = useCallback(async () => {
    try { const r = await fetch("/api/consulenza/bookings"); if (r.ok) setBookings(await r.json()); } catch {}
  }, []);

  useEffect(() => {
    try { const s = localStorage.getItem("user"); if (s) setUser(JSON.parse(s)); } catch {}
    const q = new URLSearchParams(location.search);
    if (q.get("pagato")) setBanner("Grazie! Se il pagamento è andato a buon fine, la consulenza compare qui sotto tra le tue prenotazioni.");
    if (q.get("annullato")) setBanner("Pagamento annullato: non è stato addebitato nulla.");
    loadOffers(); loadBookings();
  }, [loadOffers, loadBookings]);

  // dopo il pagamento Stripe può servire qualche secondo
  useEffect(() => {
    if (!banner.startsWith("Grazie")) return;
    const t = [4000, 10000].map(ms => setTimeout(loadBookings, ms));
    return () => t.forEach(clearTimeout);
  }, [banner, loadBookings]);

  const shown = useMemo(() => (offers || []).filter(o => cat === "tutte" || o.category === cat), [offers, cat]);

  const book = async (o: Offer) => {
    if (!user) { location.href = "/login"; return; }
    setBuying(o.id);
    try {
      const r = await fetch("/api/consulenza/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId: o.id }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error(d.error || "");
      location.href = d.url;
    } catch (e: any) { say(e?.message || "Non riesco ad aprire il pagamento"); setBuying(null); }
  };

  const startForm = (t?: typeof TEMPLATES[number]) => setForm({ category: t?.k || "altro", title: t?.title || "", description: t?.description || "", durationMin: String(t?.durationMin || 30), price: String(t?.price || 30) });
  const editForm = (o: Offer) => setForm({ id: o.id, category: o.category, title: o.title, description: o.description, durationMin: String(o.durationMin), price: String(o.priceCents / 100) });
  const saveForm = async () => {
    if (!form || saving) return;
    setSaving(true);
    try {
      const r = await fetch("/api/consulenza/offers", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "");
      setForm(null); say(form.id ? "Consulenza aggiornata" : "Consulenza pubblicata"); loadOffers();
    } catch (e: any) { say(e?.message || "Non salvata, riprova"); }
    setSaving(false);
  };
  const toggle = async (o: Offer) => {
    const r = await fetch("/api/consulenza/offers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: o.id, active: !o.active }) });
    if (r.ok) { say(o.active ? "Consulenza messa in pausa" : "Consulenza di nuovo visibile"); loadOffers(); } else say("Errore");
  };
  const remove = async (o: Offer) => {
    if (!confirm(`Eliminare “${o.title}”? Le prenotazioni già fatte restano.`)) return;
    const r = await fetch(`/api/consulenza/offers?id=${o.id}`, { method: "DELETE" });
    if (r.ok) { say("Consulenza eliminata"); loadOffers(); } else say("Errore");
  };
  const removeBooking = async (b: Booking) => {
    if (!confirm(`Eliminare la prenotazione “${b.title}”? Non si può annullare.`)) return;
    const r = await fetch(`/api/consulenza/bookings?id=${b.id}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { say("Prenotazione eliminata"); loadBookings(); } else say(d.error || "Errore");
  };
  const complete = async (b: Booking) => {
    const r = await fetch("/api/consulenza/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, action: "complete" }) });
    if (r.ok) { say("Segnata come svolta"); loadBookings(); } else say("Errore");
  };

  const inp = "w-full p-3 rounded-xl bg-ivory2 border-2 border-transparent focus:border-wine outline-none transition";

  const BookingRow = ({ b, as }: { b: Booking; as: "buyer" | "seller" | "staff" }) => {
    const other = as === "buyer" ? b.seller : b.buyer; const st = STATUS[b.status] || STATUS.pending;
    return (
      <div className="bg-white border border-line rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <Face p={other} />
        <div className="min-w-0 flex-1">
          <div className="font-bold">{b.title}</div>
          <div className="text-sm text-navy/60">{as === "buyer" ? "con" : "cliente:"} {other.nome} {other.cognome}{as === "staff" && ` · consulente: ${b.seller.nome} ${b.seller.cognome}`} · {b.durationMin} min · {eur(b.amountCents)} · {timeAgo(b.paidAt || b.createdAt)}</div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${st.c}`}>{st.l}</span>
        {b.room && as === "staff" && b.status !== "pending" && <Link href={`/consulenza/stanza/${b.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-wine text-white font-semibold hover:brightness-110"><Video className="w-4 h-4" />Videochiamata</Link>}
        {b.room && b.status === "paid" && as !== "staff" && <>
          <Link href={`/messaggi?to=${other.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-line font-semibold hover:border-wine"><MessageCircle className="w-4 h-4" />Scrivi per l&apos;orario</Link>
          <Link href={`/consulenza/stanza/${b.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-wine text-white font-semibold hover:brightness-110"><Video className="w-4 h-4" />Google Meet</Link>
          {as === "seller" && <button onClick={() => complete(b)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-mint/30 font-semibold hover:bg-mint/50"><Check className="w-4 h-4" />Svolta</button>}
        </>}
        {(b.status === "pending" || b.status === "completed" || user?.role === "admin") && <button onClick={() => removeBooking(b)} aria-label="Elimina prenotazione" className="p-2 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}
      </div>
    );
  };

  const total = (bookings?.asBuyer.length || 0) + (bookings?.asSeller.length || 0) + (bookings?.asStaff?.length || 0);
  const FIELDS = [
    { bg: "bg-brass", fg: "text-navy", btn: "bg-navy text-white" },
    { bg: "bg-mint", fg: "text-navy", btn: "bg-navy text-white" },
    { bg: "bg-wine", fg: "text-white", btn: "bg-brass text-navy" },
    { bg: "bg-coral", fg: "text-navy", btn: "bg-navy text-white" },
  ];
  const STEPS = [
    ["1. Scegli e paga", "Scegli la consulenza che ti serve e paghi in sicurezza con carta, tramite Stripe."],
    ["2. Fissate l’orario", "Dopo il pagamento scrivi al consulente nei messaggi e fissate giorno e ora."],
    ["3. Videochiamata", "Il consulente ti invia il link di Google Meet nella pagina della consulenza e all’ora stabilita entri in videochiamata. Puoi condividere lo schermo."],
  ];
  const FAQ = [
    ["Come pago?", "Con carta tramite Stripe, il circuito che usano milioni di negozi online. I dati della carta non passano dal nostro sito."],
    ["Quando faccio la consulenza?", "Appena hai pagato, scrivi al consulente dai messaggi e vi accordate sull’orario. Il link di Google Meet compare nella pagina della consulenza, in Le mie prenotazioni."],
    ["Serve installare qualcosa?", "No. Si usa Google Meet dal browser, da computer o da telefono, con microfono e camera."],
    ["Posso farmi rimborsare?", "Se non riuscite a fissare un orario o ci sono problemi, scrivi al consulente: i rimborsi si gestiscono direttamente con lui."],
    ["Chi sono i consulenti?", "Amministratori e sotto admin della community, persone che pubblicano libri ogni giorno."],
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* titolo */}
      <header className="bg-navy text-white rounded-3xl overflow-hidden">
        <div className="p-6 md:p-8">
          <h1 className="font-extrabold text-3xl md:text-4xl flex items-center gap-3"><Briefcase className="w-8 h-8 text-brass shrink-0" />Consulenze</h1>
          <div className="mt-3 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <p className="text-white/85 text-lg max-w-xl">Consulenze in videochiamata su copertine, stesura, vendite e pubblicazione dei tuoi libri. Da 30 minuti, con prezzo chiaro.</p>
            <div className="flex flex-wrap gap-3">
              <a href="#pacchetti" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brass text-navy font-bold hover:brightness-105 active:scale-95 transition">Scegli la consulenza</a>
              {canOffer && <button onClick={() => startForm()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 active:scale-95 transition"><Plus className="w-5 h-5" />Offri una consulenza</button>}
            </div>
          </div>
        </div>
      </header>

      <div>
        {banner && <div role="status" className="mt-6 rounded-2xl bg-mint/25 p-4 font-semibold flex items-start gap-3"><span className="flex-1">{banner}</span><button onClick={() => setBanner("")} aria-label="Chiudi" className="p-1"><X className="w-4 h-4" /></button></div>}
        {!payments && canOffer && <div className="mt-6 rounded-2xl bg-brass/30 p-4 text-sm"><b>Pagamenti non ancora attivi.</b> Per incassare serve la chiave segreta di Stripe (<code>STRIPE_SECRET_KEY</code>) nelle impostazioni del sito. Finché manca, nessuno può prenotare.</div>}

        {/* le mie prenotazioni */}
        {user && bookings && total > 0 && (
          <section className="mt-6" aria-labelledby="h-pren">
            <h2 id="h-pren" className="text-xl font-extrabold mb-3">Le mie prenotazioni</h2>
            <div className="space-y-3">
              {bookings.asSeller.map(b => <BookingRow key={"s" + b.id} b={b} as="seller" />)}
              {bookings.asBuyer.map(b => <BookingRow key={"b" + b.id} b={b} as="buyer" />)}
            </div>
            {(bookings.asStaff?.length || 0) > 0 && <>
              <h3 className="font-bold mt-5 mb-2">Altre consulenze: admin e sotto admin partecipano a tutte</h3>
              <div className="space-y-3">{bookings.asStaff!.map(b => <BookingRow key={"t" + b.id} b={b} as="staff" />)}</div>
            </>}
          </section>
        )}

        {/* pacchetti */}
        <section id="pacchetti" className="mt-8 scroll-mt-20" aria-labelledby="h-pack">
          <h2 id="h-pack" className="text-xl font-extrabold">Consulenze disponibili</h2>
          <div className="flex gap-1.5 overflow-x-auto py-3" role="group" aria-label="Categorie">
            {[{ k: "tutte", label: "Tutte" }, ...TEMPLATES.filter(t => t.k !== "altro")].map(t => (
              <button key={t.k} onClick={() => setCat(t.k)} aria-pressed={cat === t.k} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition ${cat === t.k ? "bg-navy text-white" : "bg-ivory2 hover:bg-line"}`}>{t.label}</button>
            ))}
          </div>
          {offers === null ? <div className="h-64 rounded-3xl bg-ivory2 animate-pulse" aria-busy="true" /> : shown.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[...shown].sort((a, b) => a.priceCents - b.priceCents).map((o, i) => {
                const f = FIELDS[i % FIELDS.length];
                return (
                  <article key={o.id} className={`${f.bg} ${f.fg} rounded-3xl p-5 flex flex-col rise`}>
                    <div className="text-xs font-bold opacity-80">{categoryLabel(o.category)} · {o.durationMin} minuti</div>
                    <h3 className="text-lg font-extrabold leading-snug mt-2">{o.title}</h3>
                    <div className="flex-1"><p className={`mt-2 text-sm leading-relaxed whitespace-pre-wrap ${open === o.id ? "" : "line-clamp-6"}`}>{o.description}</p>{o.description.length > 280 && <button onClick={() => setOpen(open === o.id ? null : o.id)} className="mt-2 text-sm font-bold underline underline-offset-4">{open === o.id ? "Mostra meno" : "Leggi tutto"}</button>}</div>
                    <Link href={`/utente/${o.seller.id}`} className="mt-5 flex items-center gap-3 hover:underline"><Face p={o.seller} size={36} /><span className="font-bold truncate">{o.seller.nome} {o.seller.cognome}</span></Link>
                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div className="text-2xl font-extrabold leading-none">{eur(o.priceCents)}</div>
                      {o.mine ? <span className="text-sm font-bold opacity-80">La tua offerta</span>
                        : <button onClick={() => book(o)} disabled={buying === o.id} className={`${f.btn} px-5 py-2.5 rounded-xl font-semibold hover:brightness-110 active:scale-95 transition disabled:opacity-60`}>{buying === o.id ? "Apro…" : "Prenota"}</button>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-ivory2 rounded-3xl p-10 text-center text-lg">{(offers || []).length === 0 ? "Le prime consulenze arrivano presto." : "Nessuna consulenza in questa categoria."}</div>
          )}
        </section>

        {/* come funziona */}
        <section className="mt-8" aria-labelledby="h-how">
          <h2 id="h-how" className="text-xl font-extrabold mb-3">Come funziona</h2>
          <ol className="space-y-4">
            {STEPS.map(([t, d], i) => (
              <li key={i} className="max-w-3xl">
                <div className="text-lg font-extrabold">{t}</div>
                <p className="mt-1 text-sm text-navy/70 max-w-xl">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* di cosa si può parlare */}
        <section className="mt-8" aria-labelledby="h-topics">
          <h2 id="h-topics" className="text-xl font-extrabold">Di cosa si può parlare</h2>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            {TEMPLATES.filter(t => t.k !== "altro").map((t, i) => (
              <div key={t.k} className={`${i % 3 === 0 ? "bg-ivory2" : i % 3 === 1 ? "bg-navy text-white" : "bg-brass/40"} rounded-2xl p-4 flex flex-col`}>
                <h3 className="font-bold">{t.title}</h3>
                <p className="mt-1 text-sm opacity-85 flex-1">{t.description}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm font-semibold"><span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />circa {t.durationMin} minuti · {eur(t.price * 100)}</span>{canOffer && <button onClick={() => startForm(t)} className="underline underline-offset-4">Offri questa</button>}</div>
              </div>
            ))}
          </div>
        </section>

        {/* domande */}
        <section className="mt-8" aria-labelledby="h-faq">
          <h2 id="h-faq" className="text-xl font-extrabold">Domande frequenti</h2>
          <div className="mt-3 space-y-2">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group bg-ivory2 rounded-2xl open:bg-wine open:text-white transition-colors">
                <summary className="cursor-pointer list-none p-4 font-bold flex items-center justify-between gap-4">{q}<Plus className="w-6 h-6 shrink-0 transition-transform group-open:rotate-45" /></summary>
                <p className="px-4 pb-4 text-sm max-w-3xl">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* videochiamata in diretta (solo admin e sotto admin) */}
        {canOffer && (
          <section className="mt-8" aria-labelledby="h-live">
            <h2 id="h-live" className="text-xl font-extrabold">Riunione in diretta</h2>
            <div className="mt-3 bg-ivory2 rounded-2xl p-4 flex flex-wrap items-center gap-3">
              <p className="flex-1 min-w-[220px] text-sm text-navy/80">Avvia subito una riunione su Google Meet e condividi il link con chi vuoi invitare. Puoi presentare lo schermo e, dalle impostazioni di Meet, registrare.</p>
              <a href="https://meet.new" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wine text-white font-semibold hover:brightness-110 active:scale-95 transition"><Video className="w-4 h-4" />Avvia con Google Meet</a>
            </div>
          </section>
        )}

        {/* gestione offerte (solo staff) */}
        {canOffer && (
          <section className="mt-8" aria-labelledby="h-mine">
            <div className="flex items-end justify-between gap-3 mb-4"><h2 id="h-mine" className="text-xl font-extrabold">Le tue consulenze</h2><button onClick={() => startForm()} className="font-bold text-wine hover:underline">+ Nuova</button></div>
            {mine.length === 0 ? <p className="text-navy/70">Non hai ancora offerte. Scegli un modello tra gli esempi qui sopra oppure creane una tua.</p> : (
              <div className="space-y-3">{mine.map(o => (
                <div key={o.id} className={`bg-ivory2 rounded-2xl p-4 flex flex-wrap items-center gap-3 ${o.active ? "" : "opacity-60"}`}>
                  <div className="min-w-0 flex-1"><b>{o.title}</b><div className="text-sm text-navy/70">{categoryLabel(o.category)} · {o.durationMin} min · {eur(o.priceCents)} {!o.active && "· in pausa"}</div></div>
                  <button onClick={() => editForm(o)} aria-label="Modifica" className="p-2 rounded-lg hover:bg-white"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => toggle(o)} aria-label={o.active ? "Metti in pausa" : "Riattiva"} className="p-2 rounded-lg hover:bg-white">{o.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
                  <button onClick={() => remove(o)} aria-label="Elimina" className="p-2 rounded-lg text-red-600 hover:bg-white"><Trash2 className="w-4 h-4" /></button>
                </div>))}
              </div>
            )}
          </section>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-navy/60 grid place-items-center p-4" onClick={() => setForm(null)} role="dialog" aria-modal="true" aria-label="Offerta di consulenza">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl rise max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3"><h2 className="text-xl font-extrabold">{form.id ? "Modifica consulenza" : "Nuova consulenza"}</h2><button onClick={() => setForm(null)} aria-label="Chiudi" className="p-2 rounded-full hover:bg-ivory2"><X className="w-5 h-5" /></button></div>
            {!form.id && <div className="flex flex-wrap gap-1.5 mb-3"><span className="text-xs font-bold uppercase tracking-wide text-navy/45 w-full">Parti da un modello</span>{TEMPLATES.map(t => <button key={t.k} onClick={() => startForm(t)} className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${form.category === t.k ? "border-wine bg-wine/10" : "border-line hover:border-navy/30"}`}>{t.label}</button>)}</div>}
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} maxLength={120} placeholder="Titolo" className={inp} />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={10} maxLength={10000} placeholder="Cosa include la consulenza?" className={`${inp} resize-y`} />
              <div className="text-xs text-navy/55 text-right -mt-2">{form.description.length} / 10000 caratteri</div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">Durata (minuti)<input type="number" min={15} max={240} step={5} value={form.durationMin} onChange={e => setForm({ ...form, durationMin: e.target.value })} className={`${inp} mt-1`} /></label>
                <label className="text-sm font-semibold">Prezzo (euro)<input type="number" min={1} max={2000} step={1} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={`${inp} mt-1`} /></label>
              </div>
            </div>
            <div className="flex gap-2 mt-5"><button onClick={saveForm} disabled={saving} className="px-6 py-2.5 rounded-xl bg-wine text-white font-semibold disabled:opacity-50">{saving ? "Salvo…" : "Pubblica"}</button><button onClick={() => setForm(null)} className="px-6 py-2.5 rounded-xl bg-white border-2 border-line font-semibold">Annulla</button></div>
          </div>
        </div>
      )}
      {toast && <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-navy text-white px-5 py-3 rounded-full shadow-xl font-semibold text-sm toast max-w-[90vw] text-center">{toast}</div>}
    </main>
  );
}
