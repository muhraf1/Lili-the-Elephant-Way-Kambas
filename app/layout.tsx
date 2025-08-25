import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

function getBaseUrl(): string | undefined {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || "https://v0-elephant-crowdfund-app.vercel.app"
  if (!envUrl) return undefined
  return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl
}

function toAbsoluteUrl(pathOrUrl: string): string {
  try {
    // If it's already an absolute URL, return as is
    // eslint-disable-next-line no-new
    new URL(pathOrUrl)
    return pathOrUrl
  } catch {}
  const base = getBaseUrl()
  if (!base) return pathOrUrl
  return pathOrUrl.startsWith("/") ? `${base}${pathOrUrl}` : `${base}/${pathOrUrl}`
}

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
      // For backward compatibility
      "fc:frame": JSON.stringify({
        ...config,
        button: {
          ...config.button,
          action: {
            ...config.button.action,
            // Back-compat requires 'launch_frame'
            type: "launch_frame" as unknown as "launch_miniapp",
          },
        },
      }),
    },
  }
}

export const metadata: Metadata = {
  title: "Lili the Elephant - Way Kambas Crowdfund",
  description: "Support elephant conservation at Way Kambas National Park through our crowdfunding campaign",
  generator: "v0.app",
  ...createMiniAppMetadata({
    version: "1",
    imageUrl: toAbsoluteUrl("/api/miniapp-image"),
    button: {
      title: "🐘 Support Elephants",
      action: {
        type: "launch_miniapp",
        name: "Elephant Crowdfund",
        url: getBaseUrl() || "https://v0-elephant-crowdfund-app.vercel.app",
        splashImageUrl: toAbsoluteUrl("/api/splash-image"),
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
