"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  PenLine, 
  Users, 
  BookOpen, 
  Trophy, 
  User, 
  Menu, 
  X,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  GraduationCap,
  Crown,
  Zap,
  TrendingUp,
  Star,
  Award,
  ArrowRight,
  Send,
  Sparkles,
  Target,
  BookMarked,
  Calendar,
  MessageSquareHeart,
  LogIn,
  Trash2,
  Plus,
  UserPlus,
  Ban,
  FileText,
  Upload,
  LogOut,
	  Video
} from "lucide-react";

// Community posts data
const posts = [
  {
    id: 1,
    author: "Marco Rossi",
    avatar: "MR",
    role: "Best Seller",
    title: "Come ho raggiunto 10.000 vendite",
    content: "Dopo 3 anni di self-publishing, ecco i 5 segreti che hanno cambiato tutto. Il primo: scrivi per te stesso, non per il mercato.",
    likes: 342,
    comments: 89,
    time: "1h fa",
    category: "marketing"
  },
  {
    id: 2,
    author: "Giulia Bianchi",
    avatar: "GB",
    role: "Esordiente",
    title: "Il mio primo romanzo è pronto!",
    content: "Finalmente ho finito la prima stesura del mio thriller! Ora inizia il vero lavoro: revisione e editing. Any tips?",
    likes: 156,
    comments: 45,
    time: "3h fa",
    category: "writing"
  },
  {
    id: 3,
    author: "Alessandro Verde",
    avatar: "AV",
    role: "Editor",
    title: "Le 10 cose che rovinano un manoscritto",
    content: "Dopo aver editato oltre 200 libri, ecco gli errori più comuni che vedo. Dal prologo inutile ai dialoghi innaturali.",
    likes: 489,
    comments: 123,
    time: "5h fa",
    category: "editing"
  },
  {
    id: 4,
    author: "Sofia Neri",
    avatar: "SN",
    role: "Autrice Prolifica",
    title: "12 libri in 2 anni: il mio sistema",
    content: "Scrivo 2000 parole al giorno grazie a questa routine. Vi svelo tutto il mio sistema di produzione.",
    likes: 567,
    comments: 98,
    time: "ieri",
    category: "productivity"
  }
];



const courses = [
  // Video inizialmente vuoti - l'admin può aggiungere video YouTube
];

