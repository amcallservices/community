"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, Check, X, Trash2, ExternalLink, ShieldCheck } from "lucide-react";
import { timeAgo } from "@/components/NotificationBell";

const REASON: Record<string, string> = { spam: "Spam o pubblicità", offensivo: "Contenuto offensivo", regole: "Non rispetta le regole", altro: "Altro" };
const STATUS: Record<string, string> = { open: "Aperta", resolved: "Risolta", dismissed: "Ignorata" };

export default function SegnalazioniPage() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [items, setItems] = useState<any[] | null>(null);
  const [toast, setToast] = useState("");
  const say = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400); };

  const load = async (t = tab) => {
    setItems(null);
    try {
      const r = await fetch(`/api/reports?status=${t}`);
      if (r.status === 401 || r.status === 403) { setAdmin(false); return; }
      setAdmin(true);
      setItems(r.ok ? await r.json() : []);
    } catch { setItems([]); }
  };
  useEffect(() => { load(tab); }, [tab]);

  const act = async (id: number, action: "dismiss" | "resolve" | "delete") => {
    if (action === "delete" && !confirm("Eliminare definitivamente questo contenuto? Non si può annullare.")) return;
    const r = await fetch("/api/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    if (r.ok) { say(action === "delete" ? "Contenuto eliminato" : action === "dismiss" ? "Segnalazione ignorata" : "Segnalazione risolta"); load(); } else say("Errore");
  };

  if (admin === false) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <ShieldCheck className="w-10 h-10 text-wine mx-auto" />
      <h1 className="text-2xl font-extrabold mt-3">Area riservata</h1>
      <p className="text-navy/70 mt-1">Questa pagina è solo per chi amministra la community.</p>
      <Link href="/community" className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-wine text-white font-semibold">Vai alla community</Link>
    </div>
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3"><Flag className="w-7 h-7 text-red-600" />Segnalazioni</h1>
      <p className="text-navy/65 mt-1">Contenuti segnalati dagli iscritti. Chi li ha scritti non vede chi li ha segnalati.</p>
      <div className="flex gap-2 mt-4" role="tablist">
        {([["open", "Da controllare"], ["closed", "Archivio"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${tab === k ? "bg-wine text-white" : "bg-white border border-line hover:border-wine"}`}>{l}</button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {items === null && <div className="h-28 rounded-2xl bg-ivory2 animate-pulse" aria-busy="true" />}
        {items?.length === 0 && <div className="bg-white border border-line rounded-2xl p-8 text-center text-navy/65">{tab === "open" ? "Nessuna segnalazione da controllare. 🎉" : "L'archivio è vuoto."}</div>}
        {items?.map(r => (
          <article key={r.id} className="bg-white rounded-2xl border border-line p-4 md:p-5 rise">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 font-semibold">{REASON[r.reason] || r.reason}</span>
              <span className="text-navy/55">{timeAgo(r.createdAt)} · segnalato da {r.reporter}</span>
              {r.status !== "open" && <span className="ml-auto px-3 py-1 rounded-full bg-ivory2 font-semibold">{STATUS[r.status] || r.status}</span>}
            </div>
            {r.note && <p className="mt-2 text-navy/80 italic">“{r.note}”</p>}
            {r.target ? (
              <div className="mt-3 p-3 rounded-xl bg-ivory2">
                <div className="text-xs font-bold uppercase tracking-wide text-navy/50">{r.target.kind} di <Link href={`/utente/${r.target.authorId}`} className="underline">{r.target.author}</Link></div>
                {r.target.title && <b className="block mt-1">{r.target.title}</b>}
                <p className="mt-1 text-navy/80 whitespace-pre-wrap break-words">{r.target.text || "(solo foto o allegati)"}</p>
              </div>
            ) : <p className="mt-3 text-sm text-navy/55">Il contenuto è già stato eliminato.</p>}
            {r.status === "open" && (
              <div className="flex flex-wrap gap-2 mt-4">
                {r.target && <Link href={`/community#post-${r.target.postId}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-line font-semibold hover:border-wine"><ExternalLink className="w-4 h-4" />Vai al post</Link>}
                {r.target && <button onClick={() => act(r.id, "delete")} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:brightness-110"><Trash2 className="w-4 h-4" />Elimina contenuto</button>}
                <button onClick={() => act(r.id, "resolve")} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-mint/30 font-semibold hover:bg-mint/50"><Check className="w-4 h-4" />Risolta</button>
                <button onClick={() => act(r.id, "dismiss")} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ivory2 font-semibold hover:bg-line"><X className="w-4 h-4" />Ignora</button>
              </div>
            )}
          </article>
        ))}
      </div>
      {toast && <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-navy text-white px-5 py-3 rounded-full shadow-xl font-semibold text-sm toast">{toast}</div>}
    </main>
  );
}
