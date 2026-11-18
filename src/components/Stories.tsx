"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Plus, X, Trash2, Eye, Image as ImageIcon, Film } from "lucide-react";
import { timeAgo } from "@/components/NotificationBell";

type Item = { id: number; url: string; type: "image" | "video"; caption: string | null; createdAt: string; seen: boolean; views?: number };
type Group = { userId: number; nome: string; cognome: string; avatar: string | null; items: Item[]; hasUnseen: boolean; mine: boolean };

const COLORS = ["#5b3df5", "#2dd4a7", "#ffc83d", "#ff6b6b", "#38bdf8", "#f472b6", "#a78bfa", "#fb923c"];
const colorFor = (id: number) => COLORS[id % COLORS.length];
const IMG_MS = 5000;
const MAX_VIDEO_SEC = 30;

function Face({ g, size }: { g: { userId: number; nome: string; avatar: string | null }; size: number }) {
  return g.avatar
    ? <img src={g.avatar} alt="" className="rounded-full object-cover bg-white" style={{ width: size, height: size }} />
    : <span className="rounded-full grid place-items-center font-bold text-navy" style={{ width: size, height: size, background: colorFor(g.userId), fontSize: size / 2.4 }}>{(g.nome?.[0] || "?").toUpperCase()}</span>;
}

// Riduce le foto grandi prima di caricarle (le GIF restano intatte).
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < 600_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1440 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob: Blob | null = await new Promise(r => c.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], "storia.jpg", { type: "image/jpeg" }) : file;
  } catch { return file; }
}

