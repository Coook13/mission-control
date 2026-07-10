import { ImageResponse } from "next/og";

export const alt = "Micky Thanawarothon - Engineer, founder, strategist, investor.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const colors = ["#F2C94C", "#2457E6", "#E4473A", "#F28A2E", "#2F9E5B", "#ECEDEF"];
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#0F1114", color: "#F2F4F6", padding: "70px 78px", fontFamily: "Arial, sans-serif", position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "58%" }}>
        <span style={{ fontSize: 24, fontWeight: 700 }}>Micky Thanawarothon</span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <strong style={{ fontSize: 72, lineHeight: 1.02, letterSpacing: 0 }}>Engineer, founder,<br />strategist, investor.</strong>
          <span style={{ marginTop: 28, fontSize: 21 }}>Manchester / Bangkok</span>
        </div>
      </div>
      <div style={{ position: "absolute", right: 92, top: 90, width: 410, height: 410, display: "flex", flexWrap: "wrap", transform: "rotate(-9deg)", boxShadow: "20px 30px 55px rgba(0,0,0,0.48)", background: "#050607", padding: 14 }}>
        {Array.from({ length: 9 }).map((_, index) => <div key={index} style={{ width: "33.333%", height: "33.333%", display: "flex", background: colors[index % colors.length], border: "7px solid #121212" }} />)}
      </div>
    </div>,
    size,
  );
}
