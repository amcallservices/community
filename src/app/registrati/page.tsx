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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cognome, email, password })
      });
      if (res.ok) {
        setError('');
        alert('Registrazione completata! Ora puoi effettuare il login.');
        router.push('/login');
      } else {
        const d = await res.json().catch(() => ({})); setError(d.error || 'Registrazione fallita');
      }
    } catch { setError('Errore di connessione'); }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 bg-brass flex items-center justify-center"><PenLine className="w-6 h-6 text-paper" /></div>
          <span className="text-paper font-bold text-2xl">Self Publishing<span className="text-brass">Italia</span></span>
        </Link>
        <div className="bg-card p-6 border border-card2">
          <h1 className="text-2xl font-bold text-paper text-center mb-6">Registrati</h1>
          {error && <div className="bg-red-500/20 text-red-400 p-3 mb-4 text-center">{error}</div>}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} className="p-3 bg-card2 border border-card2 text-paper placeholder-surface/50" required />
              <input type="text" placeholder="Cognome" value={cognome} onChange={e => setCognome(e.target.value)} className="p-3 bg-card2 border border-card2 text-paper placeholder-surface/50" required />
            </div>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-card2 border border-card2 text-paper placeholder-surface/50" required />
            <input type="password" minLength={8} placeholder="Password (min. 8 caratteri)" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-card2 border border-card2 text-paper placeholder-surface/50" required />
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-brass text-ink font-semibold disabled:opacity-50">
              {isLoading ? "Registrazione..." : "Registrati"}
            </button>
          </form>
          <p className="text-center text-surface/80 mt-4">Hai gia un account? <Link href="/login" className="text-brass hover:underline">Accedi</Link></p>
        </div>
        <Link href="/" className="block text-center text-surface/80 mt-4 hover:text-paper">Torna alla Home</Link>
      </div>
    </div>
  );
}
