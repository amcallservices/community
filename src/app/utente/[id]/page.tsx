"use client";
import { useState, useEffect, use } from "react";
import { Mail, BookOpen, MessageCircle, Calendar, Send, Lock, Eye, EyeOff } from "lucide-react";

export default function UtentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [utente, setUtente] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("ID utente non valido");
      setLoading(false);
      return;
    }
    
    fetch(`/api/users/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Utente non trovato");
        return res.json();
      })
      .then(data => {
        setUtente(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Utente non trovato");
        setLoading(false);
      });
    
    const stored = localStorage.getItem("user");
    if (stored) setCurrentUser(JSON.parse(stored));
  }, [id]);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser || !utente) return;
    setSending(true);
    
    try {
      const res = await fetch("/api/messaggi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: utente.id,
          content: message
        })
      });
      
      if (res.ok) {
        setSent(true);
        setMessage("");
        setShowMessageForm(false);
        setTimeout(() => setSent(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
    
    setSending(false);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Compila tutti i campi");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Le nuove password non corrispondono");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("La password deve avere almeno 6 caratteri");
      return;
    }
    
    try {
      const res = await fetch(`/api/users/${utente.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(data.error || "Errore");
      }
    } catch (e) {
      setPasswordError("Errore di connessione");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-white">Caricamento...</div>
    </div>
  );

  if (error || !utente) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-red-400 text-center">
        <p>{error || "Utente non trovato"}</p>
        <a href="/community" className="text-amber-400 hover:underline mt-4 block">Torna alla Community</a>
      </div>
    </div>
  );

  const isOwnProfile = currentUser && utente && currentUser.id === utente.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
          
          {passwordSuccess && (
            <div className="bg-green-500/20 text-green-400 p-3 rounded-xl mb-4">
              ✓ Password cambiata con successo!
            </div>
          )}
          
          <div className="mb-6">
            {utente.avatar ? (
              <img src={utente.avatar} alt={utente.nome} className="w-32 h-32 rounded-full object-cover border-4 border-amber-500 mx-auto" />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-5xl mx-auto border-4 border-amber-500">
                {(utente.nome || utente.name)?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            {utente.nome} {utente.cognome}
          </h1>
          
          <p className="text-amber-400 mb-6 capitalize text-lg">{utente.role || "scrittore"}</p>

          {currentUser && !isOwnProfile && (
            <div className="mb-6">
              {!showMessageForm ? (
                <button onClick={() => setShowMessageForm(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-medium transition-all">
                  <Send className="w-5 h-5" />Invia Messaggio
                </button>
              ) : (
                <div className="bg-white/5 rounded-xl p-4 mt-2 text-left">
                  {sent && <div className="bg-green-500/20 text-green-400 p-3 rounded-xl mb-3">✓ Messaggio inviato!</div>}
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi il tuo messaggio..." className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none" rows={4} />
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleSendMessage} disabled={sending || !message.trim()} className="flex-1 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />{sending ? "Invio..." : "Invia"}
                    </button>
                    <button onClick={() => { setShowMessageForm(false); setMessage(""); }} className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20">Annulla</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isOwnProfile && (
            <div className="mb-6">
              {!showPasswordForm ? (
                <button onClick={() => setShowPasswordForm(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/80 text-white rounded-xl hover:bg-red-600 font-medium transition-all">
                  <Lock className="w-5 h-5" />Cambia Password
                </button>
              ) : (
                <div className="bg-white/5 rounded-xl p-4 mt-2 text-left">
                  {passwordError && <div className="bg-red-500/20 text-red-400 p-3 rounded-xl mb-3">{passwordError}</div>}
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <input type={showCurrentPwd ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Password attuale" className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-10" />
                      <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{showCurrentPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                    </div>
                    
                    <div className="relative">
                      <input type={showNewPwd ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nuova password" className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-10" />
                      <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{showNewPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                    </div>
                    
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Conferma nuova password" className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button onClick={handleChangePassword} className="flex-1 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" />Salva Password
                    </button>
                    <button onClick={() => { setShowPasswordForm(false); setPasswordError(""); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20">Annulla</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-white/10">
            <div className="text-center"><BookOpen className="w-6 h-6 text-amber-400 mx-auto mb-1" /><div className="text-xl font-bold text-white">0</div><div className="text-slate-400 text-sm">Post</div></div>
            <div className="text-center"><MessageCircle className="w-6 h-6 text-amber-400 mx-auto mb-1" /><div className="text-xl font-bold text-white">0</div><div className="text-slate-400 text-sm">Commenti</div></div>
            <div className="text-center"><Calendar className="w-6 h-6 text-amber-400 mx-auto mb-1" /><div className="text-xl font-bold text-white">{utente.createdAt ? new Date(utente.createdAt).toLocaleDateString('it-IT', { year: 'numeric', month: 'short' }) : '-'}</div><div className="text-slate-400 text-sm">Iscritto</div></div>
          </div>

          {utente.bio ? (
            <div className="mt-6 text-left">
              <h3 className="text-slate-400 mb-2">Descrizione</h3>
              <p className="text-slate-300 bg-white/5 rounded-xl p-4">{utente.bio}</p>
            </div>
          ) : (
            <p className="text-slate-500 italic mt-6">Nessuna descrizione</p>
          )}

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 text-slate-300 justify-center">
              <Mail className="w-5 h-5 text-slate-500" />
              <span>{utente.email}</span>
            </div>
          </div>
        </div>

        <a href="/community" className="block text-center text-amber-400 hover:text-amber-300 mt-6">← Torna alla Community</a>
      </main>
    </div>
  );
}
