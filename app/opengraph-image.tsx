import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#111111",
          color: "#f5f5f5",
          padding: "56px",
          border: "2px solid #444444",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 8, textTransform: "uppercase" }}>
          Ellas
        </div>
        <div style={{ fontSize: 66, lineHeight: 1.1, maxWidth: 980 }}>
          Stories of women the world never documented.
        </div>
        <div style={{ fontSize: 26, opacity: 0.85 }}>
          ellas • testimonies • collective memory
        </div>
      </div>
    ),
    size
  );
}
