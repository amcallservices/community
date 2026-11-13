"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function SyncPage() {
  const [status, setStatus] = useState<"loading"|"success"|"error">("loading")
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    const syncData = async () => {
      const log: string[] = []
      
      try {
        // Recupera tutti i dati da localStorage
        const localPosts = JSON.parse(localStorage.getItem('posts') || '[]')
        const localComments = JSON.parse(localStorage.getItem('comments') || '{}')
        const localVideos = JSON.parse(localStorage.getItem('videos') || '[]')
        const localLetture = JSON.parse(localStorage.getItem('letture') || '[]')
        const localEvents = JSON.parse(localStorage.getItem('events') || '[]')
        
        log.push(`Trovati in locale:`)
        log.push(`  - ${localPosts.length} post`)
        log.push(`  - ${Object.keys(localComments).length} commenti`)
        log.push(`  - ${localVideos.length} video`)
        log.push(`  - ${localLetture.length} PDF/letture`)
        log.push(`  - ${localEvents.length} eventi`)
        setLogs([...log, '', 'Sincronizzazione in corso...'])
        
        // Post sincronizzati
        let syncPosts = 0
        for (const p of localPosts) {
          if (!p.id) continue
          try {
            const res = await fetch('/api/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: p.title || '',
                content: p.content,
                authorId: 1, // Utente di default
                category: p.category || 'writing'
              })
            })
            if (res.ok) syncPosts++
          } catch (e) {}
        }
        log.push(`  - ${syncPosts} post sincronizzati`)
        setLogs([...log])
        
        // Video sincronizzati
        let syncVideos = 0
        for (const v of localVideos) {
          if (!v.id) continue
          try {
            const res = await fetch('/api/videos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: v.title,
                youtubeUrl: v.youtubeUrl,
                description: v.description
              })
            })
            if (res.ok) syncVideos++
          } catch (e) {}
        }
        log.push(`  - ${syncVideos} video sincronizzati`)
        setLogs([...log])
        
        // PDF/Letture sincronizzati
        let syncLetture = 0
        for (const l of localLetture) {
          if (!l.id) continue
          try {
            const res = await fetch('/api/letture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: l.title,
                description: l.description,
                dataUrl: l.dataUrl || l.pdfUrl
              })
            })
            if (res.ok) syncLetture++
          } catch (e) {}
        }
        log.push(`  - ${syncLetture} PDF sincronizzati`)
        setLogs([...log])
        
        // Eventi sincronizzati
        let syncEvents = 0
        for (const e of localEvents) {
          if (!e.id) continue
          try {
            const res = await fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: e.title,
                date: e.date,
                type: e.type,
                meetLink: e.meetLink
              })
            })
            if (res.ok) syncEvents++
          } catch (e) {}
        }
        log.push(`  - ${syncEvents} eventi sincronizzati`)
        setLogs([...log])
        
        log.push('')
        log.push('Sincronizzazione completata!')
        setLogs([...log, '', 'Vai alla Home e premi Ctrl+Shift+R per ricaricare'])
        setStatus("success")
      } catch (e) {
        log.push('Errore: ' + String(e))
        setLogs(log)
        setStatus("error")
      }
    }
    
    syncData()
  }, [])

  return (
    <div className="min-h-screen bg-white rounded-2xl shadow-sm text-navy p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sincronizzazione Database</h1>
        <p className="text-navy/60 mb-6">Copia tutti i dati dal browser al database condiviso</p>
        
        <div className="bg-white rounded-2xl shadow-sm p-6 font-mono text-sm space-y-1">
          {status === "loading" && (
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-golddark" />
              <span>Elaborazione in corso...</span>
            </div>
          )}
          
          {logs.map((line, i) => (
            <div key={i} className={line.startsWith('Errore') ? 'text-red-400' : 'text-newsprint'}>{line}</div>
          ))}
          
          {status === "success" && (
            <div className="flex items-center gap-2 mt-4 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>Tutto sincronizzato!</span>
            </div>
          )}
          
          {status === "error" && (
            <div className="flex items-center gap-2 mt-4 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>Errore durante la sincronizzazione</span>
            </div>
          )}
        </div>
        
        <a 
          href="/"
          className="mt-6 inline-block px-6 py-3 bg-wine text-white rounded-lg font-semibold font-medium hover:brightness-95"
        >
          Torna alla Home
        </a>
      </div>
    </div>
  )
}
