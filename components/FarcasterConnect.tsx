"use client"

import { useEffect, useState } from "react"
import { Wallet, User } from "lucide-react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

export function FarcasterConnect() {
  const { address, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [connectionError, setConnectionError] = useState<string | null>(null)

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
  }, [status, address])

  const handleManualConnect = async () => {
    try {
      console.log("[v0] Manual connect triggered")
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
    }
  }

  const handleDisconnect = () => {
    console.log("[v0] Manual disconnect triggered")
    setConnectionError(null)
    disconnect()
  }

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
      {status === "connected" && address ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg" alt="User" />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">Connected</span>
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
