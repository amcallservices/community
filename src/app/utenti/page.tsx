"use client";
import { useState, useEffect } from "react";
import { Users, Trash2 } from "lucide-react";

type User = { id: number; nome: string; cognome: string; email: string; role: string; banned?: boolean; suspendedUntil?: string | null };

export default function UtentiPage() {
  const moderate = async (u: User, what: "s24" | "s48" | "s0" | "block" | "unblock") => {
    if (what === "block" && !confirm(`Bloccare ${u.nome} ${u.cognome}? Non potr\u00e0 pi\u00f9 accedere.`)) return;
    const r = what.startsWith("s")
      ? await fetch("/api/users/suspend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id, hours: Number(what.slice(1)) }) })
      : await fetch("/api/users/ban", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id, banned: what === "block" }) });
    if (!r.ok) { const d = await r.json().catch(() => ({})); alert(d.error || "Errore"); return; }
    const d = await (await fetch("/api/utenti")).json();
    if (Array.isArray(d)) setUtenti(d);
  };
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
    setIsAdmin(u.role === 'admin');
    setCheckDone(true);
    
    fetch("/api/utenti")
      .then(res => res.json())
      .then(data => {
        setUtenti(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const resetLink = async (u: any) => {
    const res = await fetch("/api/admin/reset-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data.error || "Errore");
    try { await navigator.clipboard.writeText(data.link); } catch {}
    prompt(`Link di recupero per ${u.email} (valido ${data.validFor}). Copialo e mandaglielo:`, data.link);
  };

  const deleteUsers = async (ids: number[]) => {
    if (!confirm(`Eliminare ${ids.length} utente/i?`)) return;
    try {
      await fetch(`/api/utenti?ids=${ids.join(',')}`, { method: 'DELETE' });
      setUtenti(prev => prev.filter(u => !ids.includes(u.id)));
    } catch (e) { console.error(e); }
  };

  if (!checkDone) {
    return (
      <div className="min-h-screen bg-white rounded-2xl shadow-sm flex items-center justify-center">
        <p className="text-navy/60">Verifica accesso...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white rounded-2xl shadow-sm flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-2">Accesso negato</p>
          <p className="text-navy/60">Solo gli admin possono visualizzare questa pagina</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white rounded-2xl shadow-sm">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-golddark" />
            <h1 className="text-3xl font-bold text-navy">Utenti Registrati</h1>
          </div>
          {utenti.length > 0 && (
            <button onClick={() => deleteUsers(utenti.map(u => u.id))} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Elimina tutti
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-navy/60">Caricamento...</p>
        ) : utenti.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-line">
            <p className="text-navy/60">Nessun utente registrato</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-line overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full">
              <thead className="bg-white rounded-2xl shadow-sm">
                <tr>
                  <th className="text-left px-6 py-3 text-navy/80 font-medium">ID</th>
                  <th className="text-left px-6 py-3 text-navy/80 font-medium">Nome</th>
                  <th className="text-left px-6 py-3 text-navy/80 font-medium">Cognome</th>
                  <th className="text-left px-6 py-3 text-navy/80 font-medium">Email</th>
                  <th className="text-left px-6 py-3 text-navy/80 font-medium">Ruolo</th>
                  <th className="text-left px-6 py-3 text-navy/80 font-medium">Stato</th>
                  <th className="text-left px-6 py-3 text-navy/80 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {utenti.map((u, i) => (
                  <tr key={u.id} className={i % 2 === 0 ? "bg-white rounded-2xl shadow-sm" : "bg-ivory2/40"}>
                    <td className="px-6 py-3 text-navy/60">{u.id}</td>
                    <td className="px-6 py-3 text-navy">{u.nome || "-"}</td>
                    <td className="px-6 py-3 text-navy">{u.cognome || "-"}</td>
                    <td className="px-6 py-3 text-navy/80">{u.email}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-gold/25 text-golddark' : 'bg-ivory2 text-navy/80'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {u.banned ? <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-semibold">Bloccato</span>
                        : u.suspendedUntil && new Date(u.suspendedUntil) > new Date() ? <span className="px-2 py-1 rounded bg-brass/40 font-semibold">Sospeso fino a {new Date(u.suspendedUntil).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        : <span className="text-navy/50">Attivo</span>}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {u.role !== "admin" && (u.banned
                        ? <button onClick={() => moderate(u, "unblock")} className="text-xs mr-3 underline text-navy hover:text-wine">Sblocca</button>
                        : <>
                            {u.suspendedUntil && new Date(u.suspendedUntil) > new Date()
                              ? <button onClick={() => moderate(u, "s0")} className="text-xs mr-3 underline text-navy hover:text-wine">Revoca sospensione</button>
                              : <><button onClick={() => moderate(u, "s24")} className="text-xs mr-3 underline text-navy hover:text-wine">Sospendi 24h</button><button onClick={() => moderate(u, "s48")} className="text-xs mr-3 underline text-navy hover:text-wine">48h</button></>}
                            <button onClick={() => moderate(u, "block")} className="text-xs mr-3 underline text-red-600 hover:text-red-800">Blocca</button>
                          </>)}
                      <button onClick={() => resetLink(u)} className="text-golddark hover:text-navy text-xs mr-3 underline">Link recupero</button>
                      <button onClick={() => deleteUsers([u.id])} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}

        <p className="text-navy/60 text-sm mt-4">Totale: {utenti.length} utenti</p>
      </main>
    </div>
  );
}