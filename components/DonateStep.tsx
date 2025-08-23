"use client"

import { useState } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { StepCard } from "./StepCard"
import { ElephantCelebration } from "./ElephantCelebration"
import { useTrailData } from "@/hooks/useTrailData"
import { useTrailTransaction } from "@/hooks/useTrailTransaction"
import { TrailUtils } from "@/lib/trail-api"
import { useAccount } from "wagmi"

interface DonateStepProps {
  status: "pending" | "active" | "completed" | "disabled"
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  approvedAmount?: string
  onTransactionSuccess?: () => void
}

export function DonateStep({
  status,
  isCollapsed,
  onToggleCollapse,
  approvedAmount,
  onTransactionSuccess,
}: DonateStepProps) {
  const [amount, setAmount] = useState("")
  const [showCelebration, setShowCelebration] = useState(false)
  const { address } = useAccount()

  const MIN_DONATION_AMOUNT = 0.0001

  const { userData, crowdfundData, loading } = useTrailData()

  console.log("[v0] DonateStep - status:", status)
  console.log("[v0] DonateStep - userData:", userData)
  console.log("[v0] DonateStep - approvedAmount:", approvedAmount)
  console.log("[v0] DonateStep - address:", address)

  const handleTransactionSuccess = () => {
    setShowCelebration(true)
    onTransactionSuccess?.()
  }

  const { executeStep, isProcessing, error } = useTrailTransaction(handleTransactionSuccess)

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (!/^\d*\.?\d*$/.test(value)) return
    setAmount(value)
  }

  const handleSubmit = async () => {
    if (!amount || Number.parseFloat(amount) < MIN_DONATION_AMOUNT) return

    try {
      // Convert to raw amount (multiply by 10^6 for USDC)
      const rawAmount = TrailUtils.parseTokenAmount(amount, 6)
      await executeStep(2, rawAmount)
    } catch (err) {
      console.error("[v0] Donate step failed:", err)
    }
  }

  const handleCelebrationComplete = () => {
    setShowCelebration(false)
    setAmount("") // Clear the amount after successful donation
  }

  const maxAmount = approvedAmount || userData?.formattedUSDCBalance || "0"
  const isValidAmount =
    amount &&
    Number.parseFloat(amount) >= MIN_DONATION_AMOUNT &&
    Number.parseFloat(amount) <= Number.parseFloat(maxAmount)
  const isCrowdfundEnded = crowdfundData?.isEnded || false

  const getBalanceText = () => {
    if (!address) return "Connect wallet to see balance"
    if (loading) return "Loading balance..."
    if (approvedAmount) return `Approved: ${approvedAmount} USDC`
    if (userData?.formattedUSDCBalance) return `Balance: ${userData.formattedUSDCBalance} USDC`
    return "Balance: 0 USDC"
  }

  return (
    <>
      <StepCard
        stepNumber={2}
        title="Donate to Crowdfund"
        description="Make your donation to help save elephants"
        status={status}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        error={error?.message}
      >
        <div className="space-y-4">
          {isCrowdfundEnded && (
            <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                This crowdfund has ended. No new donations can be made.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="donate-amount">Donation amount (USDC)</Label>
            <Input
              id="donate-amount"
              type="text"
              placeholder={`${MIN_DONATION_AMOUNT} minimum`}
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              disabled={status === "disabled" || isProcessing || isCrowdfundEnded}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">{getBalanceText()}</p>
          </div>

          {amount && !isValidAmount && (
            <p className="text-sm text-destructive">
              {Number.parseFloat(amount) < MIN_DONATION_AMOUNT
                ? `Minimum donation amount is ${MIN_DONATION_AMOUNT} USDC`
                : `Amount exceeds your ${approvedAmount ? "approved" : "available"} balance`}
            </p>
          )}

          {userData?.hasDonated && (
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                You have already donated {userData.formattedDonationAmount} USDC to this crowdfund.
              </p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!isValidAmount || status === "disabled" || isProcessing || isCrowdfundEnded}
            className="w-full"
            size="lg"
          >
            {isProcessing ? "Donating..." : status === "completed" ? "Donate More" : "Donate to Save Elephants"}
          </Button>

          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              Your donation will directly support elephant conservation at Way Kambas National Park.
            </p>
          </div>
        </div>
      </StepCard>

      <ElephantCelebration isVisible={showCelebration} onComplete={handleCelebrationComplete} />
    </>
  )
}
