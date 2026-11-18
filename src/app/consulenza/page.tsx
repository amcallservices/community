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
  const [bookings, setBookings] = useState<{ asBuyer: Booking[]; asSeller: Booking[] } | null>(null);
  const [cat, setCat] = useState("tutte");
  const [toast, setToast] = useState("");
  const [buying, setBuying] = useState<number | null>(null);
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
  const complete = async (b: Booking) => {
    const r = await fetch("/api/consulenza/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, action: "complete" }) });
    if (r.ok) { say("Segnata come svolta"); loadBookings(); } else say("Errore");
  };

  const inp = "w-full p-3 rounded-xl bg-ivory2 border-2 border-transparent focus:border-wine outline-none transition";

  const BookingRow = ({ b, as }: { b: Booking; as: "buyer" | "seller" }) => {
    const other = as === "buyer" ? b.seller : b.buyer; const st = STATUS[b.status] || STATUS.pending;
    return (
      <div className="bg-white border border-line rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <Face p={other} />
        <div className="min-w-0 flex-1">
          <div className="font-bold">{b.title}</div>
          <div className="text-sm text-navy/60">{as === "buyer" ? "con" : "cliente:"} {other.nome} {other.cognome} · {b.durationMin} min · {eur(b.amountCents)} · {timeAgo(b.paidAt || b.createdAt)}</div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${st.c}`}>{st.l}</span>
        {b.room && b.status === "paid" && <>
          <Link href={`/messaggi?to=${other.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-line font-semibold hover:border-wine"><MessageCircle className="w-4 h-4" />Scrivi per l&apos;orario</Link>
          <Link href={`/consulenza/stanza/${b.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-wine text-white font-semibold hover:brightness-110"><Video className="w-4 h-4" />Entra nella videochiamata</Link>
          {as === "seller" && <button onClick={() => complete(b)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-mint/30 font-semibold hover:bg-mint/50"><Check className="w-4 h-4" />Svolta</button>}
        </>}
      </div>
    );
  };

  const total = (bookings?.asBuyer.length || 0) + (bookings?.asSeller.length || 0);

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <header className="rounded-3xl p-6 md:p-8 mb-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(120deg,#1b1464 0%,#5b3df5 70%)" }}>
        <span className="absolute -top-8 -right-6 w-36 h-36 rounded-full opacity-90" style={{ background: "#ffc83d" }} />
        <span className="absolute bottom-3 right-28 w-12 h-12 rounded-full" style={{ background: "#2dd4a7" }} />
        <span className="absolute bottom-6 right-6 w-14 h-14 rounded-2xl rotate-12" style={{ background: "#ff6b6b" }} />
        <div className="relative max-w-xl">
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3"><Briefcase className="w-8 h-8 text-brass shrink-0" />Consulenze</h1>
          <p className="mt-2 text-white/85 text-lg">Parla in videochiamata con chi pubblica libri ogni giorno: copertine, stesura, vendite e molto altro.</p>
          {canOffer && <button onClick={() => startForm()} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brass text-navy font-bold hover:brightness-105 active:scale-95 transition"><Plus className="w-4 h-4" />Offri una consulenza</button>}
        </div>
      </header>

      {banner && <div role="status" className="mb-4 rounded-2xl border-2 border-mint bg-mint/15 p-4 font-semibold flex items-start gap-3"><span className="flex-1">{banner}</span><button onClick={() => setBanner("")} aria-label="Chiudi" className="p-1"><X className="w-4 h-4" /></button></div>}
      {!payments && canOffer && <div className="mb-4 rounded-2xl border-2 border-brass bg-brass/20 p-4 text-sm"><b>Pagamenti non ancora attivi.</b> Per incassare serve collegare Stripe: aggiungi la chiave segreta nelle impostazioni del sito (<code>STRIPE_SECRET_KEY</code>). Finché manca, nessuno può prenotare.</div>}

      {/* come funziona */}
      <ol className="grid sm:grid-cols-3 gap-3 mb-6">
        {[[CreditCard, "1. Scegli e paga", "Scegli la consulenza e paghi in sicurezza con Stripe."], [MessageCircle, "2. Fissa l’orario", "Scrivi al consulente nei messaggi e vi accordate su giorno e ora."], [Video, "3. Videochiamata", "Entri nella stanza privata direttamente dal sito, senza installare nulla."]].map(([Icon, t, d]: any, i) => (
          <li key={i} className="bg-white border border-line rounded-2xl p-4"><Icon className="w-6 h-6 text-wine" /><b className="block mt-2">{t}</b><span className="text-sm text-navy/65">{d}</span></li>
        ))}
      </ol>

      {/* le mie prenotazioni */}
      {user && bookings && total > 0 && (
        <section className="mb-8" aria-label="Le mie prenotazioni">
          <h2 className="text-xl font-extrabold mb-3">Le mie prenotazioni</h2>
          <div className="space-y-3">
            {bookings.asSeller.map(b => <BookingRow key={"s" + b.id} b={b} as="seller" />)}
            {bookings.asBuyer.map(b => <BookingRow key={"b" + b.id} b={b} as="buyer" />)}
          </div>
        </section>
      )}

      {/* offerte */}
      <section aria-label="Consulenze disponibili">
        <h2 className="text-xl font-extrabold mb-3">Consulenze disponibili</h2>
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3" role="group" aria-label="Categorie">
          {[{ k: "tutte", label: "Tutte" }, ...TEMPLATES.filter(t => t.k !== "altro")].map(t => (
            <button key={t.k} onClick={() => setCat(t.k)} aria-pressed={cat === t.k} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition ${cat === t.k ? "bg-navy text-white" : "bg-white border border-line hover:border-navy/40"}`}>{t.label}</button>
          ))}
        </div>
        {offers === null ? <div className="h-32 rounded-2xl bg-ivory2 animate-pulse" aria-busy="true" /> : shown.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {shown.map(o => (
              <article key={o.id} className="bg-white rounded-3xl border border-line p-5 flex flex-col rise hover:shadow-md transition">
                <span className="self-start px-3 py-1 rounded-full bg-ivory2 text-xs font-bold">{categoryLabel(o.category)}</span>
                <h3 className="text-lg font-extrabold mt-2 leading-snug">{o.title}</h3>
                <p className="text-navy/75 mt-2 text-sm leading-relaxed whitespace-pre-wrap flex-1">{o.description}</p>
                <Link href={`/utente/${o.seller.id}`} className="mt-4 flex items-center gap-3 hover:underline"><Face p={o.seller} size={40} /><span className="min-w-0"><b className="block truncate">{o.seller.nome} {o.seller.cognome}</b><span className="text-xs text-navy/55">{o.seller.role === "admin" ? "Amministratore" : "Moderatore"}</span></span></Link>
                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-line">
                  <div><div className="text-2xl font-extrabold">{eur(o.priceCents)}</div><div className="text-xs text-navy/55 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{o.durationMin} minuti</div></div>
                  {o.mine ? <span className="text-sm text-navy/55">È la tua offerta</span>
                    : <button onClick={() => book(o)} disabled={buying === o.id} className="px-5 py-2.5 rounded-xl bg-wine text-white font-semibold hover:brightness-110 active:scale-95 transition disabled:opacity-60">{buying === o.id ? "Apro il pagamento…" : "Prenota e paga"}</button>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-line rounded-2xl p-8 text-center text-navy/65">
            {(offers || []).length === 0 ? "Le prime consulenze arrivano presto. Intanto guarda di cosa si potrà parlare qui sotto." : "Nessuna consulenza in questa categoria."}
          </div>
        )}
      </section>

      {/* ipotesi di consulenza */}
      <section className="mt-8" aria-label="Di cosa si può parlare">
        <h2 className="text-xl font-extrabold">Di cosa si può parlare</h2>
        <p className="text-navy/65 text-sm mt-1 mb-3">Alcuni esempi di consulenza che gli esperti della community possono offrire.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {TEMPLATES.filter(t => t.k !== "altro").map(t => (
            <div key={t.k} className="bg-white border border-line rounded-2xl p-4">
              <b>{t.title}</b>
              <p className="text-sm text-navy/70 mt-1">{t.description}</p>
              <div className="flex items-center justify-between mt-3 text-sm"><span className="text-navy/55 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />circa {t.durationMin} minuti</span>{canOffer && <button onClick={() => startForm(t)} className="font-semibold text-wine hover:underline">Offri questa consulenza</button>}</div>
            </div>
          ))}
        </div>
      </section>

      {/* gestione offerte (solo staff) */}
      {canOffer && (
        <section className="mt-8" aria-label="Le tue consulenze">
          <div className="flex items-center justify-between mb-3"><h2 className="text-xl font-extrabold">Le tue consulenze</h2><button onClick={() => startForm()} className="text-sm font-semibold text-wine hover:underline">+ Nuova</button></div>
          {mine.length === 0 ? <p className="text-navy/60 text-sm">Non hai ancora offerte. Scegli un modello tra gli esempi qui sopra oppure creane una tua.</p> : (
            <div className="space-y-3">{mine.map(o => (
              <div key={o.id} className={`bg-white border border-line rounded-2xl p-4 flex flex-wrap items-center gap-3 ${o.active ? "" : "opacity-60"}`}>
                <div className="min-w-0 flex-1"><b>{o.title}</b><div className="text-sm text-navy/60">{categoryLabel(o.category)} · {o.durationMin} min · {eur(o.priceCents)} {!o.active && "· in pausa"}</div></div>
                <button onClick={() => editForm(o)} aria-label="Modifica" className="p-2 rounded-lg hover:bg-ivory2"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => toggle(o)} aria-label={o.active ? "Metti in pausa" : "Riattiva"} className="p-2 rounded-lg hover:bg-ivory2">{o.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
                <button onClick={() => remove(o)} aria-label="Elimina" className="p-2 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>))}
            </div>
          )}
        </section>
      )}

      {form && (
        <div className="fixed inset-0 z-50 bg-navy/60 grid place-items-center p-4" onClick={() => setForm(null)} role="dialog" aria-modal="true" aria-label="Offerta di consulenza">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl rise max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3"><h2 className="text-xl font-extrabold">{form.id ? "Modifica consulenza" : "Nuova consulenza"}</h2><button onClick={() => setForm(null)} aria-label="Chiudi" className="p-2 rounded-full hover:bg-ivory2"><X className="w-5 h-5" /></button></div>
            {!form.id && <div className="flex flex-wrap gap-1.5 mb-3"><span className="text-xs font-bold uppercase tracking-wide text-navy/45 w-full">Parti da un modello</span>{TEMPLATES.map(t => <button key={t.k} onClick={() => startForm(t)} className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${form.category === t.k ? "border-wine bg-wine/10" : "border-line hover:border-navy/30"}`}>{t.label}</button>)}</div>}
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} maxLength={120} placeholder="Titolo" className={inp} />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5} maxLength={1500} placeholder="Cosa include la consulenza?" className={`${inp} resize-none`} />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">Durata (minuti)<input type="number" min={15} max={240} step={5} value={form.durationMin} onChange={e => setForm({ ...form, durationMin: e.target.value })} className={`${inp} mt-1`} /></label>
                <label className="text-sm font-semibold">Prezzo (euro)<input type="number" min={5} max={2000} step={1} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={`${inp} mt-1`} /></label>
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
