"use client"

import { useState, useEffect } from "react"
import { TrailAPI } from "@/lib/trail-api"

export interface CommunityTransaction {
  walletAddress: string
  txHash: string
  blockTimestamp: number
  blockNumber: number
  latestExecutionId: string
  farcasterData?: {
    username: string
    pfp_url: string
    display_name: string
    fid: string
    bio: string
  } | null
}

export interface StepStats {
  wallets: string
  transactions: string
  transactionHashes: CommunityTransaction[]
}

export interface CommunityData {
  totals: {
    transactions: string
    wallets: string
    stepStats: Record<string, StepStats>
  }
  walletExecutions: any[]
}

export function useCommunityData() {
  const [communityData, setCommunityData] = useState<CommunityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCommunityData = async () => {
    try {
      console.log("[v0] Fetching community execution data...")
      const response = await TrailAPI.queryExecutions({
        walletAddresses: [], // Empty array to get all wallets
      })

      setCommunityData(response as CommunityData)
      console.log("[v0] Community data loaded:", response)
    } catch (err) {
      console.error("[v0] Failed to fetch community data:", err)
      setError("Failed to load community data")
    } finally {
      setLoading(false)
    }
  }

  const refetchCommunityData = () => {
    setLoading(true)
    setError(null)
    fetchCommunityData()
  }

  useEffect(() => {
    fetchCommunityData()

    // Refresh community data every 30 seconds
    const interval = setInterval(fetchCommunityData, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    communityData,
    loading,
    error,
    refetchCommunityData,
  }
}
