import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2D5A27",
        borderRadius: "20px",
      }}
    >
      <div style={{ fontSize: 80, animation: "pulse 2s infinite" }}>🐘</div>
    </div>,
    {
      width: 200,
      height: 200,
    },
  )
}
