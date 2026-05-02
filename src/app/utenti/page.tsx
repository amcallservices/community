"use client";
import { useState, useEffect } from "react";
import { Users, Trash2 } from "lucide-react";

type User = { id: number; nome: string; cognome: string; email: string; role: string };

export default function UtentiPage() {
  const [utenti, setUtenti] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkDone, setCheckDone] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      window.location.href = '/login';
      return;
    }
    
    const u = JSON.parse(stored);
    
    // Directly check role from localStorage (set during login)
    setIsAdmin(u.email === 'admin@scrittore.site' || u.role === 'admin');
    setCheckDone(true);
    
    fetch("/api/utenti")
      .then(res => res.json())
      .then(data => {
        setUtenti(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const deleteUsers = async (ids: number[]) => {
    if (!confirm(`Eliminare ${ids.length} utente/i?`)) return;
    try {
      await fetch(`/api/utenti?ids=${ids.join(',')}`, { method: 'DELETE' });
      setUtenti(prev => prev.filter(u => !ids.includes(u.id)));
    } catch (e) { console.error(e); }
  };

  if (!checkDone) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Verifica accesso...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-2">Accesso negato</p>
          <p className="text-slate-400">Solo gli admin possono visualizzare questa pagina</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-bold text-white">Utenti Registrati</h1>
          </div>
          {utenti.length > 0 && (
            <button onClick={() => deleteUsers(utenti.map(u => u.id))} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Elimina tutti
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-slate-400">Caricamento...</p>
        ) : utenti.length === 0 ? (
          <div className="bg-white/10 rounded-2xl p-8 text-center border border-white/10">
            <p className="text-slate-400">Nessun utente registrato</p>
          </div>
        ) : (
          <div className="bg-white/10 rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left px-6 py-3 text-slate-300 font-medium">ID</th>
                  <th className="text-left px-6 py-3 text-slate-300 font-medium">Nome</th>
                  <th className="text-left px-6 py-3 text-slate-300 font-medium">Cognome</th>
                  <th className="text-left px-6 py-3 text-slate-300 font-medium">Email</th>
                  <th className="text-left px-6 py-3 text-slate-300 font-medium">Ruolo</th>
                  <th className="text-left px-6 py-3 text-slate-300 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {utenti.map((u, i) => (
                  <tr key={u.id} className={i % 2 === 0 ? "bg-slate-800/50" : "bg-slate-800/30"}>
                    <td className="px-6 py-3 text-slate-400">{u.id}</td>
                    <td className="px-6 py-3 text-white">{u.nome || "-"}</td>
                    <td className="px-6 py-3 text-white">{u.cognome || "-"}</td>
                    <td className="px-6 py-3 text-slate-300">{u.email}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button onClick={() => deleteUsers([u.id])} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-slate-500 text-sm mt-4">Totale: {utenti.length} utenti</p>
      </main>
    </div>
  );
}