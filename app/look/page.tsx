/* THROWAWAY look-dev page (/look) — for locking the cinematic direction before
   building the real thing. Three grade/type variants of the hero on REAL Webb
   imagery + one planet "beat" with a hotspot. Delete before final. */
import type { CSSProperties } from "react";

const DEEPFIELD =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Webb%27s_First_Deep_Field.jpg/1920px-Webb%27s_First_Deep_Field.jpg";
const PILLARS =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Eagle_nebula_pillars.jpg/1920px-Eagle_nebula_pillars.jpg";
const JUPITER =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg/1280px-Jupiter_and_its_shrunken_Great_Red_Spot.jpg";

// compact film-grain data URI (svg turbulence)
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

const sec: CSSProperties = { position: "relative", height: "100vh", overflow: "hidden", background: "#02030a" };
const bg = (img: string, filter: string): CSSProperties => ({
  position: "absolute",
  inset: 0,
  backgroundImage: `url(${img})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  filter,
});
const layer = (style: CSSProperties): CSSProperties => ({ position: "absolute", inset: 0, pointerEvents: "none", ...style });
const grain: CSSProperties = layer({ backgroundImage: GRAIN, backgroundSize: "160px 160px", opacity: 0.06, mixBlendMode: "overlay" });
const tag: CSSProperties = {
  position: "absolute", top: 24, right: 28, zIndex: 5, fontFamily: "var(--font-sans)",
  fontSize: 12, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)",
};
const content: CSSProperties = { position: "absolute", inset: 0, zIndex: 4, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "clamp(40px,8vh,110px) clamp(28px,7vw,120px)" };

export default function Look() {
  return (
    <main style={{ background: "#02030a" }}>
      {/* ---------- VARIANT A — deep cinematic teal + letterbox + serif accent ---------- */}
      <section style={sec}>
        <div style={bg(DEEPFIELD, "brightness(0.62) contrast(1.12) saturate(0.72) hue-rotate(8deg)")} />
        <div style={layer({ background: "radial-gradient(120% 90% at 60% 30%, rgba(40,70,120,0.25), transparent 55%)", mixBlendMode: "screen" })} />
        <div style={layer({ background: "linear-gradient(180deg, rgba(2,4,12,0.55) 0%, rgba(2,4,12,0) 35%, rgba(2,4,12,0.78) 100%)" })} />
        <div style={layer({ background: "radial-gradient(110% 80% at 50% 45%, transparent 45%, rgba(2,3,10,0.85) 100%)" })} />
        <div style={grain} />
        {/* letterbox */}
        <div style={layer({ top: 0, height: "6vh", background: "#000", bottom: "auto" })} />
        <div style={layer({ bottom: 0, height: "6vh", background: "#000", top: "auto" })} />
        <span style={tag}>Variant A · deep cinematic</span>
        <div style={content}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(180,205,255,0.8)", marginBottom: 22 }}>
            Founder · Engineer · Strategist
          </div>
          <h1 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: "clamp(3.4rem,11vw,9rem)", lineHeight: 0.86, letterSpacing: "-0.04em", textShadow: "0 6px 80px rgba(0,0,0,0.7)" }}>
            MICKY<br />
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.01em" }}>thanawarothon</span>
          </h1>
        </div>
      </section>

      {/* ---------- VARIANT B — warm filmic, full-bleed, bold sans ---------- */}
      <section style={sec}>
        <div style={bg(PILLARS, "brightness(0.7) contrast(1.06) saturate(1.18) hue-rotate(-12deg)")} />
        <div style={layer({ background: "radial-gradient(120% 90% at 40% 40%, rgba(120,70,40,0.28), transparent 55%)", mixBlendMode: "screen" })} />
        <div style={layer({ background: "linear-gradient(180deg, rgba(8,4,2,0.5) 0%, rgba(8,4,2,0) 40%, rgba(8,4,2,0.82) 100%)" })} />
        <div style={layer({ background: "radial-gradient(120% 85% at 50% 50%, transparent 50%, rgba(6,3,2,0.8) 100%)" })} />
        <div style={grain} />
        <span style={tag}>Variant B · warm filmic</span>
        <div style={content}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(255,220,180,0.85)", marginBottom: 20 }}>
            Baramee Thanawarothon
          </div>
          <h1 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: "clamp(3.6rem,13vw,10rem)", lineHeight: 0.82, letterSpacing: "-0.05em", textShadow: "0 6px 80px rgba(0,0,0,0.7)" }}>
            MICKY
          </h1>
          <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 600, fontSize: "clamp(1.1rem,4vw,2.6rem)", letterSpacing: "-0.01em", marginTop: 6 }}>THANAWAROTHON</div>
        </div>
      </section>

      {/* ---------- VARIANT C — high-contrast editorial, asymmetric split ---------- */}
      <section style={sec}>
        <div style={bg(DEEPFIELD, "brightness(0.66) contrast(1.32) saturate(0.5)")} />
        <div style={layer({ background: "linear-gradient(90deg, rgba(2,3,10,0.92) 0%, rgba(2,3,10,0.4) 38%, rgba(2,3,10,0) 62%)" })} />
        <div style={layer({ background: "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(2,3,10,0.7) 100%)" })} />
        <div style={grain} />
        <span style={tag}>Variant C · editorial</span>
        <div style={{ ...content, justifyContent: "center", alignItems: "flex-start" }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 18 }}>
            01 — the operator
          </div>
          <h1 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: "clamp(3rem,9vw,7.5rem)", lineHeight: 0.9, letterSpacing: "-0.045em" }}>
            MICKY<br />THANAWAROTHON
          </h1>
          <p style={{ maxWidth: "34ch", marginTop: 26, color: "rgba(255,255,255,0.7)", fontSize: "clamp(1rem,1.5vw,1.3rem)", lineHeight: 1.5 }}>
            Engineer, founder and strategist — building across AI, ventures and research.
          </p>
        </div>
      </section>

      {/* ---------- BEAT example — planet + label + glowing hotspot + work panel ---------- */}
      <section style={sec}>
        <div style={bg(JUPITER, "brightness(0.82) contrast(1.08) saturate(1.05)")} />
        <div style={layer({ background: "linear-gradient(180deg, rgba(2,3,10,0.45) 0%, rgba(2,3,10,0) 40%, rgba(2,3,10,0.8) 100%)" })} />
        <div style={layer({ background: "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(2,3,10,0.78) 100%)" })} />
        <div style={grain} />
        <span style={tag}>Beat · planet + clickable hotspot</span>
        {/* glowing hotspot marker */}
        <div style={{ position: "absolute", zIndex: 5, top: "42%", left: "58%" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(120,190,255,0.95)", boxShadow: "0 0 0 6px rgba(120,190,255,0.22), 0 0 22px 6px rgba(120,190,255,0.6)" }} />
        </div>
        {/* sample in-scene work panel */}
        <div style={{ position: "absolute", zIndex: 6, top: "38%", left: "62%", width: 300, background: "rgba(8,12,24,0.72)", backdropFilter: "blur(10px)", border: "1px solid rgba(150,180,255,0.25)", borderRadius: 14, padding: "16px 18px", color: "#fff", fontFamily: "var(--font-sans)" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(150,180,255,0.8)" }}>Venture · 01</div>
          <div style={{ fontWeight: 600, fontSize: 20, margin: "6px 0 4px" }}>AirfoilLearner</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.45 }}>AI for CFD optimisation · raised £5k via Venture Builder.</div>
          <div style={{ fontSize: 13, marginTop: 12, color: "rgba(150,190,255,0.95)" }}>View project →</div>
        </div>
        <div style={content}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 12 }}>03 / 05</div>
          <h2 style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: "clamp(2.8rem,8vw,6rem)", lineHeight: 0.9, letterSpacing: "-0.04em" }}>Venture</h2>
          <div style={{ color: "rgba(255,255,255,0.78)", fontSize: "clamp(1rem,1.6vw,1.4rem)", marginTop: 14 }}>Founder — ventures built &amp; shipped</div>
        </div>
      </section>
    </main>
  );
}
