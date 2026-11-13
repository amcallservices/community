"use client";
import { useState } from "react";
import Link from "next/link";

export default function RecuperaPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => {});
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-ivory flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 border border-line">
        <h1 className="text-2xl font-bold text-navy text-center mb-2">Recupera password</h1>
        {sent ? (
          <p className="text-navy/80 text-center my-6">Se l&apos;email è registrata, riceverai un link per scegliere una nuova password (controlla anche lo spam). Il link vale 1 ora.</p>
        ) : (
          <>
            <p className="text-navy/60 text-center mb-6 text-sm">Inserisci l&apos;email con cui ti sei registrato.</p>
            <form onSubmit={submit} className="space-y-4">
              <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40" />
              <button disabled={loading} className="w-full py-3 bg-wine text-white rounded-lg font-semibold font-semibold disabled:opacity-50">{loading ? "Invio..." : "Invia link"}</button>
            </form>
          </>
        )}
        <Link href="/login" className="block text-center text-golddark mt-4 hover:underline">Torna al login</Link>
      </div>
    </div>
  );
}
