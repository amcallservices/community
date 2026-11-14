import type { Metadata } from "next";
import prisma from "@/lib/db";
import EventsView from "@/components/EventsView";

export const dynamic = "force-dynamic";

async function load(id: string) {
  const n = parseInt(id);
  if (!n) return null;
  return prisma.event.findUnique({ where: { id: n } }).catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const ev = await load((await params).id);
  if (!ev) return { title: "Evento non trovato", robots: { index: false } };
  const d = new Date(ev.date.replace(" ", "T"));
  const when = isNaN(d.getTime()) ? ev.date : d.toLocaleString("it-IT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });
  const description = `${when}. ${ev.description || "Evento online gratuito per autori indipendenti. Iscriviti dalla community."}`.slice(0, 200);
  return { title: ev.title, description, alternates: { canonical: `/eventi/${ev.id}` }, openGraph: { title: ev.title, description, type: "website" }, twitter: { card: "summary_large_image", title: ev.title, description } };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = parseInt((await params).id) || 0;
  return <EventsView onlyId={id} />;
}
