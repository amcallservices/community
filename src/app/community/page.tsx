"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { renderRich } from "@/lib/sanitize";
import { upload } from "@vercel/blob/client";
import { Heart, FileText, MessageCircle, Trash2, X, Plus, Send, Image, Link as LinkIcon, Upload } from "lucide-react";

type Post = { id: number; title: string; content: string; authorId?: number; authorNome: string; authorCogen: string; authorRole: string; authorAvatar: string | null; likes: number; comments: number; category: string; createdAt: string };
type Comment = { id: number; text: string; authorId?: number; authorNome: string; authorCogen: string; authorAvatar: string | null; time: string };

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
        const blob = await upload(`${base}.${ext}`, small, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: small.type || "image/jpeg",
          onUploadProgress: ({ percentage }) => setPdfProgress(Math.round((i * 100 + percentage) / files.length)),
        });
        html += `\n<img src="${blob.url}" alt="Immagine" />\n`;
      }
      if (target === "post") setNewContent(prev => prev + html);
      else setNewComment(prev => prev + html);
    } catch (err: any) {
      if (html) { if (target === "post") setNewContent(prev => prev + html); else setNewComment(prev => prev + html); }
      setPdfError(err?.message?.startsWith("Ogni foto") ? err.message : "Caricamento delle foto non riuscito. Riprova.");
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

  const openComments = async (post: Post) => {
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

        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm p-6 border border-line">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-navy font-bold overflow-hidden">
                  {post.authorAvatar ? <img src={post.authorAvatar} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-wine text-white rounded-lg font-semibold flex items-center justify-center">{(post.authorNome || post.authorCogen)?.[0] || "?"}</div>}
                </div>
                <div className="flex-1">
                  <Link href={`/utente/${post.authorId}`} className="font-semibold text-navy hover:text-navy">{post.authorNome} {post.authorCogen}</Link>
                  <span className="text-navy/60 text-sm ml-2">{post.createdAt ? new Date(post.createdAt).toLocaleDateString('it-IT') : ''}</span>
                </div>
                {(isAdmin || (user && user.id === post.authorId)) && (
                  <button onClick={() => deletePost(post.id, user?.id, isAdmin)} className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm ml-auto"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">{post.title}</h3>
              <div className="text-navy/80 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderRich(post.content) }} />
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-line">
                <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 text-navy/60 hover:text-red-400"><Heart className="w-5 h-5" /><span>{post.likes || 0}</span></button>
                <button onClick={() => openComments(post)} className="flex items-center gap-1 text-navy/60 hover:text-navy"><MessageCircle className="w-5 h-5" /><span>{post.comments || 0}</span></button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-navy">{selectedPost.title}</h2>
              <button onClick={() => setSelectedPost(null)} className="text-navy/60 hover:text-navy"><X className="w-6 h-6" /></button>
            </div>
            <div className="text-navy/80 mb-6 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderRich(selectedPost.content) }} />
            
            <div className="space-y-3 mb-6">
              {comments.map(comment => (
                <div key={comment.id} className="bg-ivory2 p-3">
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
        </div>
      )}
    </div>
  );
}
