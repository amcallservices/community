"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, FileText, Eye, Upload } from "lucide-react";

export default function Page() {
  const [books, setBooks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      // Check admin by email (admin always has admin role)
      setIsAdmin(u.role === 'admin');
    }
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    const res = await fetch("/api/letture?_=" + Date.now());
    if (res.ok) setBooks(await res.json());
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") setSelectedFile(file);
    else if (file) alert("Seleziona un file PDF");
  };

  const saveBook = async () => {
    if (!title || !selectedFile) { alert("Inserisci titolo e seleziona un PDF"); return; }
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const res = await fetch("/api/letture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, dataUrl: reader.result, description: desc })
        });
        if (res.ok) { alert("Libro aggiunto!"); setTitle(""); setDesc(""); setSelectedFile(null); setShowForm(false); loadBooks(); }
        setIsUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) { alert("Errore: " + err); setIsUploading(false); }
  };

  const deleteBook = async (id: number) => {
    if (!confirm("Eliminare questo libro?")) return;
    const res = await fetch("/api/letture?id=" + id, { method: "DELETE" });
    if (res.ok) loadBooks();
  };

  const openPdf = (book: any) => {
    if (book.dataUrl) {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`<!DOCTYPE html><html><head><title>${book.title}</title><style>*{margin:0;padding:0;}body{background:#1e293b;}iframe{width:100vw;height:100vh;border:none;}</style></head><body><iframe src="${book.dataUrl}"></iframe></body></html>`);
        win.document.close();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Letture</h1>
          {isAdmin && <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 flex items-center gap-2"><Plus className="w-4 h-4" /> Aggiungi Libro</button>}
        </div>
        
        {!isAdmin && user && <p className="text-sm text-slate-400 mb-4">L'inserimento libri è riservato agli admin</p>}
        {!user && <p className="text-sm text-slate-400 mb-4"><Link href="/login" className="text-amber-400">Accedi</Link> per leggere i libri</p>}
        
        {showForm && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-white/10">
            <h3 className="font-bold text-white mb-4">Nuovo Libro PDF</h3>
            <input type="text" placeholder="Titolo del libro" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 mb-3" />
            <textarea placeholder="Descrizione" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 mb-3" />
            <div className="border-2 border-dashed border-white/20 rounded-xl p-4 mb-3 text-center">
              <input type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" id="pdf-upload" />
              <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                {selectedFile ? <span className="text-green-400 font-medium">{selectedFile.name}</span> : <span className="text-slate-500">Clicca per selezionare un PDF</span>}
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={saveBook} disabled={!title || !selectedFile || isUploading} className="px-4 py-2 bg-amber-500 text-white rounded-xl disabled:opacity-50">{isUploading ? "Caricamento..." : "Salva"}</button>
              <button onClick={() => { setShowForm(false); setSelectedFile(null); setTitle(""); setDesc(""); }} className="px-4 py-2 bg-white/10 text-white rounded-xl">Annulla</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : books.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Nessun libro aggiunto</div>
        ) : (
          <div className="grid gap-4">
            {books.map((book) => (
              <div key={book.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-white" /></div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{book.title}</h3>
                      <p className="text-xs text-slate-500">{new Date(book.createdAt).toLocaleDateString("it-IT")}</p>
                      <p className="text-slate-400 text-sm mt-2">{book.description}</p>
                      {book.dataUrl && <button onClick={() => openPdf(book)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl mt-3 hover:bg-blue-600"><Eye className="w-4 h-4" /> Leggi PDF</button>}
                    </div>
                  </div>
                  {isAdmin && <button onClick={() => deleteBook(book.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
