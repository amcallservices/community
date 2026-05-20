"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" /> La community degli scrittori italiani
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Connettiti. Condividi. Cresci.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto">Migliaia di scrittori italiani si confrontano, imparano e crescono insieme.</p>
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <a href="https://scrittore.site" target="_blank" className="px-12 py-6 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-bold text-2xl hover:opacity-90 transition-all shadow-2xl shadow-red-600/40">
              Acquista il nostro programma per scrivere Ebook -&gt; Scrittore.site
            </a>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/50" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/A53E5DZ00sU"
              title="Video Self Publishing Italia"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">© 2026 Self Publishing Italia. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
