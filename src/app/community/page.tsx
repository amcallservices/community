"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { renderRich, parseRich } from "@/lib/sanitize";
import { decorate, hashtagsOf, type Member } from "@/lib/rich";
import Stories from "@/components/Stories";
import GuidedTour from "@/components/GuidedTour";
import { timeAgo } from "@/components/NotificationBell";
import { upload } from "@vercel/blob/client";
import { Compass, Heart, FileText, MessageCircle, Trash2, X, Send, Image, Link as LinkIcon, Share2, Check, ChevronDown, CalendarDays, Users, MessageSquare, User as UserIcon, Video as VideoIcon, Search, ArrowUp, Smile, Flag, Hash, BarChart3, Briefcase, Pin } from "lucide-react";

type Post = { id: number; title: string; content: string; authorId?: number; authorNome: string; authorCogen: string; authorRole: string; authorAvatar: string | null; likes: number; comments: number; category: string; pinned?: boolean; createdAt: string; reactions?: Record<string, number>; myReaction?: string | null; poll?: { options: { text: string; votes: number }[]; total: number; mine: number | null } | null };
type Comment = { id: number; text: string; authorId?: number; authorNome: string; authorCogen: string; authorAvatar: string | null; time: string; parentId?: number | null; createdAt?: string };

const REACTIONS = [
  { k: "like", e: "\u{1F44D}", l: "Mi piace", c: "text-wine" },
  { k: "love", e: "\u2764\uFE0F", l: "Adoro", c: "text-red-600" },
  { k: "haha", e: "\u{1F602}", l: "Ahah", c: "text-amber-600" },
  { k: "wow", e: "\u{1F62E}", l: "Wow", c: "text-amber-600" },
  { k: "clap", e: "\u{1F44F}", l: "Bravo", c: "text-amber-600" },
  { k: "sad", e: "\u{1F622}", l: "Che emozione", c: "text-amber-600" },
];
const EMOJI = ["\u{1F600}", "\u{1F60D}", "\u{1F389}", "\u{1F4DA}", "\u270D\uFE0F", "\u{1F525}", "\u{1F44F}", "\u{1F4A1}", "\u{1F680}", "\u2764\uFE0F"];
const CATS = [
  { k: "generale", l: "Generale", c: "#5b3df5" }, { k: "scrittura", l: "Scrittura", c: "#2dd4a7" }, { k: "kdp", l: "KDP e Amazon", c: "#ffc83d" },
  { k: "copertine", l: "Copertine", c: "#f472b6" }, { k: "marketing", l: "Marketing", c: "#ff6b6b" }, { k: "recensioni", l: "Recensioni", c: "#38bdf8" },
  { k: "domande", l: "Domande", c: "#a78bfa" }, { k: "novita", l: "Novit\u00e0 libri", c: "#fb923c" },
];
const catOf = (k?: string) => CATS.find(c => c.k === k);
const REPORT_REASONS = [{ k: "spam", l: "Spam o pubblicit\u00e0" }, { k: "offensivo", l: "Contenuto offensivo" }, { k: "regole", l: "Non rispetta le regole" }, { k: "altro", l: "Altro" }];
const FILTERS = [["tutti", "Tutti"], ["foto", "Con foto"], ["pdf", "Con PDF"], ["miei", "I miei"]] as const;

const PALETTE = ["#ffc83d", "#ff6b6b", "#2dd4a7", "#5b3df5", "#38bdf8", "#f472b6"];
const colorFor = (id?: number) => PALETTE[Math.abs(id || 0) % PALETTE.length];
const textOn = (c: string) => (c === "#5b3df5" || c === "#ff6b6b" ? "#fff" : "#1b1464");

