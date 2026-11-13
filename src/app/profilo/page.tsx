"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PenLine, LogOut, Award, BookOpen, Camera, Save, X, Lock, Eye, EyeOff } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setNome(u.nome || "");
      setCognome(u.cognome || "");
      setBio(u.bio || "");
      setAvatar(u.avatar || "");
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, nome, cognome, bio, avatar, email: user.email })
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        const newUserData = { ...user, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(newUserData));
        setUser(newUserData);
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
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
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

  const handleLogout = () => {
    // Non rimuoviamo i dati utente da localStorage
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-ivory">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-line">
          {saved && (
            <div className="bg-green-500/20 text-green-400 p-3 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Profilo salvato con successo!
            </div>
          )}
          
          {passwordSuccess && (
            <div className="bg-green-500/20 text-green-400 p-3 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Password cambiata con successo!
            </div>
          )}

          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-gold" />
              ) : (
                <div className="w-24 h-24 bg-gold rounded-lg font-semibold rounded-full flex items-center justify-center text-navy text-4xl font-bold border-4 border-gold">
                  {nome?.[0] || user.nome?.[0] || "?"}
                </div>
              )}
              {editing && (
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-gold rounded-lg font-semibold rounded-full flex items-center justify-center cursor-pointer hover:brightness-95">
                  <Camera className="w-4 h-4 text-navy" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {editing ? (
            <div className="space-y-4 mb-6">
              <input type="text" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40" />
              <input type="text" placeholder="Cognome" value={cognome} onChange={e => setCognome(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40" />
              <textarea placeholder="Bio" value={bio} onChange={e => setBio(e.target.value)} className="w-full p-3 bg-ivory2 border border-line text-navy placeholder-navy/40 h-24" />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-gold rounded-lg font-semibold text-navy flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />{saving ? "Salvataggio..." : "Salva"}
                </button>
                <button onClick={() => setEditing(false)} className="px-4 py-3 bg-white rounded-2xl shadow-sm text-navy"><X className="w-4 h-4" /></button>
              </div>
            </div>
          ) : (
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-navy">{user.nome} {user.cognome}</h1>
              <p className="text-navy/60">{user.email}</p>
              {user.bio && <p className="text-navy/80 mt-2">{user.bio}</p>}
              <span className="inline-block px-3 py-1 bg-gold/25 text-golddark rounded-full text-sm mt-2">{user.role || "scrittore"}</span>
            </div>
          )}

          {!editing && !showPasswordForm && (
            <div className="flex gap-2 mb-6">
              <button onClick={() => setEditing(true)} className="flex-1 py-2 bg-white rounded-2xl shadow-sm text-navy text-sm">Modifica profilo</button>
              <button onClick={() => setShowPasswordForm(true)} className="flex-1 py-2 bg-red-500/80 text-navy text-sm flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />Cambia Password
              </button>
            </div>
          )}

          {showPasswordForm && (
            <div className="bg-ivory2 p-4 mb-6 text-left">
              <h3 className="text-navy font-semibold mb-3">Cambia Password</h3>
              {passwordError && <div className="bg-red-500/20 text-red-400 p-3 mb-3">{passwordError}</div>}
              
              <div className="space-y-3">
                <div className="relative">
                  <input type={showCurrentPwd ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Password attuale" className="w-full p-3 bg-white rounded-2xl shadow-sm border border-line text-navy placeholder-navy/40 focus:outline-none focus:border-gold pr-10" />
                  <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/60 hover:text-navy">
                    {showCurrentPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="relative">
                  <input type={showNewPwd ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nuova password" className="w-full p-3 bg-white rounded-2xl shadow-sm border border-line text-navy placeholder-navy/40 focus:outline-none focus:border-gold pr-10" />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/60 hover:text-navy">
                    {showNewPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Conferma nuova password" className="w-full p-3 bg-white rounded-2xl shadow-sm border border-line text-navy placeholder-navy/40 focus:outline-none focus:border-gold" />
              </div>
              
              <div className="flex gap-2 mt-4">
                <button onClick={handleChangePassword} className="flex-1 py-2 bg-gold rounded-lg font-semibold text-navy hover:brightness-95 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />Salva Password
                </button>
                <button onClick={() => { setShowPasswordForm(false); setPasswordError(""); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} className="px-4 py-2 bg-white rounded-2xl shadow-sm text-navy">Annulla</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-ivory2 p-4 text-center"><Award className="w-6 h-6 text-golddark mx-auto mb-2" /><div className="text-xl font-bold text-navy">0</div><div className="text-navy/60 text-sm">Post</div></div>
            <div className="bg-ivory2 p-4 text-center"><BookOpen className="w-6 h-6 text-golddark mx-auto mb-2" /><div className="text-xl font-bold text-navy">0</div><div className="text-navy/60 text-sm">Libri</div></div>
          </div>
          
          <button onClick={handleLogout} className="w-full py-3 bg-ivory2 text-navy hover:bg-ivory2 flex items-center justify-center gap-2">
            <LogOut className="w-5 h-5" />Torna alla Home
          </button>
        </div>
      </main>
    </div>
  );
}