const categories = [
  { id: "all", label: "Tutti", icon: Sparkles },
  { id: "writing", label: "Scrittura", icon: PenLine },
  { id: "marketing", label: "Marketing", icon: TrendingUp },
  { id: "editing", label: "Editing", icon: BookMarked },
  { id: "productivity", label: "Produttività", icon: Target },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("community");
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedPdfComments, setExpandedPdfComments] = useState<number | null>(null);
  const [pdfCommentsMap, setPdfCommentsMap] = useState<Record<number, any[]>>({});
  const [newPdfComment, setNewPdfComment] = useState<Record<number, string>>({});
  
  // Check if admin
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user');
      const user = saved ? JSON.parse(saved) : null;
      return user?.email?.includes('admin') || false;
    }
    return false;
  });
  
  // Check if user is logged in
  const isLoggedIn = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user');
      const user = saved ? JSON.parse(saved) : null;
      return !!user;
    }
    return false;
  };
  
  // Banned users - carica da localStorage
  const [bannedUsers, setBannedUsers] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bannedUsers');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  // Filtra i post per escludere quelli degli utenti bannati
  const visiblePosts = allPosts.filter(post => {
    const authorName = post.author?.name || post.author;
    return !bannedUsers.includes(authorName);
  });
  
  // Videos state - carica da localStorage
  const [videosList, setVideosList] = useState<{id: number; title: string; youtubeUrl: string; description: string}[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('videos');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showCreateVideo, setShowCreateVideo] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoDesc, setNewVideoDesc] = useState("");
  
  // Events state - carica da localStorage
  const [eventsList, setEventsList] = useState<{id: number; title: string; date: string; type: string; meetLink?: string}[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('events');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventType, setNewEventType] = useState("webinar");
  const [newEventMeetLink, setNewEventMeetLink] = useState("");
  
  // Letture/Ebooks state - carica da localStorage
  const [lettureList, setLettureList] = useState<{id: number; title: string; description: string; pdfUrl: string; dataUrl?: string}[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('letture');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showCreateLettura, setShowCreateLettura] = useState(false);
  const [newLetturaTitle, setNewLetturaTitle] = useState("");
  const [newLetturaDesc, setNewLetturaDesc] = useState("");
  const [newLetturaFile, setNewLetturaFile] = useState<string | null>(null);
  
  // Comments state - carica da localStorage
  const [commentsMap, setCommentsMap] = useState<Record<number, {id: number; author: string; text: string; time: string}[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('comments');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [newComment, setNewComment] = useState<Record<number, string>>({});
  
  // Check if admin (verifica dal localStorage o ruolo utente)
  const userStr = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;

  // Carica e sincronizza dati dal database
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const [eventsRes, videosRes, lettureRes, postsRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/videos'),
          fetch('/api/letture'),
          fetch('/api/posts')
        ])
        
        if (eventsRes.ok) setEventsList(await eventsRes.json())
        if (videosRes.ok) setVideosList(await videosRes.json())
        if (lettureRes.ok) setLettureList(await lettureRes.json())
        if (postsRes.ok) setAllPosts(await postsRes.json())
      } catch (e) { console.error(e) }
    }
    
    loadFromDB()
    
    // Auto-refresh posts every 10 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = await res.json();
          setAllPosts(data);
        }
      } catch (e) {}
    }, 10000)
    
    return () => clearInterval(interval)
  }, []);

  const toggleLike = (postId: number) => {
    if (likedPosts.includes(postId)) {
      setLikedPosts(likedPosts.filter(id => id !== postId));
    } else {
      setLikedPosts([...likedPosts, postId]);
    }
  };

  const addComment = async (postId: number) => {
    if (!isLoggedIn()) return;
    
    const text = newComment[postId]?.trim();
    if (!text) return;
    
    // Save to DB
    try {
      const res = await fetch('/api/posts-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, text, authorName: user?.name || 'Utente' })
      });
      if (res.ok) {
        const saved = await res.json();
        const newComment_ = { id: saved.id, text: saved.text || saved.content, author: saved.author || user?.name || 'Utente', time: 'ora' };
        const updated = { ...commentsMap, [postId]: [...(commentsMap[postId] || []), newComment_] };
        setCommentsMap(updated as any);
      }
    } catch (e) {}
    
    setNewComment({ ...newComment, [postId]: "" });
  };

  const toggleComments = async (postId: number) => {
    if (expandedComments.includes(postId)) {
      setExpandedComments(expandedComments.filter(id => id !== postId));
    } else {
      // Load comments from DB
      try {
        const res = await fetch(`/api/posts-comments?postId=${postId}`);
        if (res.ok) {
          const dbComments = await res.json();
          setCommentsMap({ ...commentsMap, [postId]: dbComments });
        }
      } catch (e) {}
      setExpandedComments([...expandedComments, postId]);
    }
  };

  const createPost = async () => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    if (!newPostContent.trim()) return;
    
    // Get current user info
    let userInfo = { name: "Utente", email: "user@test.com", role: "scrittore" };
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user');
      if (saved) userInfo = JSON.parse(saved);
    }
    
    const newPost = {
      id: Date.now(),
      author: userInfo.name || "Utente",
      authorRole: userInfo.role || "Scrittore",
      content: newPostContent,
      likes: 0,
      comments: 0,
      time: "ora",
      category: selectedCategory === "all" ? "writing" : selectedCategory
    };
    
    // Salva nel database con user info
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: "Nuovo post", 
          content: newPostContent, 
          category: newPost.category,
          userEmail: userInfo.email,
          userName: userInfo.name,
          userRole: userInfo.role
        })
      })
      if (res.ok) {
        const saved = await res.json()
        newPost.id = saved.id
      }
    } catch (e) {}
    
    const updated = [newPost, ...allPosts];
    setAllPosts(updated);
    setNewPostContent("");
  };

  const createEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate.trim()) return;
    
    const eventData = {
      title: newEventTitle,
      date: newEventDate,
      type: newEventType,
      meetLink: newEventMeetLink
    };
    
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      if (res.ok) {
        const savedEvent = await res.json();
        const updated = [...eventsList, savedEvent];
        setEventsList(updated);
        localStorage.setItem('events', JSON.stringify(updated));
      }
    } catch (e) {
      // Fallback locale
      const newEvent = { id: Date.now(), ...eventData };
      const updated = [...eventsList, newEvent];
      setEventsList(updated);
      localStorage.setItem('events', JSON.stringify(updated));
    }
    
    setNewEventTitle("");
    setNewEventDate("");
    setNewEventType("webinar");
    setNewEventMeetLink("");
    setShowCreateEvent(false);
  };

  const createVideo = async () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) return;
    
    // Estrai ID YouTube dall'URL
    let youtubeId = "";
    const url = newVideoUrl;
    if (url.includes("youtube.com/watch")) {
      const urlParams = new URL(url).searchParams;
      youtubeId = urlParams.get("v") || "";
    } else if (url.includes("youtu.be/")) {
      youtubeId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    }
    
    const videoData = {
      title: newVideoTitle,
      youtubeUrl: youtubeId,
      description: newVideoDesc
    };
    
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData)
      });
      if (res.ok) {
        const savedVideo = await res.json();
        const updated = [...videosList, savedVideo];
        setVideosList(updated);
        localStorage.setItem('videos', JSON.stringify(updated));
      }
    } catch (e) {
      // Fallback locale
      const newVideo = { id: Date.now(), ...videoData };
      const updated = [...videosList, newVideo];
      setVideosList(updated);
      localStorage.setItem('videos', JSON.stringify(updated));
    }
    
    setNewVideoTitle("");
    setNewVideoUrl("");
    setNewVideoDesc("");
    setShowCreateVideo(false);
  };

  const deleteVideo = async (id: number) => {
    try { await fetch(`/api/videos?id=${id}`, { method: 'DELETE' }) } catch (e) {}
    const updated = videosList.filter(v => v.id !== id);
    setVideosList(updated);
    localStorage.setItem('videos', JSON.stringify(updated));
  };

  const deleteEvent = async (id: number) => {
    try { await fetch(`/api/events?id=${id}`, { method: 'DELETE' }) } catch (e) {}
    const updated = eventsList.filter(e => e.id !== id);
    setEventsList(updated);
    localStorage.setItem('events', JSON.stringify(updated));
  };

  const deleteLettura = async (id: number) => {
    try { await fetch(`/api/letture?id=${id}`, { method: 'DELETE' }) } catch (e) {}
  };

  const filteredPosts = selectedCategory === "all" 
    ? allPosts 
    : allPosts.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-slate-900 to-slate-800 z-40 hidden lg:flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <PenLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold block">Self Publishing</span>
              <span className="text-amber-400 text-sm">Italia</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-4 space-y-2">
          {[
            { id: "community", label: "Self Publishing Italia", desc: "scrittore.site", icon: Users },
            { id: "courses", label: "Video", desc: "Corsi e tutorial", icon: GraduationCap },
            { id: "events", label: "Eventi", desc: "Webinar & sfide", icon: Calendar },
            { id: "letture", label: "Letture", desc: "PDF & eBook", icon: FileText },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full sidebar-link ${activeTab === item.id 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          
          <hr className="border-white/10 my-4" />
          
          <Link
            href="/profilo"
            className="w-full sidebar-link text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Profilo</span>
          </Link>
          
          <hr className="border-white/10 my-4" />
          
          <Link
            href="/registrati"
            className="w-full sidebar-link text-amber-400 hover:bg-amber-500 hover:text-white"
          >
            <UserPlus className="w-5 h-5" />
            <span className="font-medium">Registrati ora</span>
          </Link>
          
          <button
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            className="w-full sidebar-link text-red-400 hover:bg-red-500 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
          
          <Link
            href="/login"
            className="w-full sidebar-link text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <LogIn className="w-5 h-5" />
            <span className="font-medium">Login</span>
          </Link>
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-0 z-50 bg-gradient-to-b from-slate-900 to-slate-800 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                <PenLine className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold">SPI</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)}>
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {['community', 'courses', 'events', 'letture'].map((item) => (
            <button
              key={item}
              onClick={() => { setActiveTab(item); setMobileMenuOpen(false); }}
              className={`w-full sidebar-link capitalize ${activeTab === item ? 'bg-amber-500 text-white' : 'text-slate-400'}`}
            >
              {item}
            </button>
          ))}
          <Link
            href="/registrati"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full sidebar-link text-amber-400"
          >
            Registrati ora
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full sidebar-link text-slate-400"
          >
            Login
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72 min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
            {/* Floating particles */}
            <div className="absolute top-20 right-20 w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
            <div className="absolute bottom-40 left-20 w-3 h-3 bg-orange-400 rounded-full animate-bounce delay-300" />
            <div className="absolute top-40 right-1/3 w-2 h-2 bg-yellow-400 rounded-full animate-bounce delay-500" />
          </div>
          <div className="max-w-4xl mx-auto px-6 relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce">
                <PenLine className="w-7 h-7 text-white" />
              </div>
              <span className="text-amber-400 font-bold text-xl tracking-wide">🏆 Self Publishing Italia</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              La community degli <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 animate-pulse">scrittori</span>
            </h1>
            
            <p className="text-slate-300 text-xl mb-6 max-w-xl leading-relaxed">
              Migliaia di scrittori italiani si confrontano, imparano e crescono insieme. 
              <span className="text-amber-400 font-semibold"> Condividi le tue esperienze</span> e costruisci il tuo successo editoriale.
            </p>
            
            <p className="text-amber-400 text-2xl font-bold mb-8 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text">
              "Connettiti. Condividi. Cresci."
            </p>
            
            <div className="flex flex-wrap gap-4">
              <a href="https://scrittore.site" target="_blank" className="btn-primary inline-flex items-center gap-2 group hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 group-hover:animate-bounce" />
                Scopri scrittore.site
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link href="/registrati" className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 hover:border-amber-400/50">
                🚀 Inizia ora
              </Link>
            </div>
          </div>
        </section>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden fixed top-4 right-4 z-50 bg-amber-500 text-white p-3 rounded-xl shadow-lg"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Community Tab */}
          {activeTab === "community" && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="card p-6 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquareHeart className="w-5 h-5" />
                  <span className="font-medium">Community Feed</span>
                </div>
                <h2 className="text-2xl font-bold">Cosa vuoi dire?</h2>
                <p className="text-white/80">Condividi con la community i tuoi progressi, dubbi e successi</p>
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-600'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* New Post */}
              <div className="card p-5">
                {!isLoggedIn() ? (
                  <div className="text-center py-4">
                    <p className="text-slate-500 mb-3">Effettua il login per creare un post</p>
                    <a 
                      href="/login"
                      className="inline-block px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                    >
                      Accedi
                    </a>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
                      TU
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && createPost()}
                        placeholder="A cosa stai pensando?"
                        className="input-field mb-2"
                      />
                      {/* Category selector for new post */}
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm mb-2"
                      >
                        {categories.filter(c => c.id !== "all").map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                      <button 
                        onClick={createPost}
                        className="w-full p-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors shrink-0"
                      >
                        Pubblica
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Posts */}
              {visiblePosts.map((post) => (
                <article key={post.id} className="card p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center font-bold text-slate-700">
                      {(post.author?.name || post.author || "U").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Link href={`/utente/${encodeURIComponent(post.author?.name || post.author || "")}`}>
                          <h3 className="font-bold text-slate-800 hover:text-amber-600 cursor-pointer">
                            {post.author?.name || post.author || "Utente"}
                          </h3>
                        </Link>
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                          {post.author?.role || post.role || "Scrittore"}
                        </span>
                        {post.category && (
                          <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full capitalize">
                            {post.category === 'writing' ? 'Scrittura' : post.category === 'marketing' ? 'Marketing' : post.category === 'editing' ? 'Editing' : post.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {post.createdAt ? new Date(post.createdAt).toLocaleString("it-IT") : post.time}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <button 
                          onClick={async () => {
                            const authorName = post.author?.name || post.author || "";
                            if (confirm(`Bannare ${authorName}?`)) {
                              try {
                                await fetch('/api/users/ban', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email: post.author?.email || `${authorName}@test.com` })
                                });
                              } catch (e) {}
                              const updated = allPosts.filter(p => p.id !== post.id);
                              setAllPosts(updated);
                            }
                          }}
                          className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg"
                          title="Banna utente"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button 
                        onClick={async () => {
                          const authorName = post.author?.name || post.author || "";
                          if (!isAdmin && user?.name !== authorName) return alert("Solo l'admin può eliminare post non tuoi");
                          if (!confirm("Eliminare questo post?")) return;
                          try { await fetch(`/api/posts?id=${post.id}`, { method: 'DELETE' }) } catch (e) {}
                          const updated = allPosts.filter(p => p.id !== post.id);
                          setAllPosts(updated);
                        }}
                        className={`p-2 rounded-lg ${isAdmin || user?.name === (post.author?.name || post.author) ? 'text-red-500 hover:bg-red-50' : 'text-slate-300 cursor-not-allowed'}`}
                        title={isAdmin ? "Elimina post" : "Solo admin può eliminare"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-4">{post.content}</p>

                  <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        likedPosts.includes(post.id)
                          ? 'text-red-500 bg-red-50'
                          : 'text-slate-500 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${likedPosts.includes(post.id) ? 'fill-current' : ''}`} />
                      <span>{post.likes + (likedPosts.includes(post.id) ? 1 : 0)}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        expandedComments.includes(post.id)
                          ? 'text-amber-500 bg-amber-50'
                          : 'text-slate-500 hover:text-amber-500 hover:bg-amber-50'
                      }`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{(commentsMap[post.id] || []).length}</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Comments Section */}
                  {expandedComments.includes(post.id) && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="space-y-3 mb-3">
                        {(commentsMap[post.id] || []).map((c) => (
                          <div key={c.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 text-sm font-bold">
                              {c.author.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-800">{c.author}</span>
                                <span className="text-xs text-slate-400">{c.time}</span>
                                {(isAdmin || user?.name === c.author) && (
                                  <button 
                                    onClick={async () => {
                                      if (!confirm("Eliminare questo commento?")) return;
                                      try {
                                        await fetch(`/api/posts-comments?id=${c.id}`, { method: 'DELETE' });
                                      } catch (e) {}
                                      const updated = { ...commentsMap };
                                      updated[post.id] = (updated[post.id] || []).filter(x => x.id !== c.id);
                                      setCommentsMap(updated);
                                    }}
                                    className="p-1 text-red-400 hover:text-red-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">{c.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment[post.id] || ""}
                          onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && addComment(post.id)}
                          placeholder="Scrivi un commento..."
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                        />
                        <button
                          onClick={() => addComment(post.id)}
                          className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* Video Tab */}
          {activeTab === "courses" && (
            <div className="space-y-6">
              <div className="card p-6 bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-5 h-5" />
                      <span className="font-medium">Video</span>
                    </div>
                    <h2 className="text-2xl font-bold">Corsi e Tutorial</h2>
                    <p className="text-white/80">Guarda i video per migliorare le tue skills</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setShowCreateVideo(true)}
                      className="px-4 py-2 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Aggiungi Video
                    </button>
                  )}
                </div>
              </div>

              {/* Create Video Form (Admin) */}
              {showCreateVideo && isAdmin && (
                <div className="card p-6 border-2 border-amber-500">
                  <h3 className="font-bold text-slate-800 mb-4">Aggiungi nuovo video</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                      placeholder="Titolo del video"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="URL YouTube (es: https://www.youtube.com/watch?v=...)"
                      className="input-field"
                    />
                    <textarea
                      value={newVideoDesc}
                      onChange={(e) => setNewVideoDesc(e.target.value)}
                      placeholder="Descrizione (opzionale)"
                      className="input-field min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={createVideo}
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl font-medium"
                      >
                        Aggiungi
                      </button>
                      <button
                        onClick={() => setShowCreateVideo(false)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-medium"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Videos Grid */}
              {videosList.length === 0 ? (
                <div className="card p-12 text-center">
                  <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-600 mb-2">Nessun video ancora</h3>
                  <p className="text-slate-500">L'admin presto aggiungerà i primi video</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {videosList.map((video) => (
                    <div key={video.id} className="card overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="aspect-video relative">
                        <iframe
                          src={`https://www.youtube.com/embed/${video.youtubeUrl}`}
                          title={video.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-slate-800 mb-1">{video.title}</h3>
                            {video.description && (
                              <p className="text-sm text-slate-500">{video.description}</p>
                            )}
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => deleteVideo(video.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          

          {/* Events Tab */}
          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="card p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">Eventi</span>
                    </div>
                    <h2 className="text-2xl font-bold">Prossimi Eventi</h2>
                    <p className="text-white/80">Webinar, sfide e challenge</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setShowCreateEvent(true)}
                      className="px-4 py-2 bg-white text-emerald-600 rounded-xl font-medium hover:bg-emerald-50 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Crea Evento
                    </button>
                  )}
                </div>
              </div>

              {/* Create Event Form (Admin) */}
              {showCreateEvent && isAdmin && (
                <div className="card p-6 border-2 border-amber-500">
                  <h3 className="font-bold text-slate-800 mb-4">Crea nuovo evento</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="Titolo evento"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      placeholder="Data (es: 25 Apr)"
                      className="input-field"
                    />
                    <select
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value)}
                      className="input-field"
                    >
                      <option value="webinar">Webinar</option>
                      <option value="challenge">Challenge</option>
                      <option value="course">Corso</option>
                    </select>
                    <input
                      type="url"
                      placeholder="Link Google Meet (es. https://meet.google.com/abc-defg-hij)"
                      value={newEventMeetLink}
                      onChange={(e) => setNewEventMeetLink(e.target.value)}
                      className="input-field"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={createEvent}
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl font-medium"
                      >
                        Crea
                      </button>
                      <button
                        onClick={() => setShowCreateEvent(false)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-medium"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Events List */}
              {eventsList.length === 0 ? (
                <div className="card p-12 text-center">
                  <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-600 mb-2">Nessun evento planned</h3>
                  <p className="text-slate-500">Gli eventi futuri appariranno qui</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventsList.map((event, idx) => (
                    <div key={idx} className="card p-5 flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800">{event.title}</h3>
                        <p className="text-sm text-slate-500">{event.date}</p>
                        {event.meetLink && (
                          <a 
                            href={event.meetLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 transition-colors"
                          >
                            <Video className="w-4 h-4" />
                            Entra in Meet
                          </a>
                        )}
                      </div>
                      <span className="text-xs px-3 py-1 bg-slate-100 text-slate-600 rounded-full capitalize">
                        {event.type}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Letture/PDF list */}
              {activeTab === "letture" && (
                <div className="space-y-6">
                  <div className="card p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5" />
                          <span className="font-medium">Letture</span>
                        </div>
                        <h2 className="text-2xl font-bold">PDF & eBook</h2>
                        <p className="text-white/80">Condividi documenti e letture con la community</p>
                      </div>
                      <button 
                        onClick={() => isLoggedIn() ? setShowCreateLettura(!showCreateLettura) : window.location.href = '/login'}
                        className="px-4 py-2 bg-white text-emerald-600 rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Carica PDF
                      </button>
                    </div>
                  </div>

                  {/* Create Lettura Form */}
                  {showCreateLettura && isLoggedIn() && (
                    <div className="card p-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Carica un nuovo documento</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Titolo</label>
                      <input
                        type="text"
                        value={newLetturaTitle}
                        onChange={(e) => setNewLetturaTitle(e.target.value)}
                        placeholder="Titolo del documento..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Descrizione</label>
                      <textarea
                        value={newLetturaDesc}
                        onChange={(e) => setNewLetturaDesc(e.target.value)}
                        placeholder="Descrizione del documento..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Carica PDF</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewLetturaFile(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      {newLetturaFile && (
                        <p className="text-sm text-emerald-600 mt-2">✅ File caricato!</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          if (newLetturaTitle.trim() && newLetturaFile) {
                            const letturaData = {
                              title: newLetturaTitle,
                              description: newLetturaDesc,
                              dataUrl: newLetturaFile
                            };
                            
                            // Salva nel database
                            fetch('/api/letture', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(letturaData)
                            }).then(res => res.ok ? res.json() : null)
                              .then(savedLettura => {
                                const newLettura = savedLettura || { id: Date.now(), ...letturaData };
                                const updated = [...lettureList, newLettura];
                                setLettureList(updated);
                                localStorage.setItem('letture', JSON.stringify(updated));
                              });
                            
                            setNewLetturaTitle("");
                            setNewLetturaDesc("");
                            setNewLetturaFile(null);
                            setShowCreateLettura(false);
                          }
                        }}
                        disabled={!newLetturaTitle.trim() || !newLetturaFile}
                        className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Pubblica
                      </button>
                      <button 
                        onClick={() => {
                          setShowCreateLettura(false);
                          setNewLetturaTitle("");
                          setNewLetturaDesc("");
                          setNewLetturaFile(null);
                        }}
                        className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Letture List */}
              {lettureList.length === 0 ? (
                <div className="card p-12 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Nessun documento</h3>
                  <p className="text-slate-500">Carica il tuo primo PDF o eBook</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {lettureList.map((lettura) => (
                    <div key={lettura.id} className="card p-6 hover:shadow-xl transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-800 mb-1">{lettura.title}</h3>
                          <p className="text-sm text-slate-500 mb-3">{lettura.description}</p>
                          <button 
                            onClick={() => {
                              const url = lettura.pdfUrl || lettura.dataUrl;
                              if (url) {
                                // For base64 data URLs, create a blob and open it
                                if (url.startsWith('data:')) {
                                  const base64 = url.split(',')[1];
                                  const binaryString = atob(base64);
                                  const bytes = new Uint8Array(binaryString.length);
                                  for (let i = 0; i < binaryString.length; i++) {
                                    bytes[i] = binaryString.charCodeAt(i);
                                  }
                                  const blob = new Blob([bytes], { type: 'application/pdf' });
                                  const blobUrl = URL.createObjectURL(blob);
                                  window.open(blobUrl, '_blank');
                                } else {
                                  window.open(url, '_blank');
                                }
                              }
                            }}
                            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            <Upload className="w-4 h-4" />
                            Leggi PDF
                          </button>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={async () => {
                              await deleteLettura(lettura.id);
                              const updated = lettureList.filter(l => l.id !== lettura.id);
                              setLettureList(updated);
                              localStorage.setItem('letture', JSON.stringify(updated));
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="card p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                  TU
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Il Tuo Profilo</h2>
                <p className="text-slate-500">Membro dal 2024</p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-medium">Scrittore Attivo</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="card p-5 text-center">
                  <div className="text-2xl font-bold text-amber-600">3</div>
                  <p className="text-sm text-slate-500">Libri</p>
                </div>
                <div className="card p-5 text-center">
                  <div className="text-2xl font-bold text-amber-600">1.2k</div>
                  <p className="text-sm text-slate-500">Vendite</p>
                </div>
                <div className="card p-5 text-center">
                  <div className="text-2xl font-bold text-amber-600">#42</div>
                  <p className="text-sm text-slate-500">Rank</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}