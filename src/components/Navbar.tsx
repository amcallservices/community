"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LogIn, UserPlus, Menu, X } from "lucide-react";

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

  const link = (href: string, label: string, extra?: React.ReactNode) => (
    <Link href={href} className={`text-[15px] hover:text-brass flex items-center gap-1 ${pathname === href ? "text-brass font-semibold" : "text-paper"}`}>
      {label}{extra}
    </Link>
  );

  return (
    <nav className="bg-ink text-paper sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3" aria-label="Self Publishing Italia">
            <span className="w-10 h-10 bg-brass text-ink grid place-items-center italic font-semibold text-xl">S</span>
            <span className="font-semibold hidden sm:block">Self Publishing Italia</span>
          </Link>

          <button className="md:hidden p-2" aria-label="Menu" onClick={() => setOpen(o => !o)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className={`${open ? "flex" : "hidden"} md:flex absolute md:static top-16 left-0 right-0 z-40 bg-ink flex-col md:flex-row items-start md:items-center gap-5 p-6 md:p-0`}>
            {link("/community", "Community")}
            {link("/video", "Video")}
            {link("/eventi", "Eventi")}
            {link("/letture", "Letture")}
            {link("/messaggi", "Messaggi", unreadCount > 0 && <span className="bg-brass text-ink text-xs font-semibold rounded-full w-5 h-5 grid place-items-center">{unreadCount}</span>)}
            {isAdmin && link("/utenti", "Utenti")}
            {link("/profilo", "Profilo")}
            <a href="https://liberamente.site" target="_blank" rel="noopener noreferrer" className="text-[15px] text-paper hover:text-brass">Liberamente</a>
            {!user ? (
              <div className="flex gap-3">
                <Link href="/login" className="flex items-center gap-1 text-[15px] bg-paper text-ink px-4 py-2 rounded-lg font-semibold hover:opacity-90"><LogIn className="w-4 h-4" />Accedi</Link>
                <Link href="/registrati" className="flex items-center gap-1 text-[15px] bg-brass text-ink px-4 py-2 rounded-lg font-semibold hover:opacity-90"><UserPlus className="w-4 h-4" />Registrati</Link>
              </div>
            ) : (
              <button onClick={handleLogout} className="flex items-center gap-1 text-[15px] bg-card text-paper px-4 py-2 rounded-lg font-semibold hover:bg-card2"><LogOut className="w-4 h-4" />Esci</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