function PostBody({ content, onZoom, members, onTag }: { content: string; onZoom: (src: string) => void; members: Member[]; onTag: (t: string) => void }) {
  const parsed = parseRich(content);
  const { images, pdfs, videos } = parsed;
  const html = decorate(parsed.html, members);
  const [open, setOpen] = useState(false);
  const long = html.length > 260 || html.split("\n").length > 4;
  return (
    <div>
      {html && (
        <>
          <div onClick={e => { const t = (e.target as HTMLElement).closest("[data-tag]"); if (t) { e.preventDefault(); onTag(t.getAttribute("data-tag") || ""); } }} className={`text-navy/80 whitespace-pre-wrap leading-relaxed ${open || !long ? "" : "line-clamp-4"}`} dangerouslySetInnerHTML={{ __html: html }} />
          {long && <button onClick={() => setOpen(o => !o)} className="mt-1 text-golddark font-semibold text-sm hover:underline inline-flex items-center gap-1">{open ? "Mostra meno" : "Leggi tutto"}<ChevronDown className={`w-4 h-4 transition ${open ? "rotate-180" : ""}`} /></button>}
        </>
      )}
      {images.length > 0 && (
        <div className={`mt-3 grid gap-1.5 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
          {images.slice(0, 6).map((src, i) => (
            <button key={i} onClick={() => onZoom(src)} className={`relative overflow-hidden rounded-xl bg-ivory2 cursor-zoom-in ${images.length === 1 ? "" : "aspect-square"}`} aria-label="Ingrandisci la foto">
              <img src={src} alt="Immagine del post" loading="lazy" className={`w-full ${images.length === 1 ? "max-h-[28rem] object-cover" : "h-full object-cover"} hover:scale-105 transition duration-300`} />
              {i === 5 && images.length > 6 && <span className="absolute inset-0 bg-navy/60 text-white grid place-items-center text-2xl font-bold">+{images.length - 6}</span>}
            </button>
          ))}
        </div>
      )}
      {videos.map((src, i) => (
        <video key={i} src={src} controls playsInline preload="metadata" className="mt-3 w-full max-h-[32rem] rounded-xl bg-navy" />
      ))}
      {pdfs.map((f, i) => (
        <a key={i} href={f.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 flex items-center gap-3 p-3 rounded-2xl bg-ivory2 border-2 border-line hover:border-wine transition">
          <span className="w-11 h-11 rounded-xl bg-wine text-white grid place-items-center shrink-0"><FileText className="w-5 h-5" /></span>
          <span className="min-w-0 flex-1"><b className="block truncate text-navy">{f.label}</b><span className="text-xs text-navy/60">Documento PDF</span></span>
          <span className="shrink-0 bg-wine text-white text-sm font-semibold px-3 py-2 rounded-lg">Apri</span>
        </a>
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pending, setPending] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMod, setIsMod] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; nome: string } | null>(null);
  const [sendingComment, setSendingComment] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [allUsers, setAllUsers] = useState<Member[]>([]);
  const [newCategory, setNewCategory] = useState("generale");
  const [catFilter, setCatFilter] = useState("tutte");
  const [reportTarget, setReportTarget] = useState<{ postId?: number; commentId?: number } | null>(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportNote, setReportNote] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(0);
  const [pollOn, setPollOn] = useState(false);
  const [pollOpts, setPollOpts] = useState<string[]>(["", ""]);
  const [suspendedUntil, setSuspendedUntil] = useState<string | null>(null);
  const [mention, setMention] = useState<{ target: "post" | "comment"; q: string; start: number; end: number } | null>(null);
  const [mIdx, setMIdx] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [popId, setPopId] = useState<number | null>(null);
  const [burstId, setBurstId] = useState<number | null>(null);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("tutti");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState("");
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const commentPdfInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const commentBoxRef = useRef<HTMLTextAreaElement>(null);
  const timers = useRef<Record<string, any>>({});
  const postsRef = useRef<Post[]>([]);
  postsRef.current = posts;

  const say = (m: string) => { setToast(m); clearTimeout(timers.current.toast); timers.current.toast = setTimeout(() => setToast(""), 2200); };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setIsAdmin(u.role === 'admin');
      setIsMod(u.role === 'moderatore' || u.role === 'sottoadmin');
    }
    loadPosts();
    if (stored) { try { const id = JSON.parse(stored).id; fetch(`/api/users/${id}`).then(r => r.ok ? r.json() : null).then(d => { if (!d) return; setSuspendedUntil(d.suspendedUntil || null); setIsAdmin(d.role === 'admin'); setIsMod(d.role === 'moderatore'); if (d.role && d.role !== JSON.parse(stored).role) { localStorage.setItem('user', JSON.stringify({ ...JSON.parse(stored), role: d.role })); if (d.role === 'admin' || d.role === 'moderatore') fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).then(x => x && setReportsOpen(x.reports || 0)).catch(() => {}); } }).catch(() => {}); } catch {} }
    if (stored && ["admin", "sottoadmin", "moderatore"].includes(JSON.parse(stored).role)) fetch("/api/admin/stats").then(r => r.ok ? r.json() : null).then(d => d && setReportsOpen(d.reports || 0)).catch(() => {});
    fetch("/api/events").then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) && setEvents(d.slice(0, 3))).catch(() => {});
    fetch("/api/utenti").then(r => r.ok ? r.json() : []).then(d => { if (Array.isArray(d)) { setMembers(d.slice(-5).reverse()); setAllUsers(d.map((u: any) => ({ id: u.id, nome: u.nome || "", cognome: u.cognome || "" }))); } }).catch(() => {});
  }, []);

  // Aggiornamento "in diretta": ogni 40 s controlla i nuovi post e aggiorna reazioni e commenti
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.hidden) return;
      try {
        const r = await fetch("/api/posts");
        if (!r.ok) return;
        const fresh: Post[] = await r.json();
        const cur = postsRef.current;
        const known = new Set(cur.map(p => p.id));
        const mine = JSON.parse(localStorage.getItem("user") || "null")?.id;
        const added = fresh.filter(p => !known.has(p.id) && p.authorId !== mine);
        setPosts(ps => ps.filter(p => fresh.some(f => f.id === p.id)).map(p => { const f = fresh.find(x => x.id === p.id)!; return { ...p, likes: f.likes, comments: f.comments, reactions: f.reactions, myReaction: f.myReaction }; }));
        setPending(added.length ? fresh : null);
      } catch {}
    }, 40000);
    return () => clearInterval(t);
  }, []);

  // Arrivo da una notifica (#post-12): scorri al post e evidenzialo
  useEffect(() => {
    if (loading || !posts.length) return;
    const m = location.hash.match(/^#post-(\d+)$/);
    if (!m) return;
    const el = document.getElementById(`post-${m[1]}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-4", "ring-brass");
    const t = setTimeout(() => el.classList.remove("ring-4", "ring-brass"), 2500);
    return () => clearTimeout(t);
  }, [loading, posts.length]);

  const loadPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      if (res.ok) { setPosts(await res.json()); setPending(null); }
    } catch (err) {
      console.error("Error loading posts:", err);
    }
    setLoading(false);
  };

  // Riduce la foto (max 1600 px, JPEG) prima di caricarla: i post restano leggeri.
  const shrinkImage = (file: File): Promise<Blob> => new Promise((resolve, reject) => {
    if (file.type === "image/gif" || file.type === "image/webp") { resolve(file); return; }
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1600;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); resolve(file); return; }
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b => (b ? resolve(b) : resolve(file)), "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("immagine non valida")); };
    img.src = url;
  });

  const uploadImages = (e: React.ChangeEvent<HTMLInputElement>, target: "post" | "comment") => {
    const list = Array.from(e.target.files || []);
    e.target.value = "";
    return uploadImageFiles(list, target);
  };

  const uploadImageFiles = async (all: File[], target: "post" | "comment") => {
    const files = all.filter(f => f.type.startsWith("image/"));
    if (!files.length) return;
    setPdfError("");
    setPdfProgress(0);
    let html = "";
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.size > 50 * 1024 * 1024) throw new Error("Ogni foto deve pesare meno di 50 MB.");
        const small = await shrinkImage(f);
        const ext = small.type === "image/jpeg" ? "jpg" : (f.name.split(".").pop() || "png");
        const base = f.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").slice(0, 40) || "foto";
        let src = "";
        try {
          const blob = await upload(`${base}.${ext}`, small, {
            access: "public",
            handleUploadUrl: "/api/upload",
            contentType: small.type || "image/jpeg",
            onUploadProgress: ({ percentage }) => setPdfProgress(Math.round((i * 100 + percentage) / files.length)),
          });
          src = blob.url;
        } catch {
          // Archivio non disponibile: inserisco la foto (gia' ridotta) dentro al post
          if (small.size > 1.5 * 1024 * 1024) throw new Error("Questa foto \u00e8 troppo pesante da inserire ora. Riprova pi\u00f9 tardi.");
          src = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => rej(new Error("lettura non riuscita")); r.readAsDataURL(small); });
        }
        html += `\n<img loading="lazy" decoding="async" src="${src}" alt="Immagine" />\n`;
      }
      if (target === "post") setNewContent(prev => prev + html);
      else setNewComment(prev => prev + html);
    } catch (err: any) {
      if (html) { if (target === "post") setNewContent(prev => prev + html); else setNewComment(prev => prev + html); }
      setPdfError((err?.message?.startsWith("Ogni foto") || err?.message?.startsWith("Questa foto")) ? err.message : "Caricamento delle foto non riuscito. Riprova.");
    }
    setPdfProgress(null);
  };

  const uploadPdf = async (e: React.ChangeEvent<HTMLInputElement>, target: "post" | "comment") => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPdfError("");
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) { setPdfError("Puoi caricare solo file PDF."); return; }
    if (file.size > 500 * 1024 * 1024) { setPdfError("Il PDF supera il limite di 500 MB."); return; }
    setPdfProgress(0);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        multipart: true,
        contentType: "application/pdf",
        onUploadProgress: ({ percentage }) => setPdfProgress(Math.round(percentage)),
      });
      const label = "\u{1F4C4} " + file.name.replace(/[<>"]/g, "");
      const html = `\n<a href="${blob.url}" target="_blank" rel="noopener noreferrer">${label}</a>\n`;
      if (target === "post") setNewContent(prev => prev + html);
      else setNewComment(prev => prev + html);
    } catch (err: any) {
      setPdfError(err?.message?.includes("token") || err?.message?.includes("BLOB") ? "Il caricamento dei PDF non \u00e8 ancora attivo." : "Caricamento non riuscito. Riprova.");
    }
    setPdfProgress(null);
  };

  const uploadVideo = async (e: React.ChangeEvent<HTMLInputElement>, target: "post" | "comment") => {
    const f0 = e.target.files?.[0];
    e.target.value = "";
    if (!f0) return;
    setPdfError("");
    const EXT: Record<string, string> = { mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm", mkv: "video/x-matroska", avi: "video/x-msvideo", "3gp": "video/3gpp" };
    const type = f0.type || EXT[(f0.name.split(".").pop() || "").toLowerCase()] || "";
    if (!type.startsWith("video/")) { setPdfError("Puoi caricare solo file video."); return; }
    if (f0.size > 500 * 1024 * 1024) { setPdfError("Il video supera il limite di 500 MB."); return; }
    setPdfProgress(0);
    try {
      const blob = await upload(f0.name.replace(/[^\w.\-]+/g, "_"), f0, { access: "public", handleUploadUrl: "/api/upload", multipart: true, contentType: type, onUploadProgress: ({ percentage }) => setPdfProgress(Math.round(percentage)) });
      const html = `\n<video src="${blob.url}" controls></video>\n`;
      if (target === "post") setNewContent(prev => prev + html);
      else setNewComment(prev => prev + html);
    } catch (err: any) {
      setPdfError(err?.message ? `Video non caricato: ${String(err.message).slice(0, 100)}` : "Caricamento non riuscito. Riprova.");
    }
    setPdfProgress(null);
  };

  const insertLink = () => {
    if (linkUrl.trim()) {
      const label = linkLabel.trim() || linkUrl;
      setNewContent(prev => prev + `\n<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-golddark hover:underline flex items-center gap-1 my-2">${label}</a>\n`);
      setLinkUrl("");
      setLinkLabel("");
      setShowLinkInput(false);
    }
  };

  const insertCommentLink = () => {
    if (linkUrl.trim()) {
      const label = linkLabel.trim() || linkUrl;
      setNewComment(prev => prev + `\n<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-golddark hover:underline flex items-center gap-1">${label}</a>\n`);
      setLinkUrl("");
      setLinkLabel("");
      setShowLinkInput(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newContent.trim() || !user || publishing) return;
    if (pollOn && pollOpts.map(o => o.trim()).filter(Boolean).length < 2) { say("Il sondaggio ha bisogno di almeno 2 risposte"); return; }
    setPublishing(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", content: newContent, category: newCategory, ...(pollOn ? { poll: { options: pollOpts } } : {}) }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || ""); }
      setNewContent("");
      setNewCategory("generale");
      setPollOn(false); setPollOpts(["", ""]);
      setShowNewPost(false);
      setShowLinkInput(false);
      await loadPosts();
      say("Post pubblicato \u{1F389}");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      say(e?.message || "Non sono riuscito a pubblicare. Riprova.");
    }
    setPublishing(false);
  };

  const vote = async (postId: number, option: number) => {
    if (!user) { say("Accedi per votare"); return; }
    const before = posts;
    setPosts(ps => ps.map(p => {
      if (p.id !== postId || !p.poll) return p;
      const prev = p.poll.mine;
      const options = p.poll.options.map((o, i) => ({ ...o, votes: o.votes + (i === option && prev !== option ? 1 : 0) - (i === prev ? 1 : 0) }));
      const mine = prev === option ? null : option;
      return { ...p, poll: { options, mine, total: options.reduce((a, o) => a + o.votes, 0) } };
    }));
    try {
      const r = await fetch("/api/polls/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, option }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "");
      setPosts(ps => ps.map(p => p.id === postId ? { ...p, poll: d } : p));
    } catch (e: any) { setPosts(before); say(e?.message || "Voto non riuscito"); }
  };

  // Reazioni: se manca "type" il tasto Mi piace mette/toglie "like"
  const react = async (postId: number, type?: string) => {
    if (!user) { say("Accedi per reagire ai post"); return; }
    const before = posts;
    setPosts(ps => ps.map(p => {
      if (p.id !== postId) return p;
      const reactions = { ...(p.reactions || {}) };
      const mine = p.myReaction || null;
      const next = type ? (mine === type ? null : type) : (mine ? null : "like");
      if (mine) { reactions[mine] = Math.max(0, (reactions[mine] || 1) - 1); if (!reactions[mine]) delete reactions[mine]; }
      if (next) reactions[next] = (reactions[next] || 0) + 1;
      return { ...p, reactions, myReaction: next, likes: Object.values(reactions).reduce((a, b) => a + b, 0) };
    }));
    setPopId(postId); setTimeout(() => setPopId(null), 450);
    setPickerFor(null);
    try {
      const mine = before.find(p => p.id === postId)?.myReaction;
      const body: any = { postId };
      if (type) body.type = type; else if (!mine) body.type = "like";
      const res = await fetch("/api/posts/like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
    } catch {
      setPosts(before);
      say("Non sono riuscito a salvare la reazione");
    }
  };

  // Doppio clic (o doppio tocco) sul post = cuore
  const burst = (post: Post) => {
    if (!user) return;
    if (post.myReaction !== "love") react(post.id, "love");
    setBurstId(post.id); clearTimeout(timers.current.burst); timers.current.burst = setTimeout(() => setBurstId(null), 800);
  };

  const showPicker = (id: number) => { clearTimeout(timers.current.pk); timers.current.pk = setTimeout(() => setPickerFor(id), 350); };
  const hidePicker = () => { clearTimeout(timers.current.pk); timers.current.pk = setTimeout(() => setPickerFor(null), 450); };

  const openComments = async (post: Post, toggle = false) => {
    if (toggle && selectedPost?.id === post.id) { setSelectedPost(null); return; }
    setSelectedPost(post);
    setReplyTo(null); setNewComment("");
    const res = await fetch(`/api/posts-comments?postId=${post.id}`);
    if (res.ok) setComments(await res.json());
    setTimeout(() => commentBoxRef.current?.focus(), 80);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !selectedPost || sendingComment) return;
    setSendingComment(true);
    const post = selectedPost;
    try {
      const res = await fetch("/api/posts-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, text: newComment, parentId: replyTo?.id || null }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || ""); }
      const created: Comment = await res.json();
      setComments(cs => [...cs, created]);
      setPosts(ps => ps.map(p => p.id === post.id ? { ...p, comments: (p.comments || 0) + 1 } : p));
      setNewComment(""); setReplyTo(null);
    } catch (e: any) {
      say(e?.message || "Commento non inviato. Riprova.");
    }
    setSendingComment(false);
  };

  const togglePin = async (p: Post) => {
    try {
      const res = await fetch("/api/posts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, pinned: !p.pinned }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { say(p.pinned ? "Post tolto dall'evidenza" : "Post messo in evidenza"); loadPosts(); } else say(d.error || "Errore");
    } catch { say("Errore"); }
  };
  const deletePost = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questo post?")) return;
    try {
      const res = await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
      if (res.ok) { setPosts(ps => ps.filter(p => p.id !== id)); setSelectedPost(null); say("Post eliminato"); }
      else { const data = await res.json(); say(data.error || "Errore nella cancellazione"); }
    } catch { say("Errore"); }
  };

  const deleteComment = async (commentId: number) => {
    try {
      const res = await fetch(`/api/posts-comments?id=${commentId}`, { method: "DELETE" });
      if (res.ok && selectedPost) { openComments(selectedPost); loadPosts(); }
    } catch { say("Errore"); }
  };

  const onTag = (tag: string) => { setQuery("#" + tag); setFilter("tutti"); setCatFilter("tutte"); window.scrollTo({ top: 0, behavior: "smooth" }); };

  // @menzioni: suggerimenti mentre si scrive
  const mentionMatches = useMemo(() => {
    if (!mention) return [];
    const q = mention.q.toLowerCase();
    const all: Member[] = mention.target === "post" && "tutti".startsWith(q) ? [{ id: -1, nome: "tutti", cognome: "" }] : [];
    return [...all, ...allUsers.filter(u => u.id !== user?.id && `${u.nome} ${u.cognome}`.toLowerCase().includes(q))].slice(0, 5);
  }, [mention, allUsers, user]);
  const detectMention = (value: string, caret: number, target: "post" | "comment") => {
    const m = value.slice(0, caret).match(/(?:^|\s)@([\p{L}\p{N}]*)$/u);
    if (m) { setMention({ target, q: m[1], start: caret - m[1].length - 1, end: caret }); setMIdx(0); } else setMention(null);
  };
  const pickMention = (u: Member) => {
    if (!mention) return;
    const val = mention.target === "post" ? newContent : newComment;
    const text = val.slice(0, mention.start) + `@${u.nome} ${u.cognome}`.trim() + " " + val.slice(mention.end);
    if (mention.target === "post") { setNewContent(text); composerRef.current?.focus(); } else { setNewComment(text); commentBoxRef.current?.focus(); }
    setMention(null);
  };
  const mentionKey = (e: React.KeyboardEvent, target: "post" | "comment") => {
    if (!mention || mention.target !== target || !mentionMatches.length) return false;
    if (e.key === "ArrowDown") { e.preventDefault(); setMIdx(i => (i + 1) % mentionMatches.length); return true; }
    if (e.key === "ArrowUp") { e.preventDefault(); setMIdx(i => (i - 1 + mentionMatches.length) % mentionMatches.length); return true; }
    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pickMention(mentionMatches[mIdx % mentionMatches.length]); return true; }
    if (e.key === "Escape") { setMention(null); return true; }
    return false;
  };
  const MentionMenu = ({ target, className }: { target: "post" | "comment"; className: string }) => mention?.target === target && mentionMatches.length > 0 ? (
    <div role="listbox" className={`absolute z-30 left-0 right-0 bg-white border border-line rounded-xl shadow-xl overflow-hidden ${className}`}>
      {mentionMatches.map((u, i) => (
        <button key={u.id} role="option" aria-selected={i === mIdx % mentionMatches.length} onMouseDown={e => { e.preventDefault(); pickMention(u); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${i === mIdx % mentionMatches.length ? "bg-ivory2" : "hover:bg-ivory2"}`}>
          <span className="w-7 h-7 rounded-full grid place-items-center text-xs font-bold" style={{ background: colorFor(u.id), color: textOn(colorFor(u.id)) }}>{(u.nome?.[0] || "?").toUpperCase()}</span>
          <span className="font-semibold">{u.nome} {u.cognome}</span>
        </button>
      ))}
    </div>
  ) : null;

  const openReport = (t: { postId?: number; commentId?: number }) => { if (!user) { say("Accedi per segnalare"); return; } setReportTarget(t); setReportReason("spam"); setReportNote(""); };
  const sendReport = async () => {
    if (!reportTarget || reporting) return;
    setReporting(true);
    try {
      const r = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...reportTarget, reason: reportReason, note: reportNote }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) say(d.error || "Segnalazione non inviata");
      else { say(d.already ? "Hai gi\u00e0 segnalato questo contenuto" : "Grazie, la segnalazione \u00e8 stata inviata"); setReportTarget(null); }
    } catch { say("Segnalazione non inviata"); }
    setReporting(false);
  };

  const trending = useMemo(() => {
    const n = new Map<string, number>();
    for (const p of posts) for (const t of new Set(hashtagsOf(p.content))) n.set(t, (n.get(t) || 0) + 1);
    return Array.from(n.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [posts]);

  const addEmoji = (e: string) => { setNewContent(t => t + e); composerRef.current?.focus(); };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(p => {
      if (filter === "foto" && !/<img loading="lazy" decoding="async"\b/i.test(p.content)) return false;
      if (filter === "pdf" && !/\.pdf/i.test(p.content)) return false;
      if (filter === "miei" && p.authorId !== user?.id) return false;
      if (catFilter !== "tutte" && (catOf(p.category)?.k ?? "generale") !== catFilter) return false;
      if (q && !`${p.title} ${p.content} ${p.authorNome} ${p.authorCogen}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, filter, query, user, catFilter]);

  const initial = ((user?.nome || user?.email || "?")[0] || "?").toUpperCase();
  const myCol = colorFor(user?.id);
  const side = "flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold hover:bg-white hover:translate-x-1 transition";

  const Avatar = ({ id, nome, src, size = "w-11 h-11" }: { id?: number; nome?: string; src?: string | null; size?: string }) => {
    const c = colorFor(id);
    return <span className={`${size} rounded-full grid place-items-center font-bold overflow-hidden shrink-0`} style={{ background: c, color: textOn(c) }}>{src ? <img loading="lazy" decoding="async" src={src} alt="" className="w-full h-full object-cover" /> : (nome?.[0] || "?").toUpperCase()}</span>;
  };

  const topComments = comments.filter(c => !c.parentId);
  const repliesOf = (id: number) => comments.filter(c => c.parentId === id);

  const CommentView = ({ c, reply }: { c: Comment; reply?: boolean }) => (
    <div className={`flex gap-2 ${reply ? "ml-10 mt-2" : ""} rise`}>
      <Avatar id={c.authorId} nome={c.authorNome} src={c.authorAvatar} size={reply ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm"} />
      <div className="min-w-0 flex-1">
        <div className="bg-ivory2 rounded-2xl px-3.5 py-2 inline-block max-w-full">
          <Link href={`/utente/${c.authorId}`} className="font-semibold text-sm hover:underline">{c.authorNome} {c.authorCogen}</Link>
          <div onClick={e => { const t = (e.target as HTMLElement).closest("[data-tag]"); if (t) { e.preventDefault(); onTag(t.getAttribute("data-tag") || ""); } }} className="text-navy/85 text-sm whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: decorate(renderRich(c.text), allUsers) }} />
        </div>
        <div className="flex items-center gap-3 px-2 mt-0.5 text-xs text-navy/55 font-semibold">
          <span className="font-normal">{c.createdAt ? timeAgo(c.createdAt) : c.time}</span>
          {user && <button onClick={() => { setReplyTo({ id: c.parentId || c.id, nome: c.authorNome }); commentBoxRef.current?.focus(); }} className="hover:text-wine">Rispondi</button>}
          {(isAdmin || isMod || (user && user.id === c.authorId)) && <button onClick={() => deleteComment(c.id)} className="hover:text-red-600">Elimina</button>}
          {user && user.id !== c.authorId && <button onClick={() => openReport({ commentId: c.id })} className="hover:text-red-600">Segnala</button>}
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4" aria-busy="true">
      {[0, 1, 2].map(i => <div key={i} className="bg-white rounded-2xl border border-line p-5 animate-pulse"><div className="flex gap-3"><div className="w-11 h-11 rounded-full bg-ivory2" /><div className="flex-1 space-y-2"><div className="h-3 bg-ivory2 rounded w-1/3" /><div className="h-3 bg-ivory2 rounded w-1/5" /></div></div><div className="mt-4 space-y-2"><div className="h-3 bg-ivory2 rounded" /><div className="h-3 bg-ivory2 rounded w-5/6" /><div className="h-28 bg-ivory2 rounded-xl" /></div></div>)}
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_290px] lg:gap-6">
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-1">
            {user ? (
              <Link href="/profilo" className={side}><Avatar id={user.id} nome={user.nome || initial} src={user.avatar} size="w-10 h-10" /><span className="truncate">{user.nome} {user.cognome}</span></Link>
            ) : (
              <Link href="/login" className={side}><UserIcon className="w-6 h-6 text-wine" />Accedi</Link>
            )}
            <Link href="/messaggi" className={side}><MessageSquare className="w-6 h-6 text-wine" />Messaggi</Link>
            <Link href="/eventi" className={side}><CalendarDays className="w-6 h-6 text-wine" />Eventi</Link>
            <Link href="/consulenza" className={side}><Briefcase className="w-6 h-6 text-wine" />Consulenza</Link>
            <Link href="/video" className={side}><VideoIcon className="w-6 h-6 text-wine" />Video</Link>
            {isAdmin && <Link href="/utenti" className={side}><Users className="w-6 h-6 text-wine" />Utenti</Link>}
            {(isAdmin || isMod) && <Link href="/admin/segnalazioni" className={side}><Flag className="w-6 h-6 text-wine" />Segnalazioni{reportsOpen > 0 && <span className="ml-auto min-w-[22px] h-[22px] px-1.5 rounded-full bg-coral text-white text-xs font-bold grid place-items-center">{reportsOpen}</span>}</Link>}
            {user && <button onClick={() => window.dispatchEvent(new Event("spi-tour"))} className={side + " w-full text-left"}><Compass className="w-6 h-6 text-wine" />Visita guidata</button>}
            <p className="px-3 pt-4 text-xs text-navy/50">Self Publishing Italia · la community degli autori indipendenti</p>
          </div>
        </aside>

        <main className="min-w-0 max-w-2xl w-full mx-auto">
          {user && suspendedUntil && new Date(suspendedUntil) > new Date() && (
            <div role="alert" className="mb-4 rounded-2xl border-2 border-brass bg-brass/20 p-4 font-semibold">
              Sei sospeso: non puoi pubblicare post e commenti fino a {new Date(suspendedUntil).toLocaleString("it-IT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}. Puoi comunque leggere e mettere Mi piace.
            </div>
          )}
          <GuidedTour enabled={!!user} />
          <div data-tour="stories"><Stories user={user} canPost={!(suspendedUntil && new Date(suspendedUntil) > new Date())} say={say} /></div>
          {user && <div className="lg:hidden -mt-2 mb-3 text-right"><button onClick={() => window.dispatchEvent(new Event("spi-tour"))} className="text-xs font-semibold text-wine hover:underline inline-flex items-center gap-1"><Compass className="w-3.5 h-3.5" />Rivedi la visita guidata</button></div>}
          {user ? (
            <div data-tour="composer" className={`bg-white rounded-2xl border shadow-sm p-4 mb-4 transition ${dragging ? "border-wine ring-4 ring-wine/20" : "border-line"}`}
              onDragOver={e => { e.preventDefault(); if (!dragging) { setDragging(true); setShowNewPost(true); } }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const fs = Array.from(e.dataTransfer.files); if (fs.some(f => f.type.startsWith("image/"))) uploadImageFiles(fs, "post"); const pdf = fs.find(f => f.type === "application/pdf"); if (pdf) uploadPdf({ target: { files: [pdf], value: "" } } as any, "post"); }}>
              <div className="flex items-start gap-3">
                <Avatar id={user.id} nome={user.nome || initial} src={user.avatar} />
                <div className="flex-1 min-w-0 relative">
                  <textarea ref={composerRef} value={newContent} onFocus={() => setShowNewPost(true)} onKeyDown={e => { mentionKey(e, "post"); }} onChange={e => { setNewContent(e.target.value); detectMention(e.target.value, e.target.selectionStart, "post"); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 320) + "px"; }}
                    rows={showNewPost ? 3 : 1} placeholder={dragging ? "Rilascia qui foto o PDF…" : `A cosa stai lavorando, ${user.nome}?`}
                    className="w-full px-4 py-3 rounded-2xl bg-ivory2 text-navy placeholder-navy/50 resize-none outline-none focus:ring-2 focus:ring-wine/40 transition" />
                  <MentionMenu target="post" className="top-[calc(100%-3.2rem)]" />
                  {showNewPost && (
                    <div className="rise">
                      <div className="flex flex-wrap items-center gap-1.5 mt-3" role="group" aria-label="Categoria del post">
                        <span className="text-xs font-bold uppercase tracking-wide text-navy/45 mr-1">Categoria</span>
                        {CATS.map(c => <button key={c.k} onClick={() => setNewCategory(c.k)} aria-pressed={newCategory === c.k} className={`px-3 py-1 rounded-full text-sm font-semibold border-2 transition active:scale-95 ${newCategory === c.k ? "text-navy" : "border-line text-navy/60 hover:border-navy/30"}`} style={newCategory === c.k ? { background: c.c + "33", borderColor: c.c } : undefined}>{c.l}</button>)}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">{EMOJI.map(e => <button key={e} onClick={() => addEmoji(e)} className="w-9 h-9 rounded-full hover:bg-ivory2 hover:scale-125 transition text-xl" aria-label={`Inserisci ${e}`}>{e}</button>)}</div>
                      {pdfProgress !== null && (
                        <div className="mt-2" role="status" aria-live="polite"><div className="h-2 rounded-full bg-ivory2 overflow-hidden"><div className="h-full bg-wine transition-all" style={{ width: `${pdfProgress}%` }} /></div><p className="text-xs text-navy/70 mt-1">Caricamento in corso… {pdfProgress}%</p></div>
                      )}
                      {pdfError && <p className="mt-2 text-sm text-red-600">{pdfError}</p>}
                      {pollOn && (
                        <div className="mt-3 rounded-xl border-2 border-line p-3 rise">
                          <div className="flex items-center justify-between mb-2"><b className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-wine" />Sondaggio</b><button onClick={() => { setPollOn(false); setPollOpts(["", ""]); }} className="text-sm text-navy/60 hover:text-red-600">Rimuovi</button></div>
                          <p className="text-xs text-navy/55 mb-2">La domanda è il testo del post. Scrivi da 2 a 6 risposte.</p>
                          <div className="space-y-2">
                            {pollOpts.map((o, i) => (
                              <div key={i} className="flex gap-2">
                                <input value={o} maxLength={80} onChange={e => setPollOpts(os => os.map((x, j) => j === i ? e.target.value : x))} placeholder={`Risposta ${i + 1}`} className="flex-1 p-2.5 rounded-lg bg-ivory2 text-sm outline-none focus:ring-2 focus:ring-wine/40" />
                                {pollOpts.length > 2 && <button onClick={() => setPollOpts(os => os.filter((_, j) => j !== i))} aria-label="Togli risposta" className="p-2 rounded-lg hover:bg-ivory2"><X className="w-4 h-4" /></button>}
                              </div>
                            ))}
                          </div>
                          {pollOpts.length < 6 && <button onClick={() => setPollOpts(os => [...os, ""])} className="mt-2 text-sm font-semibold text-wine hover:underline">+ Aggiungi risposta</button>}
                        </div>
                      )}
                      {showLinkInput && (
                        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                          <input type="text" placeholder="Etichetta (es. Guarda su Amazon)" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} className="p-2 rounded-lg bg-ivory2 text-sm" />
                          <input type="text" placeholder="https://…" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="p-2 rounded-lg bg-ivory2 text-sm" />
                          <button onClick={insertLink} className="px-3 py-2 bg-wine text-white rounded-lg font-semibold text-sm">Aggiungi</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <input type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => uploadImages(e, "post")} ref={fileInputRef} className="hidden" />
              <input type="file" accept="application/pdf,.pdf" onChange={e => uploadPdf(e, "post")} ref={pdfInputRef} className="hidden" />
              <input type="file" accept="video/*" onChange={e => uploadVideo(e, "post")} ref={videoInputRef} className="hidden" />
              <div data-tour="allegati" className="flex items-center gap-0.5 mt-3 pt-2 border-t border-ivory2 text-xs font-semibold">
                <button onClick={() => { setShowNewPost(true); fileInputRef.current?.click(); }} className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg hover:bg-ivory2"><Image className="w-4 h-4 text-mint" /><span className="hidden sm:inline">Foto</span></button>
                <button onClick={() => { setShowNewPost(true); videoInputRef.current?.click(); }} disabled={pdfProgress !== null} className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg hover:bg-ivory2 disabled:opacity-60"><VideoIcon className="w-4 h-4 text-wine" /><span className="hidden sm:inline">Video</span></button>
                <button onClick={() => { setShowNewPost(true); pdfInputRef.current?.click(); }} disabled={pdfProgress !== null} className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg hover:bg-ivory2 disabled:opacity-60"><FileText className="w-4 h-4 text-coral" /><span className="hidden sm:inline">PDF</span></button>
                <button onClick={() => { setShowNewPost(true); setShowLinkInput(v => !v); }} className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg hover:bg-ivory2"><LinkIcon className="w-4 h-4 text-wine" /><span className="hidden sm:inline">Link</span></button>
                <button onClick={() => { setShowNewPost(true); setPollOn(v => !v); }} aria-pressed={pollOn} className={`flex items-center justify-center gap-1 px-2 py-1 rounded-lg hover:bg-ivory2 ${pollOn ? "bg-ivory2" : ""}`}><BarChart3 className="w-4 h-4 text-coral" /><span className="hidden sm:inline">Sondaggio</span></button>
                <button onClick={() => { setShowNewPost(true); composerRef.current?.focus(); }} className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg hover:bg-ivory2"><Smile className="w-4 h-4 text-brass" /><span className="hidden sm:inline">Emoji</span></button>
              </div>
              <div className="flex items-center justify-end gap-2 mt-2 text-sm font-semibold">
                {showNewPost && <button onClick={() => { setShowNewPost(false); setNewContent(""); setShowLinkInput(false); setPollOn(false); setPollOpts(["", ""]); if (composerRef.current) composerRef.current.style.height = ""; }} className="px-2 py-1 rounded-lg text-navy/60 hover:bg-ivory2">Annulla</button>}
                <button onClick={handleCreatePost} disabled={!newContent.trim() || publishing} className="px-4 py-1 rounded-lg bg-wine text-white disabled:opacity-40 hover:brightness-110 active:scale-95 transition">{publishing ? "Pubblico…" : "Pubblica"}</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-line p-5 mb-4 text-center"><Link href="/login" className="font-semibold underline">Accedi</Link> o <Link href="/registrati" className="font-semibold underline">registrati</Link> per scrivere, commentare e reagire ai post.</div>
          )}

          <div data-tour="filtri" className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            <div className="relative shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy/50" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cerca nei post" aria-label="Cerca nei post" className="pl-9 pr-3 py-2 rounded-full bg-white border border-line text-sm w-40 focus:w-56 transition-all outline-none focus:border-wine" />
            </div>
            {FILTERS.filter(([k]) => k !== "miei" || user).map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k} className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition active:scale-95 ${filter === k ? "bg-wine text-white" : "bg-white border border-line hover:border-wine"}`}>{l}</button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1" role="group" aria-label="Categorie">
            <button onClick={() => setCatFilter("tutte")} aria-pressed={catFilter === "tutte"} className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition ${catFilter === "tutte" ? "bg-navy text-white" : "bg-white border border-line hover:border-navy/40"}`}>Tutte le categorie</button>
            {CATS.map(c => <button key={c.k} onClick={() => setCatFilter(c.k)} aria-pressed={catFilter === c.k} className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition border ${catFilter === c.k ? "text-navy" : "bg-white border-line hover:border-navy/40"}`} style={catFilter === c.k ? { background: c.c + "33", borderColor: c.c } : undefined}><span className="w-2.5 h-2.5 rounded-full" style={{ background: c.c }} />{c.l}</button>)}
          </div>

          {pending && (
            <div className="sticky top-20 z-30 flex justify-center mb-3">
              <button onClick={() => { setPosts(pending); setPending(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="bg-wine text-white font-semibold px-5 py-2.5 rounded-full shadow-lg inline-flex items-center gap-2 rise hover:brightness-110"><ArrowUp className="w-4 h-4" />Ci sono nuovi post</button>
            </div>
          )}

          <div className="space-y-4">
            {visible.length === 0 && (
              <div className="bg-white border border-line rounded-2xl p-8 text-center">
                <h3 className="text-xl font-bold">{posts.length === 0 ? "Ancora nessun post" : "Nessun post trovato"}</h3>
                <p className="mt-2 text-navy/70">{posts.length === 0 ? "Scrivi tu il primo: presentati e racconta a cosa stai lavorando." : "Prova con un'altra parola o cambia filtro."}</p>
              </div>
            )}
            {visible.map(post => {
              const mineR = REACTIONS.find(r => r.k === post.myReaction);
              const total = post.likes || 0;
              const top = Object.entries(post.reactions || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => REACTIONS.find(r => r.k === k)?.e).filter(Boolean);
              const open = selectedPost?.id === post.id;
              return (
              <article id={`post-${post.id}`} key={post.id} className={`bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md scroll-mt-24 rise overflow-hidden ${post.pinned ? "border-brass border-2" : "border-line"}`}>
                {post.pinned && <div className="bg-brass/40 px-4 py-1.5 text-sm font-bold flex items-center gap-2"><Pin className="w-4 h-4" />In evidenza</div>}
                <div className="p-4 md:p-5">
                  <div className="flex items-center gap-3">
                    <Avatar id={post.authorId} nome={post.authorNome || post.authorCogen} src={post.authorAvatar} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/utente/${post.authorId}`} className="font-semibold hover:underline">{post.authorNome} {post.authorCogen}</Link>
                      <div className="text-xs text-navy/60 flex flex-wrap items-center gap-x-2 gap-y-1" title={post.createdAt ? new Date(post.createdAt).toLocaleString("it-IT") : ""}>{timeAgo(post.createdAt)}{catOf(post.category) && catOf(post.category)!.k !== "generale" && <button onClick={() => setCatFilter(catOf(post.category)!.k)} className="px-2 py-0.5 rounded-full font-semibold text-navy hover:brightness-95" style={{ background: catOf(post.category)!.c + "40" }}>{catOf(post.category)!.l}</button>}</div>
                    </div>
                    {isAdmin && <button onClick={() => togglePin(post)} aria-label={post.pinned ? "Togli dall'evidenza" : "Metti in evidenza"} title={post.pinned ? "Togli dall'evidenza" : "Metti in evidenza"} className={`p-2 rounded-full transition ${post.pinned ? "text-wine bg-brass/40" : "text-navy/40 hover:text-wine hover:bg-ivory2"}`}><Pin className="w-4 h-4" /></button>}
                    {user && user.id !== post.authorId && <button onClick={() => openReport({ postId: post.id })} aria-label="Segnala il post" title="Segnala" className="p-2 rounded-full text-navy/30 hover:text-red-600 hover:bg-red-50 transition"><Flag className="w-4 h-4" /></button>}
                    {(isAdmin || isMod || (user && user.id === post.authorId)) && (
                      <button onClick={() => deletePost(post.id)} aria-label="Elimina il post" className="p-2 rounded-full text-navy/40 hover:text-red-600 hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                  <div className="relative" onDoubleClick={() => burst(post)}>
                    {post.title && <h3 className="text-lg md:text-xl font-extrabold mt-3 mb-1.5 leading-tight">{post.title}</h3>}
                    <div className={post.title ? "" : "mt-3"}><PostBody content={post.content} onZoom={setZoomSrc} members={allUsers} onTag={onTag} /></div>
                    {post.poll && (
                      <div className="mt-3 space-y-2" role="group" aria-label="Sondaggio">
                        {post.poll.options.map((o, i) => {
                          const pct = post.poll!.total ? Math.round((o.votes / post.poll!.total) * 100) : 0;
                          const mine = post.poll!.mine === i;
                          return (
                            <button key={i} onClick={() => vote(post.id, i)} aria-pressed={mine} className={`relative w-full text-left rounded-xl border-2 overflow-hidden transition active:scale-[.99] ${mine ? "border-wine" : "border-line hover:border-navy/30"}`}>
                              <span className={`absolute inset-y-0 left-0 transition-all duration-500 ${mine ? "bg-wine/20" : "bg-ivory2"}`} style={{ width: `${pct}%` }} />
                              <span className="relative flex items-center justify-between gap-3 px-4 py-2.5">
                                <span className="font-semibold flex items-center gap-2">{mine && <Check className="w-4 h-4 text-wine" />}{o.text}</span>
                                <span className="text-sm text-navy/65 shrink-0">{pct}% <span className="text-navy/40">({o.votes})</span></span>
                              </span>
                            </button>
                          );
                        })}
                        <p className="text-xs text-navy/55">{post.poll.total === 1 ? "1 voto" : `${post.poll.total} voti`}. Tocca di nuovo la tua risposta per toglierla.</p>
                      </div>
                    )}
                    {burstId === post.id && <span className="pointer-events-none absolute inset-0 grid place-items-center"><Heart className="w-24 h-24 text-red-500 fill-red-500 burst drop-shadow-lg" /></span>}
                  </div>
                  {(total > 0 || (post.comments || 0) > 0) && (
                    <div className="flex items-center justify-between mt-4 text-sm text-navy/60">
                      <span className="inline-flex items-center gap-1.5">{total > 0 && <><span className="flex -space-x-1">{top.map((e, i) => <span key={i} className="w-5 h-5 rounded-full bg-white border border-line grid place-items-center text-[12px] leading-none">{e}</span>)}</span>{post.myReaction && total > 1 ? `Tu e altri ${total - 1}` : total}</>}</span>
                      <button onClick={() => openComments(post, true)} className="hover:underline">{(post.comments || 0) > 0 ? `${post.comments} ${post.comments === 1 ? "commento" : "commenti"}` : ""}</button>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-3 pt-1.5 border-t border-ivory2 text-sm font-semibold">
                    <div className="relative flex-1" onMouseEnter={() => showPicker(post.id)} onMouseLeave={hidePicker}
                      onTouchStart={() => { clearTimeout(timers.current.lp); timers.current.lp = setTimeout(() => setPickerFor(post.id), 450); }} onTouchEnd={() => clearTimeout(timers.current.lp)} onTouchMove={() => clearTimeout(timers.current.lp)}>
                      {pickerFor === post.id && (
                        <div className="absolute bottom-full left-0 mb-2 z-20 flex gap-1 bg-white rounded-full shadow-xl border border-line px-2 py-1.5 pick" onMouseEnter={() => clearTimeout(timers.current.pk)}>
                          {REACTIONS.map(r => <button key={r.k} onClick={e => { e.stopPropagation(); react(post.id, r.k); }} title={r.l} aria-label={r.l} className="text-2xl w-10 h-10 rounded-full hover:scale-150 hover:-translate-y-2 transition-transform origin-bottom">{r.e}</button>)}
                        </div>
                      )}
                      <button onClick={() => react(post.id)} aria-pressed={!!post.myReaction} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg transition active:scale-95 ${mineR ? mineR.c : "text-navy/60"} hover:bg-ivory2`}>
                        {mineR ? <span className={`text-xl leading-none ${popId === post.id ? "pop" : ""}`}>{mineR.e}</span> : <Heart className="w-5 h-5" />}{mineR ? mineR.l : "Mi piace"}
                      </button>
                    </div>
                    <button onClick={() => openComments(post, true)} aria-expanded={open} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition active:scale-95 ${open ? "bg-ivory2 text-navy" : "text-navy/60 hover:bg-ivory2"}`}>
                      <MessageCircle className="w-5 h-5" />Commenta
                    </button>
                    <button onClick={async () => { try { await navigator.clipboard.writeText(`${location.origin}/community#post-${post.id}`); setCopiedId(post.id); setTimeout(() => setCopiedId(null), 1500); say("Link copiato"); } catch {} }} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-navy/60 hover:bg-ivory2 transition active:scale-95">
                      {copiedId === post.id ? <><Check className="w-5 h-5 text-green-600" />Copiato</> : <><Share2 className="w-5 h-5" />Condividi</>}
                    </button>
                  </div>
                  {open && (
                    <div className="mt-3 pt-3 border-t border-ivory2 space-y-3">
                      {topComments.length === 0 && <p className="text-sm text-navy/60">Nessun commento: scrivi tu il primo.</p>}
                      {topComments.map(c => (
                        <div key={c.id}>
                          <CommentView c={c} />
                          {repliesOf(c.id).map(r => <CommentView key={r.id} c={r} reply />)}
                        </div>
                      ))}
                      {user ? (
                        <div className="pt-1">
                          {replyTo && <div className="flex items-center gap-2 text-xs text-navy/70 mb-1 ml-10">Stai rispondendo a <b>{replyTo.nome}</b><button onClick={() => setReplyTo(null)} aria-label="Annulla risposta" className="p-0.5 rounded-full hover:bg-ivory2"><X className="w-3.5 h-3.5" /></button></div>}
                          <div className="flex items-end gap-2">
                            <Avatar id={user.id} nome={user.nome || initial} src={user.avatar} size="w-8 h-8 text-sm" />
                            <div className="flex-1 min-w-0 bg-ivory2 rounded-2xl px-3 py-1.5 relative">
                              <MentionMenu target="comment" className="bottom-full mb-1" />
                              <textarea ref={commentBoxRef} rows={1} value={newComment} onChange={e => { setNewComment(e.target.value); detectMention(e.target.value, e.target.selectionStart, "comment"); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
                                onKeyDown={e => { if (mentionKey(e, "comment")) return; if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                                placeholder={replyTo ? `Rispondi a ${replyTo.nome}…` : "Scrivi un commento…"} className="w-full bg-transparent resize-none outline-none py-1 text-sm" />
                              <div className="flex items-center gap-1 -ml-1">
                                <input type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => uploadImages(e, "comment")} ref={commentFileInputRef} className="hidden" />
                                <input type="file" accept="application/pdf,.pdf" onChange={e => uploadPdf(e, "comment")} ref={commentPdfInputRef} className="hidden" />
                                <button onClick={() => commentFileInputRef.current?.click()} aria-label="Aggiungi foto" className="p-1.5 rounded-full hover:bg-white text-navy/60"><Image className="w-4 h-4" /></button>
                                <button onClick={() => commentPdfInputRef.current?.click()} disabled={pdfProgress !== null} aria-label="Aggiungi PDF" className="p-1.5 rounded-full hover:bg-white text-navy/60 disabled:opacity-50"><FileText className="w-4 h-4" /></button>
                                <button onClick={() => setShowLinkInput(v => !v)} aria-label="Aggiungi link" className="p-1.5 rounded-full hover:bg-white text-navy/60"><LinkIcon className="w-4 h-4" /></button>
                                {["\u{1F44F}", "❤️", "\u{1F602}"].map(e => <button key={e} onClick={() => setNewComment(t => t + e)} className="p-1 rounded-full hover:bg-white hover:scale-125 transition text-base">{e}</button>)}
                              </div>
                            </div>
                            <button onClick={handleAddComment} disabled={!newComment.trim() || sendingComment} aria-label="Invia commento" className="w-10 h-10 rounded-full bg-wine text-white grid place-items-center disabled:opacity-40 active:scale-90 transition"><Send className="w-4 h-4" /></button>
                          </div>
                          {pdfProgress !== null && <p className="text-xs text-navy/70 mt-1 ml-10" role="status">Caricamento in corso… {pdfProgress}%</p>}
                          {pdfError && <p className="text-xs text-red-600 mt-1 ml-10">{pdfError}</p>}
                          {showLinkInput && (
                            <div className="mt-2 ml-10 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                              <input type="text" placeholder="Etichetta" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} className="p-2 rounded-lg bg-ivory2 text-sm" />
                              <input type="text" placeholder="https://…" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="p-2 rounded-lg bg-ivory2 text-sm" />
                              <button onClick={insertCommentLink} className="px-3 py-2 bg-wine text-white rounded-lg font-semibold text-sm">Inserisci</button>
                            </div>
                          )}
                        </div>
                      ) : <p className="text-sm text-navy/60"><Link href="/login" className="underline font-semibold">Accedi</Link> per commentare.</p>}
                    </div>
                  )}
                </div>
              </article>
              );
            })}
          </div>
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-4">
            <div className="bg-white rounded-2xl border border-line p-4">
              <h2 className="font-extrabold mb-3 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-wine" />Prossimi eventi</h2>
              {events.length === 0 ? <p className="text-sm text-navy/60">Nessun evento in programma.</p> : events.map(e => (
                <Link key={e.id} href="/eventi" className="block py-2 border-t first:border-0 border-ivory2 hover:text-wine"><b className="block text-sm leading-snug">{e.title}</b><span className="text-xs text-navy/60">{e.date}</span></Link>
              ))}
            </div>
            {trending.length > 0 && (
              <div className="bg-white rounded-2xl border border-line p-4">
                <h2 className="font-extrabold mb-3 flex items-center gap-2"><Hash className="w-5 h-5 text-wine" />Argomenti di tendenza</h2>
                <div className="flex flex-wrap gap-2">{trending.map(([t, n]) => <button key={t} onClick={() => onTag(t)} className="px-3 py-1.5 rounded-full bg-ivory2 text-sm font-semibold hover:bg-line transition">#{t} <span className="text-navy/45 font-normal">{n}</span></button>)}</div>
              </div>
            )}
            {members.length > 0 && (
              <div className="bg-white rounded-2xl border border-line p-4">
                <h2 className="font-extrabold mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-wine" />Nuovi iscritti</h2>
                {members.map(m => (
                  <Link key={m.id} href={`/utente/${m.id}`} className="flex items-center gap-3 py-1.5 hover:text-wine hover:translate-x-1 transition">
                    <Avatar id={m.id} nome={m.nome} src={m.avatar} size="w-9 h-9 text-sm" />
                    <span className="text-sm font-semibold truncate">{m.nome} {m.cognome}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {reportTarget && (
        <div className="fixed inset-0 z-50 bg-navy/60 grid place-items-center p-4" onClick={() => setReportTarget(null)} role="dialog" aria-modal="true" aria-label="Segnala un contenuto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl rise" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="text-xl font-extrabold flex items-center gap-2"><Flag className="w-5 h-5 text-red-600" />Segnala {reportTarget.commentId ? "il commento" : "il post"}</h2><button onClick={() => setReportTarget(null)} aria-label="Chiudi" className="p-2 rounded-full hover:bg-ivory2"><X className="w-5 h-5" /></button></div>
            <p className="text-sm text-navy/65 mt-1">Lo vedrà solo chi amministra la community. Chi l'ha scritto non saprà che l'hai segnalato.</p>
            <div className="mt-4 space-y-2">
              {REPORT_REASONS.map(r => <label key={r.k} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${reportReason === r.k ? "border-wine bg-wine/5" : "border-line hover:border-navy/30"}`}><input type="radio" name="reason" checked={reportReason === r.k} onChange={() => setReportReason(r.k)} className="accent-[#5b3df5]" /><span className="font-semibold">{r.l}</span></label>)}
            </div>
            <textarea value={reportNote} onChange={e => setReportNote(e.target.value)} maxLength={500} rows={3} placeholder="Vuoi aggiungere un dettaglio? (facoltativo)" className="mt-3 w-full p-3 rounded-xl bg-ivory2 resize-none outline-none focus:ring-2 focus:ring-wine/40" />
            <div className="flex gap-2 mt-4">
              <button onClick={sendReport} disabled={reporting} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50 hover:brightness-110">{reporting ? "Invio\u2026" : "Invia segnalazione"}</button>
              <button onClick={() => setReportTarget(null)} className="px-5 py-3 rounded-xl bg-white border-2 border-line font-semibold">Annulla</button>
            </div>
          </div>
        </div>
      )}
      {zoomSrc && (
        <div className="fixed inset-0 bg-navy/90 z-50 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomSrc(null)} role="dialog" aria-label="Foto ingrandita">
          <button className="absolute top-4 right-4 text-white p-2" aria-label="Chiudi"><X className="w-7 h-7" /></button>
          <img loading="lazy" decoding="async" src={zoomSrc} alt="Foto ingrandita" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
      {toast && <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-navy text-white px-5 py-3 rounded-full shadow-xl font-semibold text-sm toast">{toast}</div>}
    </div>
  );
}
