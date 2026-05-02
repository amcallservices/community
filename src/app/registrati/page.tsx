"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenLine, UserPlus } from "lucide-react";

export default function RegistratiPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cognome, email, password })
      });
      if (res.ok) {
        setError('');
        alert('Registrazione completata! Ora puoi effettuare il login.');
        router.push('/login');
      } else {
        setError('Registrazione fallita');
      }
    } catch { setError('Errore di connessione'); }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center"><PenLine className="w-6 h-6 text-white" /></div>
          <span className="text-white font-bold text-2xl">Self Publishing<span className="text-amber-400">Italia</span></span>
        </Link>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h1 className="text-2xl font-bold text-white text-center mb-6">Registrati</h1>
          {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-center">{error}</div>}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500" required />
              <input type="text" placeholder="Cognome" value={cognome} onChange={e => setCognome(e.target.value)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500" required />
            </div>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500" required />
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold disabled:opacity-50">
              {isLoading ? "Registrazione..." : "Registrati"}
            </button>
          </form>
          <p className="text-center text-slate-400 mt-4">Hai gia un account? <Link href="/login" className="text-amber-400 hover:underline">Accedi</Link></p>
        </div>
        <Link href="/" className="block text-center text-slate-500 mt-4 hover:text-white">Torna alla Home</Link>
      </div>
    </div>
  );
}
