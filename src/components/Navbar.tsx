"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PenLine, LogOut, LogIn, UserPlus, Menu, X } from "lucide-react";

type UserData = { id: number; nome: string; cognome: string; email: string; role?: string };

export default function Navbar() {
  const [user, setUser] = useState<UserData | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setIsAdmin(u.role === 'admin');
    }
  }, []);

  // Controlla i messaggi non letti: solo il conteggio, ogni 30s e solo con la scheda visibile
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/messages?count=1");
        if (res.ok) setUnreadCount((await res.json()).unread || 0);
        else if (res.status === 401) { localStorage.removeItem("user"); setUser(null); setIsAdmin(false); }
      } catch {}
    };
    check();
    const interval = setInterval(check, 30000);
    document.addEventListener("visibilitychange", check);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", check); };
  }, [user]);

  useEffect(() => { setOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("user");
    setUser(null);
    setIsAdmin(false);
    window.location.href = "/";
  };

  return (
    <nav className="bg-slate-800 text-white sticky top-0 z-50 relative">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <PenLine className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-amber-400 hidden sm:block">Self Publishing Italia</span>
          </Link>
          
          <button className="md:hidden p-2" aria-label="Menu" onClick={() => setOpen(o => !o)}>{open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          <div className={`${open ? "flex" : "hidden"} md:flex absolute md:static top-14 left-0 right-0 z-40 bg-slate-800 md:bg-transparent flex-col md:flex-row items-start md:items-center gap-4 md:gap-5 p-4 md:p-0 border-b border-white/10 md:border-0`}>
            <Link href="/community" className={`hover:text-amber-400 text-sm ${pathname === '/community' ? 'text-amber-400' : ''}`}>Community</Link>
            <Link href="/video" className={`hover:text-amber-400 text-sm ${pathname === '/video' ? 'text-amber-400' : ''}`}>Video</Link>
            <Link href="/eventi" className={`hover:text-amber-400 text-sm ${pathname === '/eventi' ? 'text-amber-400' : ''}`}>Eventi</Link>
            <Link href="/letture" className={`hover:text-amber-400 text-sm ${pathname === '/letture' ? 'text-amber-400' : ''}`}>Letture</Link>
            <Link href="/messaggi" className={`hover:text-amber-400 flex items-center gap-1 text-sm ${pathname === '/messaggi' ? 'text-amber-400' : ''}`}>
              Messaggi
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>
              )}
            </Link>
            {isAdmin && <Link href="/utenti" className={`hover:text-amber-400 text-sm ${pathname === '/utenti' ? 'text-amber-400' : ''}`}>Utenti</Link>}
            <Link href="/profilo" className={`hover:text-amber-400 text-sm ${pathname === '/profilo' ? 'text-amber-400' : ''}`}>Profilo</Link>
            
            {!user ? (
              <>
                <Link href="/login" className="flex items-center gap-1 text-sm bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700"><LogIn className="w-4 h-4" />Login</Link>
                <Link href="/registrati" className="flex items-center gap-1 text-sm bg-amber-500 px-3 py-1.5 rounded-lg hover:bg-amber-600"><UserPlus className="w-4 h-4" />Registrati</Link>
              </>
            ) : (
              <button onClick={handleLogout} className="flex items-center gap-1 text-sm bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700"><LogOut className="w-4 h-4" />Logout</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}