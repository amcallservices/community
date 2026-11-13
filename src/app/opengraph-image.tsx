import { ImageResponse } from "next/og";

export const alt = "Self Publishing Italia - La community degli scrittori";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#1b1464", color: "#fffaf0" }}>
        <div style={{ display: "flex", fontSize: 30, color: "#ffc83d", marginBottom: 24 }}>La community degli scrittori italiani</div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 800, lineHeight: 1.05 }}>Self Publishing Italia</div>
        <div style={{ display: "flex", fontSize: 36, marginTop: 32, color: "#d9d4ff" }}>Scrivi, pubblica e cresci insieme ad altri autori</div>
      </div>
    ),
    size
  );
}
