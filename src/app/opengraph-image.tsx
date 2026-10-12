import { ImageResponse } from "next/og";
import { site } from "@/content/site";

// Default social sharing image: a text card in brand colours (no stock photography).
export const alt = "Aakrin: Salesforce engineering for consulting partners and businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated once at build time (static export)
export const dynamic = "force-static";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#16131D",
        color: "#F3F1F6",
      }}
    >
      <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
        {site.name}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", width: 96, height: 6, background: "#E55014" }} />
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          Salesforce engineering
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#B5AFC2", maxWidth: 900 }}>
          For Salesforce consulting partners and businesses
        </div>
      </div>
    </div>,
    size,
  );
}
