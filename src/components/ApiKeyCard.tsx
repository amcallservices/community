"use client";
import { useEffect, useState } from "react";
import { Copy, KeyRound } from "lucide-react";

// Chiave personale per pubblicare sulla community da BOOST AI a proprio nome.
export default function ApiKeyCard() {
  const [active, setActive] = useState<boolean | null>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { fetch("/api/external/token").then(r => r.json()).then(d => setActive(!!d.active)).catch(() => setActive(false)); }, []);

  async function create() {
    if (active && !confirm("Creando una nuova chiave quella vecchia smette di funzionare. Continuare?")) return;
    setBusy(true); setMsg("");
    const r = await fetch("/api/external/token", { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok && d.token) { setToken(d.token); setActive(true); } else setMsg(d.error || "Non sono riuscito a creare la chiave");
  }
  async function revoke() {
    if (!confirm("Revocare la chiave? BOOST AI non potrà più pubblicare per te.")) return;
    setBusy(true);
    await fetch("/api/external/token", { method: "DELETE" });
    setBusy(false); setToken(""); setActive(false);
  }

  return (
    <section className="mt-4 bg-white rounded-3xl border border-line p-5 md:p-6">
      <h2 className="font-extrabold text-lg flex items-center gap-2"><KeyRound className="w-5 h-5 text-wine" />Collega BOOST AI</h2>
      <p className="mt-2 text-sm text-navy/70">Crea una chiave personale e incollala in BOOST AI (Collegamenti → Community): i post, le foto e i video che programmi lì usciranno qui a tuo nome.</p>
      {msg && <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm" role="alert">{msg}</div>}
      {token && (
        <div className="mt-3 p-3 rounded-xl bg-ivory2 text-sm break-all flex items-start gap-2">
          <span className="flex-1 font-mono">{token}</span>
          <button onClick={() => navigator.clipboard.writeText(token)} aria-label="Copia la chiave" className="p-1.5 rounded-lg hover:bg-white"><Copy className="w-4 h-4" /></button>
        </div>
      )}
      {token && <p className="mt-2 text-xs text-navy/60">Copiala adesso: per sicurezza non potrai rivederla.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={create} disabled={busy || active === null} className="px-4 py-2.5 rounded-xl bg-wine text-white font-semibold disabled:opacity-60">{active ? "Crea una nuova chiave" : "Crea la chiave"}</button>
        {active && <button onClick={revoke} disabled={busy} className="px-4 py-2.5 rounded-xl bg-red-50 text-red-700 font-semibold hover:bg-red-100 disabled:opacity-60">Revoca</button>}
      </div>
    </section>
  );
}
