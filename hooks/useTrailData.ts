"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { TrailReadAPI, TrailUtils } from "@/lib/trail-api"

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
  const { address } = useAccount()
  const [crowdfundData, setCrowdfundData] = useState<CrowdfundData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [donorsCount, setDonorsCount] = useState<string>("0")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCrowdfundData = async () => {
    try {
      console.log("[v0] Fetching crowdfund data...")
      const response = await TrailReadAPI.getCrowdfundDetails()

      if (response.outputs) {
        const outputs = response.outputs as any
        const goal = outputs.goal?.value || "0"
        const totalRaised = outputs.totalRaised?.value || "0"
        const endTimestamp = outputs.endTimestamp?.value || "0"

        const isEnded = TrailUtils.isCrowdfundEnded(endTimestamp)
        const isGoalReached = TrailUtils.isGoalReached(totalRaised, goal)
        const progressPercentage =
          goal !== "0" ? Math.min((Number.parseInt(totalRaised) / Number.parseInt(goal)) * 100, 100) : 0

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
          formattedEndDate: TrailUtils.formatDate(endTimestamp),
          progressPercentage,
        })
      }
    } catch (err) {
      console.error("[v0] Failed to fetch crowdfund data:", err)
      setError("Failed to load crowdfund data")
    }
  }

  const fetchUserData = async () => {
    if (!address) return

    try {
      console.log("[v0] Fetching user data for:", address)

      // Fetch user's USDC balance
      const balanceResponse = await TrailReadAPI.getUserUSDCBalance(address)
      const balance = balanceResponse.outputs?.[0]?.value || "0"

      // Fetch user's donation amount
      const donationResponse = await TrailReadAPI.getUserDonation(address)
      const donationAmount = donationResponse.outputs?.[0]?.value || "0"

      setUserData({
        usdcBalance: balance,
        donationAmount,
        formattedUSDCBalance: TrailUtils.formatTokenAmount(balance),
        formattedDonationAmount: TrailUtils.formatTokenAmount(donationAmount),
        hasDonated: BigInt(donationAmount) > 0n,
      })
    } catch (err) {
      console.error("[v0] Failed to fetch user data:", err)
      setError("Failed to load user data")
    }
  }

  const fetchDonorsCount = async () => {
    try {
      console.log("[v0] Fetching donors count...")
      const response = await TrailReadAPI.getDonorsCount()
      const count = response.outputs?.[0]?.value || "0"
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
  }, [address])

  return {
    crowdfundData,
    userData,
    donorsCount,
    loading,
    error,
    refetchData,
  }
}
