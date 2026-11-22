"use client";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

type Step = { target?: string; title: string; text: string };

const STEPS: Step[] = [
  { title: "Benvenuto in Self Publishing Italia!", text: "Ti mostro in 1 minuto cosa puoi fare qui. Puoi uscire quando vuoi." },
  { target: "stories", title: "Le storie", text: "Pubblica foto e video che restano visibili per 24 ore. Tocca il + per aggiungere la tua." },
  { target: "composer", title: "Scrivi un post", text: "Racconta a cosa stai lavorando, chiedi un consiglio o condividi una novità sui tuoi libri." },
  { target: "allegati", title: "Allega quello che vuoi", text: "Foto, video, PDF, link, sondaggi ed emoji: scegli la categoria e poi premi Pubblica." },
  { target: "filtri", title: "Cerca e filtra", text: "Trova i post per parola, per categoria o solo quelli con foto e PDF. Con \"I miei\" rivedi i tuoi." },
  { target: "nav-/eventi", title: "Eventi", text: "Dirette, incontri e workshop con data e ora: iscriviti per non perderli." },
  { target: "nav-/consulenza", title: "Consulenze", text: "Prenota una videochiamata con un esperto per il tuo libro e paga online in sicurezza." },
  { target: "nav-/messaggi", title: "Messaggi", text: "Scrivi in privato agli altri autori della community." },
  { target: "campanella", title: "Notifiche", text: "Qui trovi risposte, menzioni e novità. Ti arriva anche una email." },
  { title: "Tutto pronto!", text: "Presentati con il tuo primo post. Puoi rivedere questa visita quando vuoi da \"Visita guidata\" nel menu a sinistra." },
];

const KEY = "spi_tour_v1";

function findVisible(name: string): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return els.find(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }) || null;
}

export default function GuidedTour({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const start = useCallback(() => {
    setSteps(STEPS.filter(s => !s.target || findVisible(s.target)));
    setI(0);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setOpen(false);
  }, []);

  useEffect(() => {
    const h = () => start();
    window.addEventListener("spi-tour", h);
    return () => window.removeEventListener("spi-tour", h);
  }, [start]);

  useEffect(() => {
    if (!enabled) return;
    let done = false;
    try { done = localStorage.getItem(KEY) === "1"; } catch {}
    if (done) return;
    const t = setTimeout(start, 1500);
    return () => clearTimeout(t);
  }, [enabled, start]);

  const step = steps[i];

  const measure = useCallback(() => {
    if (!open || !step) return;
    if (!step.target) { setRect(null); return; }
    const el = findVisible(step.target);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [open, step]);

  useLayoutEffect(() => {
    if (!open || !step) return;
    if (step.target) {
      const el = findVisible(step.target);
      el?.scrollIntoView({ block: "center", behavior: "auto" });
    }
    measure();
    const t = setTimeout(measure, 120);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [open, step, measure]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setI(n => Math.min(n + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setI(n => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, steps.length, close]);

  if (!open || !step) return null;

  const last = i === steps.length - 1;
  const W = typeof window !== "undefined" ? window.innerWidth : 360;
  const H = typeof window !== "undefined" ? window.innerHeight : 640;
  const cw = Math.min(340, W - 24);
  let top = H / 2 - 90, left = (W - cw) / 2;
  if (rect) {
    const below = rect.bottom + 14;
    top = below + 190 < H ? below : Math.max(12, rect.top - 14 - 190);
    left = Math.min(Math.max(12, rect.left + rect.width / 2 - cw / 2), W - cw - 12);
  }

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Visita guidata">
      {rect ? (
        <div className="absolute rounded-xl pointer-events-none transition-all duration-200"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12, boxShadow: "0 0 0 9999px rgba(27,20,100,.62)", outline: "3px solid #ffc83d" }} />
      ) : <div className="absolute inset-0 bg-navy/60" />}
      <div className="absolute inset-0" onClick={close} />
      <div className="absolute bg-white rounded-2xl shadow-2xl p-4 border border-line" style={{ top, left, width: cw }}>
        <div className="text-[11px] font-bold text-wine mb-1">{i + 1} di {steps.length}</div>
        <h3 className="font-bold text-navy text-base leading-snug">{step.title}</h3>
        <p className="text-sm text-navy/80 mt-1 leading-relaxed">{step.text}</p>
        <div className="flex items-center justify-between mt-3 gap-2">
          <button onClick={close} className="text-xs text-navy/60 hover:underline">{last ? "" : "Salta"}</button>
          <div className="flex gap-2">
            {i > 0 && <button onClick={() => setI(i - 1)} className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-line hover:bg-ivory2">Indietro</button>}
            <button onClick={() => (last ? close() : setI(i + 1))} className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-wine text-white hover:brightness-110">{last ? "Fine" : "Avanti"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
