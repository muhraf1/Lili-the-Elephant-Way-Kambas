import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2D5A27",
        backgroundImage: "linear-gradient(45deg, #2D5A27 0%, #4A7C59 100%)",
      }}
    >
      <div style={{ fontSize: 120, marginBottom: 20 }}>🐘</div>
      <div
        style={{
          fontSize: 48,
          fontWeight: "bold",
          color: "white",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        Save Lili
      </div>
      <div
        style={{
          fontSize: 24,
          color: "#E8F5E8",
          textAlign: "center",
        }}
      >
        Way Kambas Elephant Fund
      </div>
    </div>,
    {
      width: 600,
      height: 400,
    },
  )
}
