import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

interface FarcasterMiniAppAction {
  type: "launch_miniapp"
  name: string
  url: string
  splashImageUrl?: string
  splashBackgroundColor?: string
}

interface FarcasterMiniAppButton {
  title: string
  action: FarcasterMiniAppAction
}

interface FarcasterMiniAppEmbed {
  version: "1"
  imageUrl: string
  button: FarcasterMiniAppButton
}

function createMiniAppMetadata(config: FarcasterMiniAppEmbed): Metadata {
  return {
    other: {
      "fc:miniapp": JSON.stringify(config),
    },
  }
}

export const metadata: Metadata = {
  title: "Lili the Elephant - Way Kambas Crowdfund",
  description: "Support elephant conservation at Way Kambas National Park through our crowdfunding campaign",
  generator: "v0.app",
  ...createMiniAppMetadata({
    version: "1",
    imageUrl: "/api/miniapp-image",
    button: {
      title: "🐘 Support Elephants",
      action: {
        type: "launch_miniapp",
        name: "Elephant Crowdfund",
        url: process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.vercel.app",
        splashImageUrl: "/api/splash-image",
        splashBackgroundColor: "#2D5A27",
      },
    },
  }),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="/api/miniapp-image" />
        <meta property="fc:frame:button:1" content="🐘 Support Elephants" />
        <meta property="fc:frame:button:1:action" content="launch_miniapp" />
        <meta
          property="fc:frame:button:1:target"
          content={process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.vercel.app"}
        />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
