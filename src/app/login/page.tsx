"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenLine, LogIn, LogOut, UserPlus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('user', JSON.stringify(user));
        
        // Force reload to update Navbar
        window.location.href = '/';
      } else {
        const d = await res.json().catch(() => ({})); setError(d.error || 'Credenziali non valide');
      }
    } catch { setError('Errore di connessione'); }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 bg-gold rounded-lg font-semibold flex items-center justify-center"><PenLine className="w-6 h-6 text-navy" /></div>
          <span className="text-navy font-bold text-2xl">Self Publishing<span className="text-golddark">Italia</span></span>
        </Link>
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-line">
          <h1 className="text-2xl font-bold text-navy text-center mb-6">Accedi</h1>
          {error && <div className="bg-red-500/20 text-red-400 p-3 mb-4 text-center">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40" required />
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-gold rounded-lg font-semibold text-navy font-semibold disabled:opacity-50">
              {isLoading ? "Accesso..." : "Accedi"}
            </button>
          </form>
          <p className="text-center text-navy/60 mt-4"><Link href="/recupera-password" className="text-golddark hover:underline">Password dimenticata?</Link></p>
          <p className="text-center text-navy/60 mt-2">Non hai un account? <Link href="/registrati" className="text-golddark hover:underline">Registrati gratis</Link></p>
        </div>
        <Link href="/" className="block text-center text-navy/60 mt-4 hover:text-navy">Torna alla Home</Link>
      </div>
    </div>
  );
}
