"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import "./home.css";

type PostPreview = { id: number; title: string; content: string; authorNome: string; authorCogen: string };

const plain = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<PostPreview[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    fetch("/api/posts")
      .then(r => (r.ok ? r.json() : []))
      .then(d => Array.isArray(d) && setPosts(d.slice(0, 3)))
      .catch(() => {});
  }, []);

  const join = user ? "/community" : "/registrati";
  const joinLabel = user ? "Vai alla community" : "Entra nella community";

  return (
    <div className="home">
      {/* Frontespizio */}
      <header className="hero">
        <div className="card">
          <i className="c" /><i className="c" /><i className="c" /><i className="c" />
          <div className="crest" aria-hidden="true">S</div>
          <h1 className="rise"><span>Self Publishing</span><span>Italia</span></h1>
          <p className="lead rise rise-2">La community degli scrittori italiani: confrontati, impara e cresci insieme.</p>
          <p className="det rise rise-3">Forum<span className="dia" />Video corsi<span className="dia" />Eventi<span className="dia" />Letture</p>
          <Link className="btn brass rise rise-4" href={join}>{joinLabel}</Link>
        </div>
      </header>

      {/* Indice */}
      <section className="sec indice" aria-labelledby="indice-t">
        <div className="sheet">
          <h2 id="indice-t">Indice</h2>
          <h3>Impara</h3>
          <Link className="row" href="/video"><b>Video corsi</b><s /><em>gratuiti</em></Link>
          <small>Self publishing spiegato passo dopo passo.</small>
          <Link className="row" href="/eventi"><b>Eventi e webinar</b><s /><em>dal vivo</em></Link>
          <small>Incontri con altri autori, con link diretto.</small>
          <h3>Condividi</h3>
          <Link className="row" href="/community"><b>Community</b><s /><em>sempre aperta</em></Link>
          <small>Pubblica, commenta, metti like ai post.</small>
          <Link className="row" href="/letture"><b>Letture</b><s /><em>libri degli autori</em></Link>
          <Link className="row" href="/messaggi"><b>Messaggi</b><s /><em>diretti</em></Link>
          <h3>Scrivi</h3>
          <a className="row" href="https://scrittoresite.streamlit.app/" target="_blank" rel="noopener noreferrer"><b>Scrittore Site</b><s /><em>il software</em></a>
          <small>Scrivi il tuo libro con una chat guidata.</small>
        </div>
        <div className="shelf">
          <svg viewBox="0 0 520 620" role="img" aria-label="Copertine di libri">
            <g transform="rotate(-6 150 420)"><rect x="40" y="170" width="250" height="360" fill="#181715" /><rect x="40" y="170" width="26" height="360" fill="#bfb21a" /><text x="92" y="270" fontFamily="Literata Variable, serif" fontStyle="italic" fontSize="34" fill="#e8e8e3">Il mio</text><text x="92" y="312" fontFamily="Literata Variable, serif" fontStyle="italic" fontSize="34" fill="#e8e8e3">primo libro</text><circle cx="165" cy="440" r="34" fill="#bfb21a" /></g>
            <g transform="rotate(5 340 360)"><rect x="250" y="90" width="230" height="340" fill="#f3f2ec" /><text x="276" y="170" fontFamily="Literata Variable, serif" fontStyle="italic" fontSize="30" fill="#181715">Storie</text><text x="276" y="206" fontFamily="Literata Variable, serif" fontStyle="italic" fontSize="30" fill="#181715">di mare</text><rect x="276" y="350" width="178" height="48" fill="#181715" /></g>
            <g transform="rotate(-2 330 520)"><rect x="300" y="360" width="190" height="230" fill="#bfb21a" /><text x="322" y="430" fontFamily="Literata Variable, serif" fontWeight="600" fontSize="26" fill="#181715">Guida KDP</text><text x="322" y="462" fontFamily="Literata Variable, serif" fontSize="18" fill="#181715">per principianti</text></g>
          </svg>
          <p>Dentro trovi tutto quello che serve a chi scrive e pubblica da solo.</p>
        </div>
      </section>

      {/* Scrittore Site */}
      <section className="show" aria-labelledby="ss-t">
        <div className="plate"><div><b aria-hidden="true">S</b><i /></div></div>
        <div className="sright">
          <div className="tabs"><span>Scrivi</span><span>Rivedi</span><span>Pubblica</span></div>
          <div>
            <h2 id="ss-t">Scrittore Site</h2>
            <p>Il nostro software di scrittura: una chat guidata ti porta dall&rsquo;idea al libro finito, capitolo dopo capitolo.</p>
          </div>
          <div className="cells">
            <a href="https://scrittoresite.streamlit.app/" target="_blank" rel="noopener noreferrer">Prova il software</a>
            <a href="#video">Guarda come funziona</a>
          </div>
        </div>
      </section>

      {/* Video (mantenuto) */}
      <section className="sec vid" id="video" aria-labelledby="vid-t">
        <div><h2 id="vid-t">Guarda il video</h2><p>Due minuti per capire come funziona la community.</p></div>
        <div className="frame">
          <iframe
            src="https://www.youtube.com/embed/A53E5DZ00sU"
            title="Video Self Publishing Italia"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
      </section>

      {/* Dalla community */}
      <section className="sec feed" aria-labelledby="feed-t">
        <h2 id="feed-t">Dalla community</h2>
        {posts.length === 0 ? (
          <article className="post big" style={{ gridColumn: "1 / -1" }}>
            <h3>Qui compariranno i primi post</h3>
            <p>La community è appena ripartita: scrivi tu il primo, presentati e racconta a cosa stai lavorando.</p>
            <Link className="btn" href={join} style={{ marginTop: 28, alignSelf: "flex-start" }}>{user ? "Scrivi un post" : "Registrati e scrivi"}</Link>
          </article>
        ) : (
          <>
            <article className="post big">
              <h3>{posts[0].title}</h3>
              <p>{plain(posts[0].content).slice(0, 220)}</p>
              <div className="who"><span className="av">{(posts[0].authorNome || "?")[0]}</span>{posts[0].authorNome} {posts[0].authorCogen}</div>
            </article>
            {posts[1] && (
              <div className="col">
                <article className="post"><h3>{posts[1].title}</h3><p>{plain(posts[1].content).slice(0, 120)}</p><div className="who"><span className="av">{(posts[1].authorNome || "?")[0]}</span>{posts[1].authorNome}</div></article>
                {posts[2] && <article className="post ink"><h3>{posts[2].title}</h3><p>{plain(posts[2].content).slice(0, 120)}</p></article>}
              </div>
            )}
          </>
        )}
      </section>

      {/* Cartolina di iscrizione */}
      <section className="cta" aria-labelledby="cta-t">
        <p>Unisciti agli scrittori che si aiutano a vicenda ogni giorno.</p>
        <div className="reply">
          <h2 id="cta-t">{user ? "Bentornato" : "Entra nella community"}</h2>
          <p>{user ? "Pubblica un post o scrivi a un altro autore." : "Registrati gratis, presentati e pubblica il tuo primo post. Ci vuole un minuto."}</p>
          <Link className="btn" href={join}>{user ? "Vai alla community" : "Registrati gratis"}</Link>
        </div>
      </section>

      {/* Retro della cartolina */}
      <footer>
        <div className="back">
          <div className="stamp" aria-hidden="true">S</div>
          <div><h2>A presto sulla pagina.</h2><p>Scrivi, condividi, chiedi. Qui nessuno pubblica da solo.</p></div>
          <nav className="addr" style={{ paddingTop: 40 }}>
            <Link href="/community">Community</Link><Link href="/video">Video corsi</Link><Link href="/eventi">Eventi</Link><Link href="/letture">Letture</Link><Link href="/login">Accedi</Link>
          </nav>
          <div className="imp">&copy; 2026 Self Publishing Italia. Tutti i diritti riservati.</div>
        </div>
      </footer>
    </div>
  );
}
