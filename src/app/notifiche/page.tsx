"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { NotifIcon, timeAgo } from "@/components/NotificationBell";

type Notif = { id: number; type: string; message: string; link?: string | null; read: boolean; createdAt: string };

export default function NotifichePage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState(true);

  const load = async () => {
    try {
      const r = await fetch("/api/notifications");
      if (r.status === 401) setLogged(false);
      else if (r.ok) setItems((await r.json()).items);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
    setItems(it => it.map(n => ({ ...n, read: true })));
  };
  const markOne = (n: Notif) => {
    if (!n.read) fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) }).catch(() => {});
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-extrabold">Notifiche</h1>
        {items.some(n => !n.read) && <button onClick={markAll} className="text-sm font-semibold text-golddark hover:underline inline-flex items-center gap-1"><CheckCheck className="w-4 h-4" />Segna tutte come lette</button>}
      </div>
      {loading ? <p className="text-center text-navy/60 py-8">Caricamento…</p>
        : !logged ? <p className="text-center text-navy/70 py-8"><Link href="/login" className="underline font-semibold">Accedi</Link> per vedere le tue notifiche.</p>
        : items.length === 0 ? <div className="bg-white border-2 border-line rounded-3xl p-8 text-center text-navy/70">Nessuna notifica per ora. Quando qualcuno commenta o mette mi piace ai tuoi post, la vedrai qui.</div>
        : <div className="bg-white border-2 border-line rounded-3xl overflow-hidden divide-y-2 divide-ivory2">
            {items.map(n => (
              <Link key={n.id} href={n.link || "/community"} onClick={() => markOne(n)} className={`flex gap-3 px-4 py-3.5 hover:bg-ivory2 transition ${n.read ? "" : "bg-ivory2/70"}`}>
                <NotifIcon type={n.type} />
                <span className="min-w-0 flex-1">
                  <span className={`block leading-snug ${n.read ? "text-navy/80" : "font-semibold"}`}>{n.message}</span>
                  <span className={`text-xs ${n.read ? "text-navy/50" : "text-golddark font-semibold"}`}>{timeAgo(n.createdAt)}</span>
                </span>
                {!n.read && <span className="w-3 h-3 rounded-full bg-wine self-center shrink-0" />}
              </Link>
            ))}
          </div>}
    </main>
  );
}
