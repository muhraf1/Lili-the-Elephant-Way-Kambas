"use client"

import { useEffect, useState } from "react"
import { Wallet, User } from "lucide-react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { sdk } from "@farcaster/miniapp-sdk"
import type { Context } from "@farcaster/miniapp-sdk"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

export function FarcasterConnect() {
  const { address, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [context, setContext] = useState<Context | null>(null)
  const [hasAttemptedConnect, setHasAttemptedConnect] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const context = await sdk.context
        console.log("[v0] Farcaster context:", context)
        setContext(context)
      } catch (error) {
        console.error("[v0] Failed to fetch Farcaster context:", error)
      }
    }
    fetchContext()
  }, [])

  useEffect(() => {
    console.log("[v0] Wallet status:", status, "address:", address)
    console.log(
      "[v0] Available connectors:",
      connectors.map((c) => ({ id: c.id, name: c.name })),
    )

    // Clear error when connection succeeds
    if (status === "connected" && address) {
      setConnectionError(null)
      console.log("[v0] Wallet successfully connected:", address)
    }

    if (status === "disconnected" && !hasAttemptedConnect && !connectionError) {
      const autoConnect = async () => {
        try {
          console.log("[v0] Attempting initial auto-connect...")
          setHasAttemptedConnect(true)
          setConnectionError(null)

          // Find the Farcaster connector specifically
          const farcasterConnector = connectors.find(
            (c) => c.id === "farcaster" || c.name.toLowerCase().includes("farcaster") || c.id.includes("miniapp"),
          )

          if (!farcasterConnector) {
            // Fallback to first connector if Farcaster not found
            const firstConnector = connectors[0]
            if (!firstConnector) {
              throw new Error("No connectors available")
            }
            console.log("[v0] Using fallback connector:", firstConnector.id, firstConnector.name)
            await connect({ connector: firstConnector })
          } else {
            console.log("[v0] Using Farcaster connector:", farcasterConnector.id, farcasterConnector.name)
            await connect({ connector: farcasterConnector })
          }
        } catch (error) {
          console.error("[v0] Auto-connect failed:", error)
          setConnectionError(error instanceof Error ? error.message : "Auto-connect failed")
          setHasAttemptedConnect(false)
        }
      }

      const timer = setTimeout(autoConnect, 500)
      return () => clearTimeout(timer)
    }
  }, [status, connect, connectors, hasAttemptedConnect, address, connectionError])

  const handleManualConnect = async () => {
    try {
      console.log("[v0] Manual connect triggered")
      setHasAttemptedConnect(true)
      setConnectionError(null)

      const farcasterConnector = connectors.find(
        (c) => c.id === "farcaster" || c.name.toLowerCase().includes("farcaster") || c.id.includes("miniapp"),
      )

      if (!farcasterConnector) {
        const firstConnector = connectors[0]
        if (!firstConnector) {
          throw new Error("No connectors available")
        }
        console.log("[v0] Using fallback connector:", firstConnector.id, firstConnector.name)
        await connect({ connector: firstConnector })
      } else {
        console.log("[v0] Using Farcaster connector:", farcasterConnector.id, farcasterConnector.name)
        await connect({ connector: farcasterConnector })
      }
    } catch (error) {
      console.error("[v0] Manual connect failed:", error)
      setConnectionError(error instanceof Error ? error.message : "Connection failed")
      setHasAttemptedConnect(false)
    }
  }

  const handleDisconnect = () => {
    console.log("[v0] Manual disconnect triggered")
    setHasAttemptedConnect(false)
    setConnectionError(null)
    disconnect()
  }

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
      {status === "connected" && address ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={context?.user.pfp_url || "/placeholder.svg"} alt={context?.user.username || "User"} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">@{context?.user.username || "Connected"}</span>
              <span className="text-xs text-muted-foreground">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          </div>
          <Button onClick={handleDisconnect} variant="outline" size="sm" className="text-xs bg-transparent">
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full">
          <Button
            onClick={handleManualConnect}
            className="flex items-center gap-2 w-full"
            size="lg"
            disabled={status === "connecting"}
          >
            <Wallet className="h-4 w-4" />
            {status === "connecting" ? "Connecting..." : "Connect Farcaster"}
          </Button>
          {connectionError && <p className="text-xs text-red-500 text-center">{connectionError}</p>}
        </div>
      )}
    </div>
  )
}
