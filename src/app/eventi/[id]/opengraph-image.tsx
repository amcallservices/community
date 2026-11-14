import { ImageResponse } from "next/og";
import prisma from "@/lib/db";
import { romeToUtc } from "@/lib/events";

export const alt = "Evento Self Publishing Italia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const n = parseInt((await params).id) || 0;
  const ev = n ? await prisma.event.findUnique({ where: { id: n } }).catch(() => null) : null;
  const d = ev ? romeToUtc(ev.date) : null;
  const ok = !!d;
  const day = ok ? d!.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome" }) : "";
  const hour = ok ? d!.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" }) : "";
  const title = (ev?.title || "Eventi per autori").slice(0, 90);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#1b1464", color: "#fffaf0" }}>
        <div style={{ display: "flex", fontSize: 32, color: "#ffc83d", fontWeight: 700 }}>Evento online gratuito</div>
        <div style={{ display: "flex", fontSize: title.length > 50 ? 66 : 84, fontWeight: 800, lineHeight: 1.08 }}>{title}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 40, color: "#2dd4a7", fontWeight: 700 }}>{ok ? `${day} · ore ${hour}` : ""}</div>
          <div style={{ display: "flex", fontSize: 30, color: "#d9d4ff" }}>Self Publishing Italia</div>
        </div>
      </div>
    ),
    size
  );
}
