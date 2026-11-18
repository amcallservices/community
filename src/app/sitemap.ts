import type { MetadataRoute } from "next";
import prisma from "@/lib/db";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/consulenza`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/video`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/eventi`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/community`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/registrati`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
  try {
    const events = await prisma.event.findMany({ orderBy: { id: "desc" }, take: 100, select: { id: true, createdAt: true } });
    for (const e of events) pages.push({ url: `${SITE_URL}/eventi/${e.id}`, lastModified: e.createdAt, changeFrequency: "monthly", priority: 0.5 });
  } catch {}
  return pages;
}
