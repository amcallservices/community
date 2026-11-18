import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Consulenze per autori",
  description: "Consulenze individuali in videochiamata con gli esperti della community: copertine, stesura, vendite in organico su Amazon e pubblicazione.",
  alternates: { canonical: "/consulenza" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
