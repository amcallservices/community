import type { Metadata } from "next";
import prisma from "@/lib/db";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { TEMPLATES } from "@/lib/consulenza-templates";

export const revalidate = 600;

const TITLE = "Consulenza self publishing: copertine, stesura e vendite su Amazon KDP";
const DESC = "Consulenze individuali in videochiamata per autori: copertina libro cartaceo ed ebook, stesura, vendite in organico su Amazon, pubblicazione su KDP e Liberamente.site. Pacchetti da 30, 60 e 90 minuti.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | ${SITE_NAME}` },
  description: DESC,
  keywords: ["consulenza self publishing", "consulenza autori", "consulenza Amazon KDP", "copertina libro cartaceo", "copertina ebook", "consulenza scrittura libro", "vendite organiche Amazon", "pubblicare un libro", "coaching per scrittori"],
  alternates: { canonical: "/consulenza" },
  openGraph: { type: "website", locale: "it_IT", url: `${SITE_URL}/consulenza`, siteName: SITE_NAME, title: TITLE, description: DESC },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

const FAQ = [
  ["Come funziona la consulenza?", "Scegli un pacchetto, paghi in sicurezza con carta tramite Stripe, scrivi al consulente per fissare giorno e ora e poi vi vedete in videochiamata su Google Meet."],
  ["Di cosa si può parlare in una consulenza?", "Di copertina per libro cartaceo e per ebook, stesura e struttura del libro, vendite in organico su Amazon, scelta della nicchia, pubblicazione su Amazon KDP, Liberamente.site e altri store, revisione della bozza e promozione."],
  ["Quanto dura una consulenza?", "Ci sono pacchetti da 30 minuti, da 60 minuti e da 90 minuti."],
  ["Serve installare qualcosa?", "No: la videochiamata si svolge su Google Meet, dal browser del computer o dal telefono."],
] as const;

export default async function Layout({ children }: { children: React.ReactNode }) {
  let offers: { title: string; description: string; durationMin: number; priceCents: number }[] = [];
  try {
    offers = await prisma.consulenzaOffer.findMany({ where: { active: true }, orderBy: { priceCents: "asc" }, take: 20, select: { title: true, description: true, durationMin: true, priceCents: true } });
  } catch {}
  const url = `${SITE_URL}/consulenza`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service", "@id": `${url}#service`, name: "Consulenza per autori di self publishing", serviceType: "Consulenza per autori",
        description: DESC, url, areaServed: "IT", availableLanguage: "it", provider: { "@id": `${SITE_URL}/#org` },
        audience: { "@type": "Audience", audienceType: "Autori e scrittori" },
        hasOfferCatalog: {
          "@type": "OfferCatalog", name: "Pacchetti di consulenza",
          itemListElement: (offers.length ? offers.map(o => ({ name: o.title, description: o.description.slice(0, 300), price: (o.priceCents / 100).toFixed(2), min: o.durationMin })) : []).map(o => ({
            "@type": "Offer", priceCurrency: "EUR", price: o.price, url,
            itemOffered: { "@type": "Service", name: o.name, description: o.description, termsOfService: `Durata: ${o.min} minuti` },
          })),
        },
      },
      { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Consulenza", item: url }] },
      { "@type": "ItemList", name: "Argomenti di consulenza", itemListElement: TEMPLATES.filter(t => t.k !== "altro").map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.title })) },
    ],
  };
  return (<>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    {children}
  </>);
}