export default function Stories({ user, canPost, say }: { user: { id: number; nome?: string; avatar?: string | null } | null; canPost: boolean; say: (m: string) => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [viewer, setViewer] = useState<{ g: number; i: number } | null>(null);
  const [creating, setCreating] = useState(false);
  const [staff, setStaff] = useState(false);

  const load = useCallback(async () => {
    try { const r = await fetch("/api/stories"); if (r.ok) { const d = await r.json(); if (Array.isArray(d)) setGroups(d); } } catch {}
  }, []);
  useEffect(() => {
    load();
    try { const r = JSON.parse(localStorage.getItem("user") || "{}").role; setStaff(r === "admin" || r === "sottoadmin" || r === "moderatore"); } catch {}
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 90_000);
    return () => clearInterval(t);
  }, [load]);

  const mine = groups.find(g => g.mine);
  const others = groups.filter(g => !g.mine);

  // ---------- creazione ----------
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const pick = (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) { say("Scegli una foto o un video"); return; }
    if (f.size > 120 * 1024 * 1024) { say("Il file è troppo grande (massimo 120 MB)"); return; }
    if (f.type.startsWith("video/")) {
      const url = URL.createObjectURL(f);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        if (v.duration > MAX_VIDEO_SEC + 0.5) { URL.revokeObjectURL(url); say(`Il video dura ${Math.round(v.duration)} secondi: il massimo è ${MAX_VIDEO_SEC}`); return; }
        setFile(f); setPreview(url);
      };
      v.onerror = () => { setFile(f); setPreview(url); };
      v.src = url;
    } else { setFile(f); setPreview(URL.createObjectURL(f)); }
  };
  const closeCreate = () => { if (progress !== null) return; setCreating(false); setFile(null); setPreview(""); setCaption(""); };
  const publish = async () => {
    if (!file || progress !== null) return;
    setProgress(0);
    try {
      const f = await shrink(file);
      const ext = (f.name.split(".").pop() || (f.type.startsWith("video") ? "mp4" : "jpg")).toLowerCase().replace(/[^a-z0-9]/g, "");
      const blob = await upload(`stories/storia-${Date.now()}.${ext}`, f, { access: "public", handleUploadUrl: "/api/stories/upload", contentType: f.type, onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)) });
      const r = await fetch("/api/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: blob.url, type: f.type.startsWith("video") ? "video" : "image", caption }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "");
      setProgress(null); setCreating(false); setFile(null); setPreview(""); setCaption("");
      say("Storia pubblicata: resta visibile 24 ore");
      load();
    } catch (e: any) { setProgress(null); say(e?.message || "Storia non pubblicata, riprova"); }
  };

  const openGroup = (g: Group) => {
    const gi = groups.indexOf(g);
    const firstUnseen = g.items.findIndex(i => !i.seen);
    setViewer({ g: gi, i: firstUnseen >= 0 ? firstUnseen : 0 });
  };

  if (!user && !groups.length) return null;

  const ring = (unseen: boolean) => unseen ? "bg-gradient-to-tr from-brass via-coral to-wine" : "bg-white/70";
  const Thumb = ({ g }: { g: Group }) => {
    const it = g.items[g.items.length - 1];
    return it.type === "video"
      ? <video src={it.url + "#t=0.1"} preload="metadata" muted playsInline className="absolute inset-0 w-full h-full object-cover" />
      : <img src={it.url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />;
  };
  const card = "relative shrink-0 w-[112px] sm:w-[128px] h-[190px] sm:h-[220px] rounded-2xl overflow-hidden border border-line bg-ivory2 text-left snap-start transition hover:brightness-95 active:scale-[.98]";

  return (
    <section aria-label="Storie" className="mb-4">
      <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x [scrollbar-width:none]">
        {user && (
          <div className={`${card} bg-white`}>
            {mine ? <button onClick={() => openGroup(mine)} aria-label="Guarda la tua storia" className="absolute inset-0"><Thumb g={mine} /><span className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" /></button>
              : <div className="absolute inset-x-0 top-0 h-[68%] grid place-items-center" style={{ background: colorFor(user.id) + "33" }}><Face g={{ userId: user.id, nome: user.nome || "", avatar: user.avatar ?? null }} size={64} /></div>}
            <button onClick={() => canPost ? setCreating(true) : say("Sei sospeso: non puoi pubblicare")} aria-label="Crea una storia" className={`absolute left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-wine text-white grid place-items-center border-[3px] border-white active:scale-90 transition ${mine ? "top-2" : "top-[68%] -mt-[18px]"}`}><Plus className="w-5 h-5" /></button>
            <div className={`absolute inset-x-0 bottom-0 p-2.5 text-center text-sm font-bold ${mine ? "text-white drop-shadow" : "text-navy"}`}>{mine ? "La tua storia" : "Crea storia"}</div>
          </div>
        )}
        {others.map(g => (
          <button key={g.userId} onClick={() => openGroup(g)} className={card} aria-label={`Storie di ${g.nome} ${g.cognome}`}>
            <Thumb g={g} />
            <span className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/65" />
            <span className={`absolute top-2 left-2 rounded-full p-[3px] ${ring(g.hasUnseen)}`}><span className="block rounded-full bg-white p-[2px]"><Face g={g} size={34} /></span></span>
            <span className="absolute inset-x-0 bottom-0 p-2.5 text-white text-sm font-bold leading-tight drop-shadow line-clamp-2">{g.nome} {g.cognome}</span>
          </button>
        ))}
        {!others.length && !mine && !user && null}
      </div>
      {user && !others.length && !mine && <p className="text-sm text-navy/55 -mt-1 mb-1">Nessuna storia per ora. Pubblica la prima!</p>}

      {creating && (
        <div className="fixed inset-0 z-[70] bg-navy/70 grid place-items-center p-4" onClick={closeCreate} role="dialog" aria-modal="true" aria-label="Nuova storia">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-2xl rise max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Nuova storia</h2><button onClick={closeCreate} aria-label="Chiudi" className="p-2 rounded-full hover:bg-ivory2"><X className="w-5 h-5" /></button></div>
            <p className="text-sm text-navy/60 mt-1">Foto o video (fino a {MAX_VIDEO_SEC} secondi). Resta visibile 24 ore.</p>
            {!file ? (
              <label className="mt-4 grid place-items-center gap-2 rounded-2xl border-2 border-dashed border-line p-10 cursor-pointer hover:border-wine transition text-center">
                <span className="flex gap-3 text-wine"><ImageIcon className="w-8 h-8" /><Film className="w-8 h-8" /></span>
                <b>Scegli una foto o un video</b>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={e => { pick(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
            ) : (
              <div className="mt-4">
                <div className="rounded-2xl overflow-hidden bg-black grid place-items-center" style={{ aspectRatio: "9 / 12" }}>
                  {file.type.startsWith("video/") ? <video src={preview} controls muted playsInline className="max-h-full max-w-full" /> : <img src={preview} alt="Anteprima" className="max-h-full max-w-full object-contain" />}
                </div>
                <input value={caption} onChange={e => setCaption(e.target.value)} maxLength={140} placeholder="Aggiungi una scritta (facoltativa)" className="mt-3 w-full p-3 rounded-xl bg-ivory2 outline-none focus:ring-2 focus:ring-wine/40" />
                {progress !== null && <div className="mt-3 h-2 rounded-full bg-ivory2 overflow-hidden"><div className="h-full bg-wine transition-all" style={{ width: `${progress}%` }} /></div>}
                <div className="flex gap-2 mt-4">
                  <button onClick={publish} disabled={progress !== null} className="flex-1 py-3 rounded-xl bg-wine text-white font-semibold disabled:opacity-60 hover:brightness-110">{progress !== null ? `Carico… ${progress}%` : "Pubblica storia"}</button>
                  <button onClick={() => { setFile(null); setPreview(""); }} disabled={progress !== null} className="px-5 py-3 rounded-xl bg-white border-2 border-line font-semibold disabled:opacity-50">Cambia</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {viewer && groups[viewer.g] && (
        <Viewer groups={groups} start={viewer} me={user?.id ?? 0} staff={staff} onClose={() => { setViewer(null); load(); }} onDelete={async (id) => {
          if (!confirm("Eliminare questa storia?")) return false;
          const r = await fetch(`/api/stories?id=${id}`, { method: "DELETE" });
          if (r.ok) { say("Storia eliminata"); await load(); return true; }
          say("Non sono riuscito a eliminarla"); return false;
        }} />
      )}
    </section>
  );
}

function Viewer({ groups, start, me, staff, onClose, onDelete }: { groups: Group[]; start: { g: number; i: number }; me: number; staff: boolean; onClose: () => void; onDelete: (id: number) => Promise<boolean> }) {
  const [pos, setPos] = useState(start);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const g = groups[pos.g];
  const item = g?.items[pos.i];
  const videoRef = useRef<HTMLVideoElement>(null);
  const seen = useRef(new Set<number>());

  const next = useCallback(() => {
    setProgress(0);
    setPos(p => {
      const grp = groups[p.g];
      if (p.i + 1 < grp.items.length) return { g: p.g, i: p.i + 1 };
      if (p.g + 1 < groups.length) return { g: p.g + 1, i: 0 };
      setTimeout(onClose, 0);
      return p;
    });
  }, [groups, onClose]);
  const prev = useCallback(() => {
    setProgress(0);
    setPos(p => p.i > 0 ? { g: p.g, i: p.i - 1 } : p.g > 0 ? { g: p.g - 1, i: 0 } : p);
  }, []);

  // segna come vista
  useEffect(() => {
    if (item && g && g.userId !== me && !seen.current.has(item.id)) {
      seen.current.add(item.id);
      fetch("/api/stories/view", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) }).catch(() => {});
    }
  }, [item, g, me]);

  // avanzamento automatico per le foto
  useEffect(() => {
    if (!item || item.type !== "image" || paused) return;
    const t0 = Date.now() - progress * IMG_MS;
    const t = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / IMG_MS);
      setProgress(p);
      if (p >= 1) { clearInterval(t); next(); }
    }, 50);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, paused]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause(); else v.play().catch(() => {});
  }, [paused, item?.id]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); else if (e.key === "ArrowRight") next(); else if (e.key === "ArrowLeft") prev(); };
    window.addEventListener("keydown", k);
    const o = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = o; };
  }, [next, prev, onClose]);

  if (!g || !item) return null;
  const canDelete = g.userId === me || staff;

  return (
    <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center" role="dialog" aria-modal="true" aria-label={`Storie di ${g.nome}`}>
      <div className="relative w-full h-full max-w-[460px] bg-black select-none"
        onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)}>
        {item.type === "image"
          ? <img src={item.url} alt={item.caption || "Storia"} className="absolute inset-0 w-full h-full object-contain" draggable={false} />
          : <video ref={videoRef} key={item.id} src={item.url} autoPlay playsInline onEnded={next} onTimeUpdate={e => { const v = e.currentTarget; if (v.duration) setProgress(v.currentTime / v.duration); }} className="absolute inset-0 w-full h-full object-contain" />}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute top-2 inset-x-2 flex gap-1" aria-hidden>
          {g.items.map((_, idx) => (
            <span key={idx} className="h-[3px] flex-1 rounded-full bg-white/35 overflow-hidden"><span className="block h-full bg-white" style={{ width: idx < pos.i ? "100%" : idx === pos.i ? `${progress * 100}%` : "0%" }} /></span>
          ))}
        </div>
        <div className="absolute top-6 inset-x-3 flex items-center gap-2 text-white" onPointerDown={e => e.stopPropagation()}>
          <Face g={g} size={36} />
          <div className="min-w-0 flex-1 leading-tight"><div className="font-bold truncate">{g.nome} {g.cognome}</div><div className="text-xs text-white/75">{timeAgo(item.createdAt)}</div></div>
          {canDelete && <button onClick={async () => { setPaused(true); const ok = await onDelete(item.id); if (ok) { if (g.items.length > 1) next(); else onClose(); } else setPaused(false); }} aria-label="Elimina storia" className="p-2 rounded-full hover:bg-white/15"><Trash2 className="w-5 h-5" /></button>}
          <button onClick={onClose} aria-label="Chiudi" className="p-2 rounded-full hover:bg-white/15"><X className="w-6 h-6" /></button>
        </div>
        <button aria-label="Storia precedente" onClick={prev} className="absolute left-0 top-20 bottom-24 w-1/3" />
        <button aria-label="Storia successiva" onClick={next} className="absolute right-0 top-20 bottom-24 w-2/3" />
        {(item.caption || g.mine) && (
          <div className="absolute inset-x-0 bottom-0 p-4 pt-16 bg-gradient-to-t from-black/70 to-transparent text-white pointer-events-none">
            {item.caption && <p className="text-center text-lg font-semibold drop-shadow">{item.caption}</p>}
            {g.mine && typeof item.views === "number" && <p className="mt-2 text-sm text-white/80 flex items-center justify-center gap-1.5"><Eye className="w-4 h-4" />{item.views === 1 ? "1 visualizzazione" : `${item.views} visualizzazioni`}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
