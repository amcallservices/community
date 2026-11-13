"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Send, ArrowLeft, Loader2 } from "lucide-react";

type UserData = { id: number; nome: string; cognome: string; email: string; avatar?: string };
type Message = { id: number; senderId: number; receiverId: number; content: string; createdAt: string; read: boolean; sender?: UserData };

export default function MessaggiPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [utenti, setUtenti] = useState<UserData[]>([]);
  const [selectedUtente, setSelectedUtente] = useState<UserData | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessageArrived, setNewMessageArrived] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const targetUserId = searchParams.get('to');

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      loadUtenti(u.id);
    }
    loadMessages();
  }, []);

  useEffect(() => {
    if (targetUserId && utenti.length > 0) {
      const target = utenti.find(u => u.id === parseInt(targetUserId));
      if (target) setSelectedUtente(target);
    }
  }, [targetUserId, utenti]);

  const loadUtenti = async (currentUserId?: number) => {
    try {
      const res = await fetch("/api/utenti");
      if (res.ok) {
        const data = await res.json();
        const currentId = currentUserId || user?.id;
        setUtenti(data.filter((u: UserData) => u.id !== currentId));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadMessages = async () => {
    const stored = localStorage.getItem("user");
    const currentUser = stored ? JSON.parse(stored) : user;
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/messages?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        const oldCount = messages.length;
        setMessages(data);
        
        // Check for new messages
        if (data.length > oldCount && oldCount > 0) {
          setNewMessageArrived(true);
          setTimeout(() => setNewMessageArrived(false), 2000);
          // Play notification sound
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEA');
            audio.play().catch(() => {});
          } catch (e) {}
        }
        
        // Mark unread messages as read
        const unread = data.filter((m: any) => !m.read && m.receiverId === currentUser.id);
        for (const msg of unread) {
          await fetch(`/api/messages?id=${msg.id}`, { method: 'PUT' });
        }
      }
    } catch (e) { console.error(e); }
  };

  // Auto-reload messages every 3 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [user, messages.length]);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUtente]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedUtente) {
      alert("Compila tutti i campi");
      return;
    }

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: Number(user.id),
          receiverId: Number(selectedUtente.id),
          content: newMessage,
          senderEmail: user.email,
          senderNome: user.nome,
          receiverEmail: selectedUtente.email,
          receiverNome: selectedUtente.nome
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setNewMessage("");
        await loadMessages();
        alert("Messaggio inviato!");
      } else {
        alert("Errore: " + (data.error || "Sconosciuto"));
      }
    } catch (e) { 
      console.error(e); 
      alert("Errore di connessione"); 
    }
  };

  const conversation = selectedUtente ? messages.filter(
    m => (m.senderId === user?.id && m.receiverId === selectedUtente.id) ||
         (m.senderId === selectedUtente.id && m.receiverId === user?.id)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];

  if (!user) {
    return (
      <div className="min-h-screen bg-white rounded-2xl shadow-sm flex items-center justify-center">
        <div className="text-center">
          <p className="text-navy/60 mb-4">Effettua il login per accedere ai messaggi</p>
          <Link href="/login" className="text-golddark hover:underline">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white rounded-2xl shadow-sm">
      <div className="flex h-[calc(100vh-56px)]">
        {/* User List */}
        <div className={`w-full md:w-80 border-r border-white/10 overflow-y-auto ${selectedUtente ? 'hidden md:block' : 'block'}`}>
          <div className="p-4">
            <h2 className="text-navy font-semibold mb-4">Conversazioni</h2>
            {loading ? (
              <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-golddark" /></div>
            ) : utenti.length === 0 ? (
              <p className="text-navy/60">Nessun utente disponibile</p>
            ) : (
              <div className="space-y-2">
                {utenti.map((u) => {
                  const convMessages = messages.filter(
                    m => (m.senderId === user?.id && m.receiverId === u.id) ||
                         (m.senderId === u.id && m.receiverId === user?.id)
                  );
                  const lastMsg = convMessages[convMessages.length - 1];
                  const hasUnread = convMessages.some(m => !m.read && m.senderId === u.id);
                  
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUtente(u)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left ${
                        selectedUtente?.id === u.id ? "bg-gold/25" : "bg-ivory2 hover:bg-white rounded-2xl shadow-sm"
                      }`}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 bg-wine text-white rounded-lg font-semibold rounded-full flex items-center justify-center font-bold">
                          {u.nome?.[0] || u.email?.[0]}
                        </div>
                        {hasUnread && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-navy font-medium">{u.nome} {u.cognome}</div>
                          {hasUnread && <div className="w-2 h-2 bg-wine text-white rounded-lg font-semibold rounded-full animate-pulse" />}
                        </div>
                        {lastMsg && (
                          <div className="text-navy/60 text-xs truncate">{lastMsg.content}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className={`flex-1 flex flex-col ${selectedUtente ? 'flex' : 'hidden md:flex'}`}>
          {selectedUtente ? (
            <>
              <div className="p-4 border-b border-line flex items-center gap-3">
                <button onClick={() => setSelectedUtente(null)} className="md:hidden text-navy/60"><ArrowLeft /></button>
                <div className="w-10 h-10 bg-wine text-white rounded-lg font-semibold rounded-full flex items-center justify-center font-bold">
                  {selectedUtente.nome?.[0] || selectedUtente.email?.[0]}
                </div>
                <div className="flex-1">
                  <div className="text-navy font-medium">{selectedUtente.nome} {selectedUtente.cognome}</div>
                  {newMessageArrived && <div className="text-xs text-green-400 animate-pulse">Nuovo messaggio!</div>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversation.length === 0 ? (
                  <p className="text-navy/60 text-center">Nessun messaggio. Inizia la conversazione!</p>
                ) : (
                  conversation.map((m) => (
                    <div key={m.id} className={`${m.senderId === user?.id ? 'ml-auto bg-gold/25' : 'mr-auto bg-white rounded-2xl shadow-sm'} max-w-[80%]  p-3`}>
                      <p className="text-navy text-sm">{m.content}</p>
                      <p className="text-navy/60 text-xs mt-1">{new Date(m.createdAt).toLocaleString("it-IT")}</p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-line">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Scrivi un messaggio..."
                    className="flex-1 bg-white rounded-2xl shadow-sm border border-line rounded-full px-4 py-2 text-navy placeholder-navy/40 focus:outline-none focus:border-wine"
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button onClick={sendMessage} className="p-2 bg-wine text-white rounded-lg font-semibold rounded-full hover:brightness-95">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-navy/60">Seleziona una conversazione</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}