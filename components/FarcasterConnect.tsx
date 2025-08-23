"use client"

import { useEffect, useState } from "react"
import { Wallet, User } from "lucide-react"
import { useAccount, useConnect } from "wagmi"
import { config } from "./Web3Provider"
import { sdk } from "@farcaster/miniapp-sdk"
import type { Context } from "@farcaster/miniapp-sdk"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

export function FarcasterConnect() {
  const { address, status } = useAccount()
  const { connect } = useConnect()
  const [context, setContext] = useState<Context | null>(null)

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
    if (status === "disconnected") {
      const autoConnect = async () => {
        try {
          console.log("[v0] Attempting auto-connect...")
          connect({ connector: config.connectors[0] })
        } catch (error) {
          console.error("[v0] Auto-connect failed:", error)
        }
      }

      // Small delay to ensure SDK is ready
      const timer = setTimeout(autoConnect, 500)
      return () => clearTimeout(timer)
    }
  }, [status, connect])

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
      {status === "connected" && address ? (
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
      ) : (
        <Button
          onClick={() => connect({ connector: config.connectors[0] })}
          className="flex items-center gap-2 w-full"
          size="lg"
          disabled={status === "connecting"}
        >
          <Wallet className="h-4 w-4" />
          {status === "connecting" ? "Connecting..." : "Connect Farcaster"}
        </Button>
      )}
    </div>
  )
}
