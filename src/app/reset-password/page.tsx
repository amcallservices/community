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
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 border border-line">
      <h1 className="text-2xl font-bold text-navy text-center mb-6">Nuova password</h1>
      {done ? (
        <div className="text-center">
          <p className="text-navy/80 mb-4">Password aggiornata! Ora puoi accedere.</p>
          <Link href="/login" className="inline-block px-6 py-3 bg-gold rounded-lg font-semibold text-navy font-semibold">Vai al login</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="bg-red-500/20 text-red-400 p-3 text-center">{error}</div>}
          <input type="password" required minLength={8} placeholder="Nuova password (min. 8 caratteri)" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40" />
          <input type="password" required minLength={8} placeholder="Ripeti la password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40" />
          <button disabled={loading || !token} className="w-full py-3 bg-gold rounded-lg font-semibold text-navy font-semibold disabled:opacity-50">{loading ? "Salvataggio..." : "Salva password"}</button>
        </form>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-ivory flex items-center justify-center p-4">
      <Suspense fallback={null}><ResetForm /></Suspense>
    </div>
  );
}
