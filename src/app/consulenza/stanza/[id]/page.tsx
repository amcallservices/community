"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MessageCircle, Check } from "lucide-react";

type Party = { id: number; nome: string; cognome: string };
type Booking = { id: number; title: string; durationMin: number; status: string; room: string | null; buyer: Party; seller: Party };

export default function StanzaPage({ params }: { params: Promise<{ id: string }> }) {
  const [b, setB] = useState<Booking | null | undefined>(undefined);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { id } = await params;
      try { setMe(JSON.parse(localStorage.getItem("user") || "null")); } catch {}
      try {
        const r = await fetch("/api/consulenza/bookings");
        if (r.status === 401) { location.href = "/login"; return; }
        const d = await r.json();
        const found = [...(d.asBuyer || []), ...(d.asSeller || [])].find((x: Booking) => String(x.id) === id);
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
  const myName = `${me?.nome || ""} ${me?.cognome || ""}`.trim() || "Partecipante";
  const hash = `#config.prejoinPageEnabled=false&config.subject=${encodeURIComponent(JSON.stringify(b.title))}&userInfo.displayName=${encodeURIComponent(JSON.stringify(myName))}`;
  const url = `https://meet.jit.si/${b.room}${hash}`;

  return (
    <main className="max-w-5xl mx-auto px-4 py-4">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <Link href="/consulenza" className="inline-flex items-center gap-2 text-sm font-semibold text-navy/70 hover:text-navy"><ArrowLeft className="w-4 h-4" />Consulenze</Link>
        <div className="min-w-0 flex-1"><h1 className="font-extrabold truncate">{b.title}</h1><p className="text-sm text-navy/60">con {other.nome} {other.cognome} · {b.durationMin} minuti</p></div>
        <Link href={`/messaggi?to=${other.id}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border-2 border-line text-sm font-semibold hover:border-wine"><MessageCircle className="w-4 h-4" />Scrivi</Link>
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border-2 border-line text-sm font-semibold hover:border-wine"><ExternalLink className="w-4 h-4" />Apri a schermo intero</a>
      </div>
      <div className="rounded-3xl overflow-hidden bg-black border border-line" style={{ height: "min(75vh, 720px)" }}>
        <iframe src={url} title="Videochiamata" allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write" className="w-full h-full border-0" />
      </div>
      <p className="text-sm text-navy/60 mt-3 flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 text-mint" />Quando il browser lo chiede, consenti l&apos;uso di microfono e videocamera. La stanza è privata: il link non si può indovinare, quindi non condividerlo.</p>
    </main>
  );
}
