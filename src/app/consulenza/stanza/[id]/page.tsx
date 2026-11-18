"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MessageCircle, Check, Video, Monitor } from "lucide-react";

type Party = { id: number; nome: string; cognome: string };
type Booking = { id: number; title: string; durationMin: number; status: string; room: string | null; meetUrl?: string | null; buyer: Party; seller: Party };

export default function StanzaPage({ params }: { params: Promise<{ id: string }> }) {
  const [b, setB] = useState<Booking | null | undefined>(undefined);
  const [me, setMe] = useState<any>(null);
  const [meet, setMeet] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { id } = await params;
      try { setMe(JSON.parse(localStorage.getItem("user") || "null")); } catch {}
      try {
        const r = await fetch("/api/consulenza/bookings");
        if (r.status === 401) { location.href = "/login"; return; }
        const d = await r.json();
        const found = [...(d.asBuyer || []), ...(d.asSeller || []), ...(d.asStaff || [])].find((x: Booking) => String(x.id) === id);
        if (alive) { setB(found || null); setMeet(found?.meetUrl || ""); }
      } catch { if (alive) setB(null); }
    })();
    return () => { alive = false; };
  }, [params]);

  if (b === undefined) return <div className="max-w-3xl mx-auto px-4 py-10"><div className="h-64 rounded-3xl bg-ivory2 animate-pulse" aria-busy="true" /></div>;
  if (!b || !b.room) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-extrabold">Videochiamata non disponibile</h1>
      <p className="text-navy/70 mt-2">La videochiamata si apre solo dopo il pagamento e solo per chi partecipa alla consulenza.</p>
      <Link href="/consulenza" className="inline-block mt-5 px-6 py-2.5 rounded-xl bg-wine text-white font-semibold">Torna alle consulenze</Link>
    </div>
  );

  const canSetMeet = me?.id === b.seller.id || me?.role === "admin";
  const iAmBuyer = me?.id === b.buyer.id;
  const staffGuest = me?.id !== b.buyer.id && me?.id !== b.seller.id;
  const other = iAmBuyer ? b.seller : b.buyer;
  const saveMeet = async () => {
    const r = await fetch("/api/consulenza/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, action: "setlink", meetUrl: meet }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setB({ ...b, meetUrl: meet.trim() || null }); setMsg(meet.trim() ? "Link salvato: il cliente lo vede in questa pagina" : "Link rimosso"); } else setMsg(d.error || "Errore");
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Link href="/consulenza" className="inline-flex items-center gap-2 text-sm font-semibold text-navy/70 hover:text-navy"><ArrowLeft className="w-4 h-4" />Consulenze</Link>
        <div className="min-w-0 flex-1"><h1 className="font-extrabold truncate">{b.title}</h1><p className="text-sm text-navy/60">{staffGuest ? `${b.buyer.nome} ${b.buyer.cognome} con ${b.seller.nome} ${b.seller.cognome}` : `con ${other.nome} ${other.cognome}`} · {b.durationMin} minuti</p></div>
        {!staffGuest && <Link href={`/messaggi?to=${other.id}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border-2 border-line text-sm font-semibold hover:border-wine"><MessageCircle className="w-4 h-4" />Scrivi</Link>}
      </div>

      <section className="rounded-3xl bg-navy text-white p-6" aria-label="Videochiamata Google Meet">
        <h2 className="text-xl font-extrabold flex items-center gap-2"><Video className="w-6 h-6 text-brass" />Videochiamata su Google Meet</h2>
        {b.meetUrl ? <>
          <p className="mt-2 text-white/85">Il link è pronto. All&apos;orario concordato entra nella videochiamata.</p>
          <a href={b.meetUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brass text-navy font-bold hover:brightness-105 active:scale-95 transition"><Video className="w-5 h-5" />Entra con Google Meet</a>
        </> : <p className="mt-2 text-white/85">{canSetMeet ? "Crea la riunione su Google Meet e incolla qui sotto il link." : "Il consulente deve ancora inviare il link di Google Meet: lo vedrai qui e riceverai una notifica."}</p>}
      </section>

      {canSetMeet && (
        <section className="mt-4 rounded-3xl bg-ivory2 p-5" aria-label="Link Google Meet">
          <h2 className="font-extrabold">Link di Google Meet</h2>
          <p className="text-sm text-navy/70 mt-1">Clicca &ldquo;Crea con Google Meet&rdquo;, copia il link della riunione, incollalo e salva: il cliente lo vede in questa pagina e riceve una notifica.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="https://meet.new" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white font-semibold hover:bg-line"><ExternalLink className="w-4 h-4" />Crea con Google Meet</a>
            <input value={meet} onChange={e => setMeet(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" aria-label="Link Google Meet" className="flex-1 min-w-[220px] p-2.5 rounded-xl bg-white border-2 border-transparent focus:border-wine outline-none" />
            <button onClick={saveMeet} className="px-5 py-2.5 rounded-xl bg-wine text-white font-semibold hover:brightness-110 active:scale-95 transition">Salva</button>
          </div>
          {msg && <p role="status" className="text-sm mt-2 font-semibold">{msg}</p>}
        </section>
      )}

      <ul className="mt-4 space-y-2 text-sm text-navy/75">
        <li className="flex items-start gap-2"><Monitor className="w-4 h-4 mt-0.5 shrink-0 text-wine" /><span><b>Condividere lo schermo:</b> su Google Meet clicca &ldquo;Presenta ora&rdquo; in basso e scegli cosa mostrare.</span></li>
        <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 text-mint" /><span>Il link della riunione è privato: non condividerlo con altri.</span></li>
      </ul>
    </main>
  );
}
