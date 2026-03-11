import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 600,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#181818",
          color: "#f5f5f5",
          padding: "52px",
          border: "2px solid #444444",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 7, textTransform: "uppercase" }}>
          Ellas
        </div>
        <div style={{ fontSize: 58, lineHeight: 1.15, maxWidth: 930 }}>
          Women&apos;s testimonies with name, date, and witnesses.
        </div>
        <div style={{ fontSize: 22, opacity: 0.8 }}>ellas</div>
      </div>
    ),
    size
  );
}
