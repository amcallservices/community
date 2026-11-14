"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { renderRich, parseRich } from "@/lib/sanitize";
import { upload } from "@vercel/blob/client";
import { Heart, FileText, MessageCircle, Trash2, X, Plus, Send, Image, Link as LinkIcon, Share2, Check, ChevronDown } from "lucide-react";

type Post = { id: number; title: string; content: string; authorId?: number; authorNome: string; authorCogen: string; authorRole: string; authorAvatar: string | null; likes: number; comments: number; category: string; createdAt: string };
type Comment = { id: number; text: string; authorId?: number; authorNome: string; authorCogen: string; authorAvatar: string | null; time: string };

const PALETTE = ["#ffc83d", "#ff6b6b", "#2dd4a7", "#5b3df5", "#38bdf8", "#f472b6"];
const colorFor = (id?: number) => PALETTE[Math.abs(id || 0) % PALETTE.length];
const textOn = (c: string) => (c === "#5b3df5" || c === "#ff6b6b" ? "#fff" : "#1b1464");

function timeAgo(iso?: string) {
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

function PostBody({ content, onZoom }: { content: string; onZoom: (src: string) => void }) {
  const { html, images, pdfs } = parseRich(content);
  const [open, setOpen] = useState(false);
  const long = html.length > 260 || html.split("\n").length > 4;
  return (
    <div>
      {html && (
        <>
          <div className={`text-navy/80 whitespace-pre-wrap leading-relaxed ${open || !long ? "" : "line-clamp-4"}`} dangerouslySetInnerHTML={{ __html: html }} />
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [commentImage, setCommentImage] = useState<string>("");
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [popId, setPopId] = useState<number | null>(null);
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState("");
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const commentPdfInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setIsAdmin(u.role === 'admin');
    }
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
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

  const uploadImages = async (e: React.ChangeEvent<HTMLInputElement>, target: "post" | "comment") => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    e.target.value = "";
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
        html += `\n<img src="${src}" alt="Immagine" />\n`;
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
    if (!newTitle.trim() || !newContent.trim() || !user) return;
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        content: newContent,
        authorId: user.id,
        authorNome: user.nome,
        authorCogen: user.cognome,
        authorRole: user.role,
        userEmail: user.email
      })
    });
    setNewTitle("");
    setNewContent("");
    setUploadedImage("");
    setShowNewPost(false);
    loadPosts();
  };

  const handleLike = async (postId: number) => {
    if (!user) return;
    // aggiornamento immediato, poi conferma dal server
    const before = posts;
    const likedKey = `liked_${user.id}_${postId}`;
    const wasLiked = localStorage.getItem(likedKey) === "1";
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 0) + (wasLiked ? -1 : 1)) } : p));
    try {
      const res = await fetch("/api/posts/like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId }) });
      if (!res.ok) throw new Error();
      const { liked } = await res.json();
      if (liked) localStorage.setItem(likedKey, "1"); else localStorage.removeItem(likedKey);
    } catch {
      setPosts(before);
    }
  };

  const openComments = async (post: Post, toggle = false) => {
    if (toggle && selectedPost?.id === post.id) { setSelectedPost(null); return; }
    setSelectedPost(post);
    const res = await fetch(`/api/posts-comments?postId=${post.id}`);
    if (res.ok) setComments(await res.json());
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !selectedPost) return;
    await fetch("/api/posts-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: selectedPost.id,
        text: newComment,
        authorNome: user.nome,
        authorCogen: user.cognome,
        userEmail: user.email
      })
    });
    setNewComment("");
    setCommentImage("");
    openComments(selectedPost);
    setPosts(ps => ps.map(p => p.id === selectedPost.id ? { ...p, comments: (p.comments || 0) + 1 } : p));
  };

  const deletePost = async (id: number, authorId: number, admin: boolean) => {
    if (!confirm("Sei sicuro di voler eliminare questo post?")) return;
    try {
      const res = await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadPosts();
        setSelectedPost(null);
      } else {
        const data = await res.json();
        alert(data.error || "Errore nella cancellazione");
      }
    } catch (err) {
      alert("Errore");
    }
  };

  const deleteComment = async (commentId: number, postId: number, authorId: number, admin: boolean) => {
    try {
      const res = await fetch(`/api/posts-comments?id=${commentId}`, { method: "DELETE" });
      if (res.ok && selectedPost) {
        openComments(selectedPost);
      }
    } catch (err) {
      alert("Errore");
    }
  };

  if (loading) return <div className="min-h-screen bg-ivory flex items-center justify-center"><div className="text-navy">Caricamento...</div></div>;

  return (
    <div className="min-h-screen bg-ivory">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-navy">Community</h1>
          {user && (
            <button onClick={() => setShowNewPost(true)} className="flex items-center gap-2 px-4 py-2 bg-wine text-white rounded-lg font-semibold hover:brightness-95">
              <Plus className="w-5 h-5" />Nuovo Post
            </button>
          )}
        </div>

        {showNewPost && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-line mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-navy">Nuovo Post</h2>
              <button onClick={() => setShowNewPost(false)} className="text-navy/60 hover:text-navy"><X className="w-5 h-5" /></button>
            </div>
            <input type="text" placeholder="Titolo" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40 mb-3" />
            <textarea placeholder="Contenuto..." value={newContent} onChange={e => setNewContent(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40 h-32" />
            
            <div className="flex gap-2 mt-2">
              <input type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => uploadImages(e, "post")} ref={fileInputRef} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-3 py-1 bg-white rounded-2xl shadow-sm text-navy text-sm hover:bg-ivory2"><Image className="w-4 h-4" />Carica Foto</button>
              <button onClick={() => { setShowLinkInput(true); setShowImageUpload(false); }} className="flex items-center gap-1 px-3 py-1 bg-white rounded-2xl shadow-sm text-navy text-sm hover:bg-ivory2"><LinkIcon className="w-4 h-4" />Link</button>
              <input type="file" accept="application/pdf,.pdf" onChange={e => uploadPdf(e, "post")} ref={pdfInputRef} className="hidden" />
              <button onClick={() => pdfInputRef.current?.click()} disabled={pdfProgress !== null} className="flex items-center gap-1 px-3 py-1 bg-white rounded-2xl shadow-sm text-navy text-sm hover:bg-ivory2 disabled:opacity-60"><FileText className="w-4 h-4" />Carica PDF</button>
            </div>
            {pdfProgress !== null && (
              <div className="mt-3" role="status" aria-live="polite">
                <div className="h-2 rounded-full bg-ivory2 overflow-hidden"><div className="h-full bg-wine transition-all" style={{ width: `${pdfProgress}%` }} /></div>
                <p className="text-sm text-navy/70 mt-1">Caricamento in corso… {pdfProgress}%</p>
              </div>
            )}
            {pdfError && <p className="mt-2 text-sm text-red-600">{pdfError}</p>}
            
            {showLinkInput && (
              <div className="mt-2 space-y-2">
                <input type="text" placeholder="Etichetta link (es: Guarda su Amazon)" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} className="w-full p-2 bg-ivory2 border border-line text-navy placeholder-navy/40 text-sm" />
                <input type="text" placeholder="URL (es: https://amazon.it/...)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="w-full p-2 bg-ivory2 border border-line text-navy placeholder-navy/40 text-sm" />
                <button onClick={insertLink} className="px-3 py-2 bg-wine text-white rounded-lg font-semibold text-sm">Aggiungi</button>
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreatePost} disabled={!newTitle.trim() || !newContent.trim()} className="px-6 py-2 bg-wine text-white rounded-lg font-semibold hover:brightness-95 disabled:opacity-50">Pubblica</button>
              <button onClick={() => { setShowNewPost(false); setUploadedImage(""); }} className="px-6 py-2 bg-ivory2 text-navy hover:bg-ivory2">Annulla</button>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {posts.length === 0 && (
            <div className="bg-white border-2 border-line rounded-3xl p-8 text-center">
              <h3 className="text-xl font-bold">Ancora nessun post</h3>
              <p className="mt-2 text-navy/70">Scrivi tu il primo: presentati e racconta a cosa stai lavorando.</p>
            </div>
          )}
          {posts.map(post => {
            const col = colorFor(post.authorId);
            const liked = typeof window !== "undefined" && !!user && localStorage.getItem(`liked_${user.id}_${post.id}`) === "1";
            const open = selectedPost?.id === post.id;
            return (
            <article id={`post-${post.id}`} key={post.id} className="bg-white rounded-3xl border-2 border-line overflow-hidden hover:border-wine hover:-translate-y-0.5 hover:shadow-lg transition scroll-mt-24">
              <div className="h-1.5" style={{ background: col }} />
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full grid place-items-center font-bold overflow-hidden shrink-0" style={{ background: col, color: textOn(col) }}>
                    {post.authorAvatar ? <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" /> : ((post.authorNome || post.authorCogen)?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/utente/${post.authorId}`} className="font-semibold hover:underline">{post.authorNome} {post.authorCogen}</Link>
                    <div className="text-xs text-navy/60" title={post.createdAt ? new Date(post.createdAt).toLocaleString("it-IT") : ""}>{timeAgo(post.createdAt)}</div>
                  </div>
                  {(isAdmin || (user && user.id === post.authorId)) && (
                    <button onClick={() => deletePost(post.id, user?.id, isAdmin)} aria-label="Elimina il post" className="p-2 rounded-full text-navy/40 hover:text-red-600 hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
                <h3 className="text-xl md:text-2xl font-extrabold mt-4 mb-2 leading-tight">{post.title}</h3>
                <PostBody content={post.content} onZoom={setZoomSrc} />
                <div className="flex items-center gap-1 mt-5 pt-4 border-t-2 border-ivory2">
                  <button onClick={() => { handleLike(post.id); setPopId(post.id); setTimeout(() => setPopId(null), 400); }} aria-pressed={liked} aria-label="Mi piace" className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition ${liked ? "text-red-600 bg-red-50" : "text-navy/60 hover:bg-ivory2 hover:text-navy"}`}>
                    <Heart className={`w-5 h-5 transition ${liked ? "fill-red-500" : ""} ${popId === post.id ? "scale-125" : ""}`} /><span className="font-semibold">{post.likes || 0}</span>
                  </button>
                  <button onClick={() => openComments(post, true)} aria-expanded={open} className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition ${open ? "bg-ivory2 text-navy" : "text-navy/60 hover:bg-ivory2 hover:text-navy"}`}>
                    <MessageCircle className="w-5 h-5" /><span className="font-semibold">{post.comments || 0}</span>
                  </button>
                  <button onClick={async () => { try { await navigator.clipboard.writeText(`${location.origin}/community#post-${post.id}`); setCopiedId(post.id); setTimeout(() => setCopiedId(null), 1500); } catch {} }} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full text-navy/60 hover:bg-ivory2 hover:text-navy transition">
                    {copiedId === post.id ? <><Check className="w-5 h-5 text-green-600" /><span className="text-sm font-semibold">Link copiato</span></> : <><Share2 className="w-5 h-5" /><span className="text-sm font-semibold hidden sm:inline">Condividi</span></>}
                  </button>
                </div>
                {open && (
                  <div className="mt-4 rise">
                    <div className="space-y-3 mb-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-ivory2 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-navy text-xs font-bold overflow-hidden">
                      {comment.authorAvatar ? <img src={comment.authorAvatar} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-wine text-white rounded-lg font-semibold flex items-center justify-center">{(comment.authorNome || comment.authorCogen)?.[0] || "?"}</div>}
                    </div>
                    <Link href={`/utente/${comment.authorId}`} className="font-semibold text-navy text-sm hover:text-navy">{comment.authorNome} {comment.authorCogen}</Link>
                    <span className="text-navy/60 text-xs">{comment.time}</span>
                    {(isAdmin || (user && user.id === comment.authorId)) && (
                      <button onClick={() => deleteComment(comment.id, selectedPost.id, user?.id, isAdmin)} className="text-red-400 hover:text-red-300 text-sm ml-auto"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                  <div className="text-navy/80 text-sm" dangerouslySetInnerHTML={{ __html: renderRich(comment.text) }} />
                </div>
              ))}
                      {comments.length === 0 && <p className="text-sm text-navy/60">Nessun commento: scrivi tu il primo.</p>}
                    </div>
            {user && (
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <input type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => uploadImages(e, "comment")} ref={commentFileInputRef} className="hidden" />
                  <button onClick={() => commentFileInputRef.current?.click()} className="flex items-center gap-1 px-2 py-1 bg-white rounded-2xl shadow-sm text-navy rounded text-xs hover:bg-ivory2"><Image className="w-3 h-3" />Foto</button>
                  <button onClick={() => { setShowLinkInput(!showLinkInput); }} className="flex items-center gap-1 px-2 py-1 bg-white rounded-2xl shadow-sm text-navy rounded text-xs hover:bg-ivory2"><LinkIcon className="w-3 h-3" />Link</button>
                  <input type="file" accept="application/pdf,.pdf" onChange={e => uploadPdf(e, "comment")} ref={commentPdfInputRef} className="hidden" />
                  <button onClick={() => commentPdfInputRef.current?.click()} disabled={pdfProgress !== null} className="flex items-center gap-1 px-2 py-1 bg-white rounded-2xl shadow-sm text-navy text-xs hover:bg-ivory2 disabled:opacity-60"><FileText className="w-3 h-3" />PDF</button>
                </div>
                {pdfProgress !== null && <p className="text-xs text-navy/70 mb-2" role="status">Caricamento in corso… {pdfProgress}%</p>}
                {pdfError && <p className="text-xs text-red-600 mb-2">{pdfError}</p>}
                {showLinkInput && (
                  <div className="mb-2 space-y-1">
                    <input type="text" placeholder="Etichetta" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} className="w-full p-2 bg-ivory2 border border-line rounded text-navy text-sm" />
                    <input type="text" placeholder="URL" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="w-full p-2 bg-ivory2 border border-line rounded text-navy text-sm" />
                    <button onClick={insertCommentLink} className="px-3 py-1 bg-wine text-white rounded-lg font-semibold rounded text-sm">Inserisci</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="text" placeholder="Commento..." value={newComment} onChange={e => setNewComment(e.target.value)} className="flex-1 p-3 bg-ivory2 border border-line text-navy placeholder-navy/40" />
                  <button onClick={handleAddComment} disabled={!newComment.trim()} className="px-4 bg-wine text-white rounded-lg font-semibold disabled:opacity-50"><Send className="w-5 h-5" /></button>
                </div>
              </div>
            )}
                  </div>
                )}
              </div>
            </article>
            );
          })}
        </div>
      </main>

      {zoomSrc && (
        <div className="fixed inset-0 bg-navy/90 z-50 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomSrc(null)} role="dialog" aria-label="Foto ingrandita">
          <button className="absolute top-4 right-4 text-white p-2" aria-label="Chiudi"><X className="w-7 h-7" /></button>
          <img src={zoomSrc} alt="Foto ingrandita" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
