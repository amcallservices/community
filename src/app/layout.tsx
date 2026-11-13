import type { Metadata, Viewport } from "next";
import "@fontsource-variable/literata";
import "@fontsource-variable/literata/wght-italic.css";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SITE_URL, SITE_NAME, SITE_DESC, FAQ } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Self Publishing Italia - La community degli scrittori", template: "%s | Self Publishing Italia" },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: ["self publishing", "self publishing Italia", "community scrittori", "scrivere un libro", "pubblicare ebook", "Amazon KDP", "autori indipendenti", "corso self publishing", "Scrittore Site", "Liberamente"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: { type: "website", locale: "it_IT", url: SITE_URL, siteName: SITE_NAME, title: "Self Publishing Italia - La community degli scrittori", description: SITE_DESC },
  twitter: { card: "summary_large_image", title: "Self Publishing Italia - La community degli scrittori", description: SITE_DESC },
};

export const viewport: Viewport = { themeColor: "#1b1464" };

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/logo.svg`, description: SITE_DESC, sameAs: ["https://liberamente.site", "https://scrittoresite.streamlit.app/"] },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, inLanguage: "it-IT", publisher: { "@id": `${SITE_URL}/#org` } },
    { "@type": "FAQPage", "@id": `${SITE_URL}/#faq`, mainEntity: FAQ.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-ivory text-navy antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
