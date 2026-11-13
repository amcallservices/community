import type { Metadata } from "next";
import "@fontsource-variable/literata";
import "@fontsource-variable/literata/wght-italic.css";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Self Publishing Italia - La community degli scrittori",
  description: "Connettiti. Condividi. Cresci.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-ink text-paper antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
