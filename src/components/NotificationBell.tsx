"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Heart, MessageCircle, Mail, CheckCheck, AtSign, CalendarDays, Flag, Briefcase } from "lucide-react";

type Notif = { id: number; type: string; message: string; link?: string | null; read: boolean; createdAt: string };

export function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "";
  const m = Math.floor((Date.now() - d) / 60000);
  if (m < 1) return "adesso";
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? "1 ora fa" : `${h} ore fa`;
  const g = Math.floor(h / 24);
  if (g === 1) return "ieri";
  if (g < 7) return `${g} giorni fa`;
  return new Date(iso).toLocaleDateString("it-IT");
}

export function NotifIcon({ type }: { type: string }) {
  if (type === "like") return <span className="w-10 h-10 rounded-full bg-red-100 text-red-500 grid place-items-center shrink-0"><Heart className="w-5 h-5 fill-red-500" /></span>;
  if (type === "message") return <span className="w-10 h-10 rounded-full bg-mint/25 text-navy grid place-items-center shrink-0"><Mail className="w-5 h-5" /></span>;
  if (type === "mention") return <span className="w-10 h-10 rounded-full bg-wine/10 text-wine grid place-items-center shrink-0"><AtSign className="w-5 h-5" /></span>;
  if (type === "event") return <span className="w-10 h-10 rounded-full bg-brass/30 text-navy grid place-items-center shrink-0"><CalendarDays className="w-5 h-5" /></span>;
  if (type === "report") return <span className="w-10 h-10 rounded-full bg-red-100 text-red-600 grid place-items-center shrink-0"><Flag className="w-5 h-5" /></span>;
  if (type === "consulenza") return <span className="w-10 h-10 rounded-full bg-mint/25 text-navy grid place-items-center shrink-0"><Briefcase className="w-5 h-5" /></span>;
  if (type === "comment") return <span className="w-10 h-10 rounded-full bg-wine/10 text-wine grid place-items-center shrink-0"><MessageCircle className="w-5 h-5" /></span>;
  return <span className="w-10 h-10 rounded-full bg-brass/30 text-navy grid place-items-center shrink-0"><Bell className="w-5 h-5" /></span>;
}

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[] | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const prev = useRef(0);

  const count = async () => {
    if (document.hidden) return;
    try {
      const r = await fetch("/api/notifications?count=1");
      if (!r.ok) return;
      const { unread: n } = await r.json();
      // titolo della scheda: (2) Community… come sui social
      document.title = document.title.replace(/^\(\d+\)\s*/, "");
      if (n > 0) document.title = `(${n}) ${document.title}`;
      if (n > prev.current && prev.current !== 0 && "Notification" in window && Notification.permission === "granted" && document.hidden === false) { /* niente popup: basta il badge */ }
      prev.current = n;
      setUnread(n);
    } catch {}
  };

  const load = async () => {
    try {
      const r = await fetch("/api/notifications");
      if (r.ok) { const d = await r.json(); setItems(d.items); setUnread(d.unread); prev.current = d.unread; }
    } catch {}
  };

  useEffect(() => {
    count();
    const t = setInterval(count, 20000);
    const v = () => { if (!document.hidden) count(); };
    document.addEventListener("visibilitychange", v);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", v); };
  }, []);

  useEffect(() => {
    if (!open) return;
    load();
    const out = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", out);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", out); document.removeEventListener("keydown", esc); };
  }, [open]);

  const markAll = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
    setItems(it => it?.map(n => ({ ...n, read: true })) || it);
    setUnread(0);
    document.title = document.title.replace(/^\(\d+\)\s*/, "");
  };

  const openOne = (n: Notif) => {
    if (!n.read) {
      fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) }).catch(() => {});
      setUnread(u => Math.max(0, u - 1));
    }
    setOpen(false);
  };

  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label={unread ? `Notifiche: ${unread} nuove` : "Notifiche"} aria-expanded={open} className="relative p-2 rounded-full hover:bg-card transition">
        <Bell className="w-6 h-6" />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-coral text-white text-xs font-bold grid place-items-center ring-2 ring-ink">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="fixed md:absolute left-2 right-2 md:left-auto md:right-0 top-[68px] md:top-12 md:w-[380px] bg-white text-navy rounded-2xl shadow-2xl border-2 border-line z-50 overflow-hidden rise">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ivory2">
            <b className="text-lg">Notifiche</b>
            {unread > 0 && <button onClick={markAll} className="text-sm font-semibold text-golddark hover:underline inline-flex items-center gap-1"><CheckCheck className="w-4 h-4" />Segna tutte come lette</button>}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items === null && <p className="p-6 text-center text-navy/60">Caricamento…</p>}
            {items && items.length === 0 && <p className="p-8 text-center text-navy/60">Nessuna notifica per ora.<br />Quando qualcuno commenta o mette mi piace ai tuoi post, lo vedrai qui.</p>}
            {items?.slice(0, 10).map(n => (
              <Link key={n.id} href={n.link || "/community"} onClick={() => openOne(n)} className={`flex gap-3 px-4 py-3 hover:bg-ivory2 transition ${n.read ? "" : "bg-ivory2/70"}`}>
                <NotifIcon type={n.type} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm leading-snug ${n.read ? "text-navy/80" : "font-semibold"}`}>{n.message}</span>
                  <span className={`text-xs ${n.read ? "text-navy/50" : "text-golddark font-semibold"}`}>{timeAgo(n.createdAt)}</span>
                </span>
                {!n.read && <span className="w-3 h-3 rounded-full bg-wine self-center shrink-0" aria-label="Non letta" />}
              </Link>
            ))}
          </div>
          <Link href="/notifiche" onClick={() => setOpen(false)} className="block text-center py-3 font-semibold text-golddark border-t-2 border-ivory2 hover:bg-ivory2">Vedi tutte le notifiche</Link>
        </div>
      )}
    </div>
  );
}
