"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Save, X, Lock, Eye, EyeOff, Send, Pencil, ShieldCheck, FileText, MessageCircle, Heart, CalendarDays, Image as ImageIcon, Users, Newspaper, Mail, Ban, KeyRound, Check, Copy, LayoutDashboard, Flag } from "lucide-react";
import { timeAgo } from "@/components/NotificationBell";

const PALETTE = ["#ffc83d", "#ff6b6b", "#2dd4a7", "#5b3df5", "#38bdf8", "#f472b6"];
const colorFor = (id?: number) => PALETTE[Math.abs(id || 0) % PALETTE.length];
const textOn = (c: string) => (c === "#5b3df5" || c === "#ff6b6b" ? "#fff" : "#1b1464");
const ROLE: Record<string, string> = { admin: "Amministratore", moderatore: "Moderatore", scrittore: "Autore", lettore: "Lettore" };

// Riduce la foto del profilo a 320 px: resta leggera e non serve l'archivio file
function shrinkAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 320;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); return reject(new Error("canvas")); }
      const s = Math.min(img.width, img.height);
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("immagine")); };
    img.src = url;
  });
}

function strength(p: string) {
  let n = 0;
  if (p.length >= 8) n++;
  if (p.length >= 12) n++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) n++;
  return n;
}

export default function ProfileView({ id }: { id: number | string }) {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [u, setU] = useState<any>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [adminStats, setAdminStats] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(""); const [cognome, setCognome] = useState(""); const [bio, setBio] = useState(""); const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [msgOpen, setMsgOpen] = useState(false); const [msg, setMsg] = useState(""); const [sending, setSending] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [nw2, setNw2] = useState(""); const [show, setShow] = useState(false); const [pwErr, setPwErr] = useState("");
  const [resetLink, setResetLink] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400); };

  const load = async () => {
    try {
      const r = await fetch(`/api/users/${id}`);
      if (!r.ok) { setState("missing"); return; }
      const d = await r.json();
      // ripulisce la vecchia foto salvata per intero nel browser (pesante): ora basta il link
      try {
        const st = JSON.parse(localStorage.getItem("user") || "null");
        if (st && st.id === d.id && typeof st.avatar === "string" && st.avatar.startsWith("data:")) { st.avatar = d.avatar || null; localStorage.setItem("user", JSON.stringify(st)); setMe(st); }
      } catch {}
      setU(d); setNome(d.nome || ""); setCognome(d.cognome || ""); setBio(d.bio || ""); setAvatar(d.avatar || "");
      setState("ok");
    } catch { setState("missing"); }
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setMe(JSON.parse(stored));
    load();
  }, [id]);

  const own = !!me && !!u && me.id === u.id;
  const admin = me?.role === "admin";

  useEffect(() => {
    if (own && admin) fetch("/api/admin/stats").then(r => r.ok ? r.json() : null).then(setAdminStats).catch(() => {});
  }, [own, admin]);

  const pickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    try { setAvatar(await shrinkAvatar(f)); } catch { say("Immagine non valida"); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome, cognome, bio, ...(avatar !== (u.avatar || "") ? { avatar } : {}) }) });
      if (!r.ok) throw new Error();
      const upd = await r.json();
      const merged = { ...me, ...upd };
      localStorage.setItem("user", JSON.stringify(merged)); setMe(merged);
      setEditing(false); await load(); say("Profilo salvato");
    } catch { say("Non sono riuscito a salvare. Riprova."); }
    setSaving(false);
  };

  const changePw = async () => {
    setPwErr("");
    if (!cur || !nw || !nw2) return setPwErr("Compila tutti i campi");
    if (nw !== nw2) return setPwErr("Le nuove password non corrispondono");
    if (nw.length < 8) return setPwErr("La password deve avere almeno 8 caratteri");
    try {
      const r = await fetch(`/api/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: cur, newPassword: nw }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return setPwErr(d.error || "Errore");
      setPwOpen(false); setCur(""); setNw(""); setNw2(""); say("Password cambiata");
    } catch { setPwErr("Errore di connessione"); }
  };

  const sendMsg = async () => {
    if (!msg.trim() || sending) return;
    setSending(true);
    try {
      const r = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: u.id, content: msg }) });
      if (!r.ok) throw new Error();
      setMsg(""); setMsgOpen(false); say("Messaggio inviato");
    } catch { say("Messaggio non inviato"); }
    setSending(false);
  };

  const makeLink = async () => {
    const r = await fetch("/api/admin/reset-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return say(d.error || "Errore");
    setResetLink(d.link);
    try { await navigator.clipboard.writeText(d.link); say("Link copiato: valido 24 ore"); } catch {}
  };

  const setRole = async (role: "moderatore" | "scrittore") => {
    const r = await fetch("/api/users/role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id, role }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { say(role === "moderatore" ? "Ora \u00e8 moderatore" : "Non \u00e8 pi\u00f9 moderatore"); load(); } else say(d.error || "Errore");
  };

  const suspend = async (hours: 0 | 24 | 48) => {
    const r = await fetch("/api/users/suspend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id, hours }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { say(hours ? `Sospeso per ${hours} ore: non pu\u00f2 pubblicare` : "Sospensione revocata"); load(); } else say(d.error || "Errore");
  };

  const toggleBan = async () => {
    if (!u.email) return;
    if (!u.banned && !confirm(`Bloccare ${u.nome} ${u.cognome}? Non potrà più accedere.`)) return;
    const r = await fetch("/api/users/ban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: u.email, banned: !u.banned }) });
    if (r.ok) { say(u.banned ? "Utente sbloccato" : "Utente bloccato"); load(); } else say("Errore");
  };

  if (state === "loading") return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse" aria-busy="true">
      <div className="h-40 rounded-3xl bg-ivory2" /><div className="-mt-12 ml-6 w-28 h-28 rounded-full bg-line border-4 border-ivory" />
      <div className="h-6 bg-ivory2 rounded w-1/3 mt-4" /><div className="h-4 bg-ivory2 rounded w-1/4 mt-2" />
    </div>
  );
  if (state === "missing") return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-extrabold">Utente non trovato</h1>
      <Link href="/community" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-wine text-white font-semibold">Torna alla Community</Link>
    </div>
  );

  const col = colorFor(u.id);
  const isAdminUser = u.role === "admin";
  const since = u.createdAt ? new Date(u.createdAt).toLocaleDateString("it-IT", { month: "long", year: "numeric" }) : "";
  const stats = [
    { icon: Newspaper, label: "Post", value: u.stats?.posts ?? 0, c: "text-wine" },
    { icon: MessageCircle, label: "Commenti", value: u.stats?.comments ?? 0, c: "text-mint" },
    { icon: Heart, label: "Reazioni ricevute", value: u.stats?.reactions ?? 0, c: "text-coral" },
    { icon: CalendarDays, label: "Iscritto da", value: since || "-", c: "text-brass", small: true },
  ];
  const inp = "w-full p-3 rounded-xl bg-ivory2 border-2 border-transparent focus:border-wine outline-none transition";
  const st = strength(nw);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <section className="bg-white rounded-3xl border border-line shadow-sm overflow-hidden">
        <div className="h-36 md:h-44 relative" style={{ background: "linear-gradient(120deg,#1b1464 0%,#5b3df5 60%,#7c5cff 100%)" }}>
          <span className="absolute -top-6 right-10 w-28 h-28 rounded-full opacity-90" style={{ background: "#ffc83d" }} />
          <span className="absolute top-14 right-36 w-10 h-10 rounded-full" style={{ background: "#ff6b6b" }} />
          <span className="absolute bottom-4 right-6 w-16 h-16 rounded-2xl rotate-12" style={{ background: "#2dd4a7" }} />
          {u.role === "moderatore" && <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-mint text-navy text-xs font-bold px-3 py-1.5 rounded-full"><ShieldCheck className="w-4 h-4" />Moderatore</span>}
          {isAdminUser && <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-brass text-navy text-xs font-bold px-3 py-1.5 rounded-full"><ShieldCheck className="w-4 h-4" />Amministratore</span>}
        </div>

        <div className="px-5 md:px-8 pb-6">
          <div className="flex items-end justify-between gap-3 -mt-14 md:-mt-16">
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden grid place-items-center text-5xl font-extrabold shadow-lg" style={{ background: col, color: textOn(col) }}>
                {(editing ? avatar : u.avatar) ? <img src={editing ? avatar : u.avatar} alt={u.nome} className="w-full h-full object-cover" /> : (u.nome || u.name || "?")[0].toUpperCase()}
              </div>
              {editing && (
                <>
                  <button onClick={() => fileRef.current?.click()} aria-label="Cambia foto" className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-wine text-white grid place-items-center shadow-lg hover:scale-110 transition"><Camera className="w-4 h-4" /></button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-end pb-1">
              {own && !editing && <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-wine text-white font-semibold hover:brightness-110 active:scale-95 transition"><Pencil className="w-4 h-4" />Modifica profilo</button>}
              {me && !own && <button onClick={() => setMsgOpen(o => !o)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-wine text-white font-semibold hover:brightness-110 active:scale-95 transition"><Send className="w-4 h-4" />Messaggio</button>}
            </div>
          </div>

          <div className="mt-3">
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">{u.nome} {u.cognome}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm">
              <span className={`px-3 py-1 rounded-full font-semibold ${isAdminUser ? "bg-brass/30" : "bg-ivory2"}`}>{ROLE[u.role] || u.role || "Autore"}</span>
              {since && <span className="text-navy/60">Iscritto da {since}</span>}
              {u.banned && <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold">Bloccato</span>}
              {u.suspendedUntil && !u.banned && (admin || own) && <span className="px-3 py-1 rounded-full bg-brass/40 text-navy font-semibold">Sospeso fino a {new Date(u.suspendedUntil).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
            </div>
            {!editing && (u.bio ? <p className="mt-3 text-navy/80 whitespace-pre-wrap leading-relaxed">{u.bio}</p> : own ? <button onClick={() => setEditing(true)} className="mt-3 text-golddark font-semibold hover:underline">+ Aggiungi una presentazione</button> : null)}
            {u.email && <p className="mt-2 text-sm text-navy/60 inline-flex items-center gap-2"><Mail className="w-4 h-4" />{u.email}</p>}
          </div>

          {editing && (
            <div className="mt-5 p-4 rounded-2xl bg-ivory2/60 border-2 border-line space-y-3 rise">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block text-sm font-semibold">Nome<input value={nome} onChange={e => setNome(e.target.value)} className={`${inp} mt-1 bg-white`} /></label>
                <label className="block text-sm font-semibold">Cognome<input value={cognome} onChange={e => setCognome(e.target.value)} className={`${inp} mt-1 bg-white`} /></label>
              </div>
              <label className="block text-sm font-semibold">Presentazione
                <textarea value={bio} maxLength={400} onChange={e => setBio(e.target.value)} rows={4} placeholder="Chi sei, cosa scrivi, a cosa stai lavorando…" className={`${inp} mt-1 bg-white resize-none`} />
                <span className="block text-right text-xs text-navy/50 font-normal">{bio.length}/400</span>
              </label>
              {avatar && <button onClick={() => setAvatar("")} className="text-sm text-red-600 font-semibold hover:underline">Rimuovi la foto</button>}
              <div className="flex gap-2">
                <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl bg-wine text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"><Save className="w-4 h-4" />{saving ? "Salvo…" : "Salva"}</button>
                <button onClick={() => { setEditing(false); setNome(u.nome || ""); setCognome(u.cognome || ""); setBio(u.bio || ""); setAvatar(u.avatar || ""); }} className="px-5 py-3 rounded-xl bg-white border-2 border-line font-semibold inline-flex items-center gap-2"><X className="w-4 h-4" />Annulla</button>
              </div>
            </div>
          )}

          {msgOpen && (
            <div className="mt-5 p-4 rounded-2xl bg-ivory2/60 border-2 border-line rise">
              <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3} placeholder={`Scrivi a ${u.nome}…`} className={`${inp} bg-white resize-none`} autoFocus />
              <div className="flex gap-2 mt-2">
                <button onClick={sendMsg} disabled={!msg.trim() || sending} className="flex-1 py-2.5 rounded-xl bg-wine text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"><Send className="w-4 h-4" />{sending ? "Invio…" : "Invia"}</button>
                <button onClick={() => { setMsgOpen(false); setMsg(""); }} className="px-5 py-2.5 rounded-xl bg-white border-2 border-line font-semibold">Annulla</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-line p-4 hover:-translate-y-0.5 hover:shadow-md transition">
            <s.icon className={`w-6 h-6 ${s.c}`} />
            <div className={`${s.small ? "text-lg capitalize" : "text-3xl"} font-extrabold mt-2 leading-tight`}>{s.value}</div>
            <div className="text-sm text-navy/60">{s.label}</div>
          </div>
        ))}
      </section>

      {own && admin && (
        <section className="mt-4 rounded-3xl p-5 md:p-6 text-white" style={{ background: "linear-gradient(120deg,#1b1464,#2a1f7a)" }}>
          <h2 className="font-extrabold text-lg flex items-center gap-2"><LayoutDashboard className="w-5 h-5 text-brass" />Pannello amministratore</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[["Utenti", adminStats?.users, `+${adminStats?.newUsers ?? 0} in 7 giorni`], ["Post", adminStats?.posts, `+${adminStats?.newPosts ?? 0} in 7 giorni`], ["Commenti", adminStats?.comments, ""], ["Reazioni", adminStats?.reactions, ""]].map(([l, v, sub]) => (
              <div key={l as string} className="rounded-2xl bg-white/10 p-3">
                <div className="text-3xl font-extrabold text-brass">{v ?? "…"}</div>
                <div className="text-sm text-white/80">{l}</div>
                {sub && <div className="text-xs text-mint mt-0.5">{sub}</div>}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href="/utenti" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brass text-navy font-bold hover:brightness-105"><Users className="w-4 h-4" />Gestisci utenti{adminStats?.banned ? ` (${adminStats.banned} bloccati)` : ""}</Link>
            <Link href="/community" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 font-semibold hover:bg-white/25"><Newspaper className="w-4 h-4" />Modera la community</Link>
            <Link href="/admin/segnalazioni" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 font-semibold hover:bg-white/25"><Flag className="w-4 h-4" />Segnalazioni{adminStats?.reports ? ` (${adminStats.reports})` : ""}</Link>
            <Link href="/messaggi" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 font-semibold hover:bg-white/25"><Mail className="w-4 h-4" />Messaggi</Link>
          </div>
        </section>
      )}

      {admin && !own && (
        <section className="mt-4 rounded-2xl border-2 border-line bg-white p-4">
          <h2 className="font-extrabold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-wine" />Strumenti admin</h2>
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={makeLink} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ivory2 font-semibold hover:bg-line"><KeyRound className="w-4 h-4" />Link recupero password</button>
            {!u.banned && (u.role === "moderatore"
              ? <button onClick={() => setRole("scrittore")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-ivory2 hover:bg-line"><ShieldCheck className="w-4 h-4" />Rimuovi moderatore</button>
              : <button onClick={() => setRole("moderatore")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-mint/30 hover:bg-mint/50"><ShieldCheck className="w-4 h-4" />Nomina moderatore</button>)}
            {!u.banned && (u.suspendedUntil
              ? <button onClick={() => suspend(0)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-mint/30 hover:bg-mint/50"><Check className="w-4 h-4" />Revoca sospensione</button>
              : <>
                  <button onClick={() => suspend(24)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-brass/30 hover:bg-brass/50"><Ban className="w-4 h-4" />Sospendi 24 ore</button>
                  <button onClick={() => suspend(48)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-brass/30 hover:bg-brass/50"><Ban className="w-4 h-4" />Sospendi 48 ore</button>
                </>)}
            <button onClick={toggleBan} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold ${u.banned ? "bg-mint/30 hover:bg-mint/50" : "bg-red-50 text-red-700 hover:bg-red-100"}`}><Ban className="w-4 h-4" />{u.banned ? "Sblocca utente" : "Blocca utente"}</button>
          </div>
          {resetLink && (
            <div className="mt-3 p-3 rounded-xl bg-ivory2 text-sm break-all flex items-start gap-2"><span className="flex-1">{resetLink}</span><button onClick={() => navigator.clipboard.writeText(resetLink).then(() => say("Copiato"))} aria-label="Copia" className="p-1.5 rounded-lg hover:bg-white"><Copy className="w-4 h-4" /></button></div>
          )}
        </section>
      )}

      <section className="mt-4 bg-white rounded-3xl border border-line p-5 md:p-6">
        <h2 className="font-extrabold text-lg mb-3">{own ? "I tuoi ultimi post" : `Ultimi post di ${u.nome}`}</h2>
        {(u.recentPosts || []).length === 0 ? (
          <div className="text-center py-6 text-navy/60">
            {own ? <>Non hai ancora scritto niente. <Link href="/community" className="font-semibold underline">Pubblica il tuo primo post</Link>.</> : "Non ha ancora pubblicato post."}
          </div>
        ) : (
          <div className="divide-y divide-ivory2">
            {u.recentPosts.map((p: any) => (
              <Link key={p.id} href={`/community#post-${p.id}`} className="block py-3 hover:bg-ivory2/60 -mx-2 px-2 rounded-xl transition">
                {p.title && <b className="block leading-snug">{p.title}</b>}
                <span className="block text-navy/75 text-[15px] line-clamp-2">{p.excerpt || (p.photos ? "Foto" : p.pdfs ? "Documento PDF" : "")}</span>
                <span className="flex flex-wrap items-center gap-3 mt-1 text-xs text-navy/55">
                  <span>{timeAgo(p.createdAt)}</span>
                  <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{p.likes}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{p.comments}</span>
                  {p.photos > 0 && <span className="inline-flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" />{p.photos}</span>}
                  {p.pdfs > 0 && <span className="inline-flex items-center gap-1"><FileText className="w-3.5 h-3.5" />PDF</span>}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {own && (
        <section className="mt-4 bg-white rounded-3xl border border-line p-5 md:p-6">
          <h2 className="font-extrabold text-lg flex items-center gap-2"><Lock className="w-5 h-5 text-wine" />Sicurezza</h2>
          {!pwOpen ? (
            <button onClick={() => setPwOpen(true)} className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ivory2 font-semibold hover:bg-line">Cambia password</button>
          ) : (
            <div className="mt-3 space-y-3 max-w-md">
              {pwErr && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm" role="alert">{pwErr}</div>}
              <input type={show ? "text" : "password"} value={cur} onChange={e => setCur(e.target.value)} placeholder="Password attuale" className={inp} autoComplete="current-password" />
              <div className="relative">
                <input type={show ? "text" : "password"} value={nw} onChange={e => setNw(e.target.value)} placeholder="Nuova password (almeno 8 caratteri)" className={`${inp} pr-11`} autoComplete="new-password" />
                <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? "Nascondi" : "Mostra"} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/60">{show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
              </div>
              {nw && <div className="flex gap-1" aria-label="Robustezza password">{[0, 1, 2, 3].map(i => <span key={i} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: i < st ? ["#ff6b6b", "#ffc83d", "#2dd4a7", "#2dd4a7"][st - 1] : "#e4defa" }} />)}</div>}
              <input type="password" value={nw2} onChange={e => setNw2(e.target.value)} placeholder="Ripeti la nuova password" className={inp} autoComplete="new-password" />
              <div className="flex gap-2">
                <button onClick={changePw} className="flex-1 py-2.5 rounded-xl bg-wine text-white font-semibold inline-flex items-center justify-center gap-2"><Check className="w-4 h-4" />Salva password</button>
                <button onClick={() => { setPwOpen(false); setPwErr(""); setCur(""); setNw(""); setNw2(""); }} className="px-5 py-2.5 rounded-xl bg-white border-2 border-line font-semibold">Annulla</button>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="text-center mt-6"><Link href="/community" className="text-golddark font-semibold hover:underline">← Torna alla Community</Link></div>
      {toast && <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-navy text-white px-5 py-3 rounded-full shadow-xl font-semibold text-sm toast">{toast}</div>}
    </main>
  );
}
