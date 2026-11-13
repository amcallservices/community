"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PenLine, User, Video, Calendar, BookOpen, Menu, Plus, Trash2, LogIn, LogOut, UserPlus, Play, ExternalLink } from "lucide-react";

export default function Page() {
  const [videos, setVideos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    const res = await fetch("/api/videos?_=" + Date.now());
    if (res.ok) setVideos(await res.json());
    setLoading(false);
  };

  const saveVideo = async () => {
    if (!title || !url) return;
    const ytId = extractYoutubeId(url);
    if (!ytId) { alert("URL YouTube non valido"); return; }
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, youtubeUrl: ytId, description: desc })
    });
    if (res.ok) { alert("Video aggiunto!"); setTitle(""); setUrl(""); setDesc(""); setShowForm(false); loadVideos(); }
  };

  const deleteVideo = async (id: number) => {
    if (!confirm("Eliminare questo video?")) return;
    const res = await fetch("/api/videos?id=" + id, { method: "DELETE" });
    if (res.ok) loadVideos();
  };

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="min-h-screen bg-ivory">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-navy">Video Corsi</h1>
          {isAdmin && <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-wine text-white rounded-lg font-semibold hover:brightness-95 flex items-center gap-2"><Plus className="w-4 h-4" /> Aggiungi Video</button>}
        </div>
        
        {!isAdmin && user && <p className="text-sm text-navy/60 mb-4">Solo l'admin puo aggiungere video</p>}
        {!isAdmin && !user && <p className="text-sm text-navy/60 mb-4"><Link href="/login" className="text-golddark">Accedi</Link> come admin per aggiungere video</p>}
        
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-line">
            <h3 className="font-bold text-navy mb-4">Nuovo Video</h3>
            <input type="text" placeholder="Titolo" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40 mb-3" />
            <input type="text" placeholder="URL YouTube" value={url} onChange={e => setUrl(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40 mb-3" />
            <textarea placeholder="Descrizione" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40 mb-3" />
            <div className="flex gap-2">
              <button onClick={saveVideo} disabled={!title || !url} className="px-4 py-2 bg-wine text-white rounded-lg font-semibold disabled:opacity-50">Salva</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-white rounded-2xl shadow-sm text-navy">Annulla</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8"><div className="w-8 h-8 border-2 border-wine border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8 text-navy/60">Nessun video ancora</div>
        ) : (
          <div className="grid gap-6">
            {videos.map(video => (
              <div key={video.id} className="bg-white rounded-2xl shadow-sm p-4 border border-line">
                <div className="aspect-video mb-4 overflow-hidden">
                  <iframe src={"https://www.youtube.com/embed/" + video.youtubeUrl} className="w-full h-full" allowFullScreen></iframe>
                </div>
                <div className="flex justify-between items-start">
                  <div><h3 className="font-bold text-navy">{video.title}</h3><p className="text-navy/60 text-sm">{video.description}</p></div>
                  {isAdmin && <button onClick={() => deleteVideo(video.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
