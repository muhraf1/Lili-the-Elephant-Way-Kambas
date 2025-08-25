"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { TrailReadAPI, TrailUtils, TrailAPI } from "@/lib/trail-api"
import { useCommunityData } from "./useCommunityData"

export interface CrowdfundData {
  goal: string
  totalRaised: string
  endTimestamp: string
  creator: string
  fundsClaimed: boolean
  cancelled: boolean
  isEnded: boolean
  isGoalReached: boolean
  formattedGoal: string
  formattedTotalRaised: string
  formattedEndDate: string
  progressPercentage: number
}

export interface UserData {
  usdcBalance: string
  donationAmount: string
  formattedUSDCBalance: string
  formattedDonationAmount: string
  hasDonated: boolean
}

export function useTrailData() {
  const { address, status } = useAccount()
  const [crowdfundData, setCrowdfundData] = useState<CrowdfundData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [donorsCount, setDonorsCount] = useState<string>("0")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCrowdfundData = async () => {
    try {
      console.log("[v0] Fetching crowdfund data...")
      const response: any = await TrailReadAPI.getCrowdfundDetails()

      console.log("[v0] Crowdfund API response:", response)

      if (response.outputs) {
        const outputs = response.outputs as any
        const goal = outputs.goal?.value || "0"
        const totalRaised = outputs.totalRaised?.value || "0"
        const endTimestamp = outputs.endTimestamp?.value || "0"

        console.log("[v0] Parsed values - goal:", goal, "totalRaised:", totalRaised, "endTimestamp:", endTimestamp)

        const isEnded = TrailUtils.isCrowdfundEnded(endTimestamp)
        const isGoalReached = TrailUtils.isGoalReached(totalRaised, goal)
        const progressPercentage =
          goal !== "0" ? Math.min((Number.parseInt(totalRaised) / Number.parseInt(goal)) * 100, 100) : 0

        const formattedEndDate = TrailUtils.formatDate(endTimestamp)
        console.log("[v0] Formatted end date:", formattedEndDate)

        setCrowdfundData({
          goal,
          totalRaised,
          endTimestamp,
          creator: outputs.creator?.value || "",
          fundsClaimed: outputs.fundsClaimed?.value || false,
          cancelled: outputs.cancelled?.value || false,
          isEnded,
          isGoalReached,
          formattedGoal: TrailUtils.formatTokenAmount(goal),
          formattedTotalRaised: TrailUtils.formatTokenAmount(totalRaised),
          formattedEndDate,
          progressPercentage,
        })
      }
    } catch (err) {
      console.error("[v0] Failed to fetch crowdfund data:", err)
      setError("Failed to load crowdfund data")
    }
  }

  const extractOutputValue = (outputs: any): string => {
    if (!outputs) return "0"
    if (Array.isArray(outputs)) {
      const first = outputs[0]
      if (first && typeof first === "object" && first.value != null) return String(first.value)
    }
    if (typeof outputs === "object") {
      for (const key of Object.keys(outputs)) {
        const node = (outputs as any)[key]
        if (node && typeof node === "object" && node.value != null) {
          return String(node.value)
        }
      }
    }
    return "0"
  }

  const fetchUserData = async () => {
    if (!address) {
      console.log("[v0] No wallet address, skipping user data fetch")
      return
    }

    if (status !== "connected") {
      console.log("[v0] Wallet not connected, skipping user data fetch. Status:", status)
      return
    }

    try {
      console.log("[v0] Fetching user data for:", address)

      // Fetch user's USDC balance
      const balanceResponse: any = await TrailReadAPI.getUserUSDCBalance(address)
      const balance = extractOutputValue(balanceResponse.outputs)
      console.log("[v0] User USDC balance raw:", balance)

      // Fetch user's donation amount
      const donationResponse: any = await TrailReadAPI.getUserDonation(address)
      const donationAmount = extractOutputValue(donationResponse.outputs)
      console.log("[v0] User donation amount:", donationAmount)

      const formattedBalance = TrailUtils.formatTokenAmount(balance, 6, 4)
      console.log("[v0] Formatted USDC balance:", formattedBalance)

      setUserData({
        usdcBalance: balance,
        donationAmount,
        formattedUSDCBalance: formattedBalance,
        formattedDonationAmount: TrailUtils.formatTokenAmount(donationAmount),
        hasDonated: BigInt(donationAmount || "0") > BigInt(0),
      })
    } catch (err) {
      console.error("[v0] Failed to fetch user data:", err)
      setError("Failed to load user data")
    }
  }

  const fetchDonorsCount = async () => {
    try {
      console.log("[v0] Fetching donors count via executions API...")
      const execs: any = await TrailAPI.queryExecutions({ walletAddresses: [] })
      const uniqueWallets = new Set<string>()
      for (const exec of execs.walletExecutions || []) {
        if (exec.walletAddress) uniqueWallets.add(exec.walletAddress.toLowerCase())
      }
      const count = String(uniqueWallets.size)
      console.log("[v0] Donors count derived:", count)
      setDonorsCount(count)
    } catch (err) {
      console.error("[v0] Failed to fetch donors count:", err)
    }
  }

  const refetchData = async () => {
    setLoading(true)
    setError(null)

    await Promise.all([fetchCrowdfundData(), fetchUserData(), fetchDonorsCount()])

    setLoading(false)
  }

  useEffect(() => {
    refetchData()
  }, [address, status]) // Added status dependency to refetch when wallet connects

  return {
    crowdfundData,
    userData,
    donorsCount,
    loading,
    error,
    refetchData,
  }
}
