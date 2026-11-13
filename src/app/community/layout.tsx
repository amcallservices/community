import type { Metadata } from "next";
export const metadata: Metadata = { title: "Community degli autori", description: "Il forum di Self Publishing Italia: pubblica, commenta e confrontati con altri scrittori italiani.", alternates: { canonical: "/community" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
