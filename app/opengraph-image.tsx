import { ImageResponse } from "next/og";

// 1200x630 monochrome share card: a black field, the glowing black-hole ring,
// and the name + tagline in the grotesque. Single cool accent on the ring glow.
// next/og (satori) supports flexbox + a subset of CSS only — no grid, no SVG
// stroke tricks beyond simple borders/gradients, so the ring is a bordered
// circle and the accretion glow is a layered radial-gradient.

export const alt = "Micky Thanawarothon — I build things that work.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000000",
          padding: "72px 84px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* accretion glow behind the ring — the one cool accent */}
        <div
          style={{
            position: "absolute",
            top: 120,
            right: 96,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(169,198,255,0.34) 0%, rgba(169,198,255,0.10) 42%, rgba(0,0,0,0) 68%)",
            display: "flex",
          }}
        />
        {/* the black-hole ring: white event-horizon ring on black */}
        <div
          style={{
            position: "absolute",
            top: 195,
            right: 171,
            width: 270,
            height: 270,
            borderRadius: "50%",
            border: "14px solid #ffffff",
            boxShadow: "0 0 60px 4px rgba(214,230,255,0.45)",
            display: "flex",
          }}
        />

        {/* top label */}
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.56)",
            fontWeight: 500,
          }}
        >
          Founder / Engineer / Strategist
        </div>

        {/* name + tagline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 132,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 0.9,
              color: "#ffffff",
              textTransform: "uppercase",
            }}
          >
            MICKY
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 56,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "#ffffff",
              textTransform: "uppercase",
            }}
          >
            I build things that w
            <span
              style={{
                display: "flex",
                width: 46,
                height: 46,
                marginLeft: 6,
                marginRight: 6,
                alignSelf: "center",
                borderRadius: "50%",
                border: "8px solid #ffffff",
              }}
            />
            rk
          </div>
        </div>

        {/* footer URL line */}
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.46)",
            fontWeight: 500,
          }}
        >
          Manchester / Bangkok
        </div>
      </div>
    ),
    { ...size },
  );
}
