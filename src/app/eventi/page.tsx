"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PenLine, User, Video, Calendar, BookOpen, Menu, Plus, Trash2, LogIn, LogOut, UserPlus, CalendarDays, MapPin, ExternalLink } from "lucide-react";

export default function Page() {
  const [events, setEvents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [link, setLink] = useState("");
  const [desc, setDesc] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const res = await fetch("/api/events?_=" + Date.now());
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  };

  const saveEvent = async () => {
    if (!title || !date || !time) return;
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, time, meetLink: link, description: desc })
    });
    if (res.ok) { alert("Evento aggiunto!"); setTitle(""); setDate(""); setTime(""); setLink(""); setDesc(""); setShowForm(false); loadEvents(); }
  };

  const deleteEvent = async (id: number) => {
    if (!confirm("Eliminare questo evento?")) return;
    const res = await fetch("/api/events?id=" + id, { method: "DELETE" });
    if (res.ok) loadEvents();
  };

  return (
    <div className="min-h-screen bg-ivory">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-navy">Eventi</h1>
          {isAdmin && <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-gold rounded-lg font-semibold text-navy hover:brightness-95 flex items-center gap-2"><Plus className="w-4 h-4" /> Aggiungi Evento</button>}
        </div>
        
        {!isAdmin && user && <p className="text-sm text-navy/60 mb-4">Solo l'admin puo aggiungere eventi</p>}
        {!isAdmin && !user && <p className="text-sm text-navy/60 mb-4"><Link href="/login" className="text-golddark">Accedi</Link> come admin per aggiungere eventi</p>}
        
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-line">
            <h3 className="font-bold text-navy mb-4">Nuovo Evento</h3>
            <input type="text" placeholder="Titolo" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40 mb-3" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-3 bg-ivory2 border border-line text-navy" />
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="p-3 bg-ivory2 border border-line text-navy" />
            </div>
            <input type="text" placeholder="Link Google Meet" value={link} onChange={e => setLink(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40 mb-3" />
            <textarea placeholder="Descrizione" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40 mb-3" />
            <div className="flex gap-2">
              <button onClick={saveEvent} disabled={!title || !date || !time} className="px-4 py-2 bg-gold rounded-lg font-semibold text-navy disabled:opacity-50">Salva</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-white rounded-2xl shadow-sm text-navy">Annulla</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-navy/60">Nessun evento programmato</div>
        ) : (
          <div className="grid gap-4">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-2xl shadow-sm p-5 border border-line">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-gold rounded-lg font-semibold flex flex-col items-center justify-center text-navy">
                      <span className="text-xs font-medium">{new Date(event.date.replace(' ', 'T')).toLocaleDateString("it-IT", { month: "short" })}</span>
                      <span className="text-xl font-bold">{new Date(event.date).getDate()}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-navy text-lg">{event.title}</h3>
                      <div className="flex items-center gap-2 text-navy/60 text-sm mt-1">
                        <CalendarDays className="w-4 h-4" />{new Date(event.date.replace(' ', 'T')).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} • Ore {new Date(event.date.replace(' ', 'T')).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {event.meetLink && (
                        <a href={event.meetLink} target="_blank" className="inline-flex items-center gap-1 text-golddark text-sm mt-2 hover:underline">
                          <ExternalLink className="w-3 h-3" /> Google Meet
                        </a>
                      )}
                      <p className="text-navy/60 text-sm mt-2">{event.description}</p>
                    </div>
                  </div>
                  {isAdmin && <button onClick={() => deleteEvent(event.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
