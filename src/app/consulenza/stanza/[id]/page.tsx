"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Check, Video, Copy, Monitor } from "lucide-react";

type Party = { id: number; nome: string; cognome: string };
type Booking = { id: number; title: string; durationMin: number; status: string; room: string | null; buyer: Party; seller: Party };

export default function StanzaPage({ params }: { params: Promise<{ id: string }> }) {
  const [b, setB] = useState<Booking | null | undefined>(undefined);
  const [me, setMe] = useState<any>(null);
  const [copied, setCopied] = useState(false);

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
        if (alive) setB(found || null);
      } catch { if (alive) setB(null); }
    })();
    return () => { alive = false; };
  }, [params]);

  if (b === undefined) return <div className="max-w-3xl mx-auto px-4 py-10"><div className="h-64 rounded-3xl bg-ivory2 animate-pulse" aria-busy="true" /></div>;
  if (!b || !b.room) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-extrabold">Stanza non disponibile</h1>
      <p className="text-navy/70 mt-2">La videochiamata si apre solo dopo il pagamento e solo per chi partecipa alla consulenza.</p>
      <Link href="/consulenza" className="inline-block mt-5 px-6 py-2.5 rounded-xl bg-wine text-white font-semibold">Torna alle consulenze</Link>
    </div>
  );

  const iAmBuyer = me?.id === b.buyer.id;
  const other = iAmBuyer ? b.seller : b.buyer;
  const staffGuest = me?.id !== b.buyer.id && me?.id !== b.seller.id;
  const myName = `${me?.nome || ""} ${me?.cognome || ""}`.trim() || "Partecipante";
  const hash = `#config.prejoinPageEnabled=false&config.subject=${encodeURIComponent(JSON.stringify(b.title))}&userInfo.displayName=${encodeURIComponent(JSON.stringify(myName))}`;
  const url = `https://meet.jit.si/${b.room}${hash}`;

  return (
    <main className="max-w-5xl mx-auto px-4 py-4">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <Link href="/consulenza" className="inline-flex items-center gap-2 text-sm font-semibold text-navy/70 hover:text-navy"><ArrowLeft className="w-4 h-4" />Consulenze</Link>
        <div className="min-w-0 flex-1"><h1 className="font-extrabold truncate">{b.title}</h1><p className="text-sm text-navy/60">{staffGuest ? `${b.buyer.nome} ${b.buyer.cognome} con ${b.seller.nome} ${b.seller.cognome}` : `con ${other.nome} ${other.cognome}`} · {b.durationMin} minuti</p></div>
        <Link href={`/messaggi?to=${other.id}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border-2 border-line text-sm font-semibold hover:border-wine"><MessageCircle className="w-4 h-4" />Scrivi</Link>
      </div>
      <section className="rounded-3xl bg-navy text-white p-6 md:p-8" aria-label="Videochiamata">
        <h2 className="text-xl font-extrabold flex items-center gap-2"><Video className="w-6 h-6 text-brass" />La stanza è pronta</h2>
        <p className="mt-2 text-white/85">La videochiamata si apre in una nuova scheda, a schermo intero, con tutte le funzioni: condivisione dello schermo, chat, lavagna e alzata di mano.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brass text-navy font-bold hover:brightness-105 active:scale-95 transition"><Video className="w-5 h-5" />Entra nella videochiamata</a>
          <button onClick={() => { navigator.clipboard?.writeText(`https://meet.jit.si/${b.room}`).then(() => setCopied(true)).catch(() => {}); }} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 font-semibold hover:bg-white/20 active:scale-95 transition"><Copy className="w-4 h-4" />{copied ? "Link copiato" : "Copia il link"}</button>
        </div>
      </section>
      <ul className="mt-4 space-y-2 text-sm text-navy/75">
        <li className="flex items-start gap-2"><Monitor className="w-4 h-4 mt-0.5 shrink-0 text-wine" /><span><b>Condividere lo schermo:</b> nella barra in basso clicca &ldquo;Condividi schermo&rdquo; e scegli se mostrare tutto lo schermo, una finestra o una scheda. Da telefono la funzione dipende dal dispositivo.</span></li>
        <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 text-mint" /><span>Quando il browser lo chiede, consenti l&apos;uso di microfono e videocamera. La stanza è privata: il link non si può indovinare, quindi non condividerlo.</span></li>
        <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 text-mint" /><span>Il primo che entra può dover accedere con Google o GitHub per avviare la stanza: dopo, tutti gli altri entrano liberamente.</span></li>
      </ul>
    </main>
  );
}
