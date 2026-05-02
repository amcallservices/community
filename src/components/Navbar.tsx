"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PenLine, LogOut, LogIn, UserPlus } from "lucide-react";

type UserData = { id: number; nome: string; cognome: string; email: string; role?: string };

export default function Navbar() {
  const [user, setUser] = useState<UserData | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
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
      // Check role - also check localStorage for role after login
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setIsAdmin(parsed.role === 'admin');
      }
    }
  }, []);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!user) return;
    
    const checkMessages = async () => {
      try {
        const res = await fetch(`/api/messages?userId=${user.id}`);
        if (res.ok) {
          const messages = await res.json();
          const unread = messages.filter((m: any) => !m.read && m.receiverId === user.id).length;
          setUnreadCount(unread);
        }
      } catch (e) { console.error(e); }
    };

    checkMessages();
    const interval = setInterval(checkMessages, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    
    setUser(null);
    setIsAdmin(false);
    router.push('/');
  };

  return (
    <nav className="bg-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <PenLine className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-amber-400 hidden sm:block">Self Publishing Italia</span>
          </Link>
          
          <div className="flex items-center gap-3 md:gap-5">
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