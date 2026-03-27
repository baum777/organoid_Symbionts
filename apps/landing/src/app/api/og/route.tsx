import { content } from "@/lib/content";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "1200px",
          height: "630px",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 16% 18%, rgba(103,232,249,0.24), transparent 26%), radial-gradient(circle at 82% 22%, rgba(232,121,249,0.20), transparent 28%), radial-gradient(circle at 50% 90%, rgba(110,231,183,0.18), transparent 32%), linear-gradient(135deg, #09090b 0%, #111114 45%, #0b1014 100%)",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.02em",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "40px",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "42px",
            background: "rgba(255,255,255,0.03)",
            boxShadow: "0 40px 120px rgba(0,0,0,0.45)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(circle at center, black, transparent 74%)",
            opacity: 0.25,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "160px",
            width: "280px",
            height: "280px",
            borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(232,121,249,0.26) 0%, rgba(232,121,249,0.08) 32%, transparent 70%)",
            filter: "blur(18px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-40px",
            width: "320px",
            height: "320px",
            borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(110,231,183,0.22) 0%, rgba(110,231,183,0.08) 34%, transparent 72%)",
            filter: "blur(20px)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "72px 84px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              alignItems: "center",
              gap: "12px",
              padding: "10px 16px",
              borderRadius: "9999px",
              border: "1px solid rgba(110,231,183,0.25)",
              background: "rgba(110,231,183,0.08)",
              color: "#6ee7b7",
              fontSize: "20px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
            }}
          >
            Organoid Symbiont
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "860px" }}>
            <h1
              style={{
                fontSize: "86px",
                lineHeight: 0.92,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "-0.05em",
                margin: 0,
              }}
            >
              {content.hero.title}
            </h1>
            <p
              style={{
                maxWidth: "760px",
                margin: 0,
                fontSize: "28px",
                lineHeight: 1.4,
                color: "#d4d4d8",
              }}
            >
              {content.brand.strapline}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "24px",
                lineHeight: 1.5,
                color: "#a1a1aa",
                maxWidth: "720px",
              }}
            >
              $wetware as a bio-digital signal object for the seam between substrate and interface.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: "#67e8f9",
                fontSize: "20px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "14px",
                  height: "14px",
                  borderRadius: "9999px",
                  background: "#67e8f9",
                  boxShadow: "0 0 20px rgba(103,232,249,0.9)",
                }}
              />
              Preview
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
