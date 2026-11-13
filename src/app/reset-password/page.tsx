"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Le password non coincidono");
    setLoading(true);
    const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setDone(true); else setError(data.error || "Errore");
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <h1 className="text-2xl font-bold text-white text-center mb-6">Nuova password</h1>
      {done ? (
        <div className="text-center">
          <p className="text-slate-300 mb-4">Password aggiornata! Ora puoi accedere.</p>
          <Link href="/login" className="inline-block px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold">Vai al login</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-xl text-center">{error}</div>}
          <input type="password" required minLength={8} placeholder="Nuova password (min. 8 caratteri)" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500" />
          <input type="password" required minLength={8} placeholder="Ripeti la password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500" />
          <button disabled={loading || !token} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold disabled:opacity-50">{loading ? "Salvataggio..." : "Salva password"}</button>
        </form>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Suspense fallback={null}><ResetForm /></Suspense>
    </div>
  );
}
