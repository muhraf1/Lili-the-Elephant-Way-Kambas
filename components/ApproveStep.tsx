"use client"

import { useState } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { StepCard } from "./StepCard"
import { useTrailData } from "@/hooks/useTrailData"
import { useTrailTransaction } from "@/hooks/useTrailTransaction"
import { TrailUtils } from "@/lib/trail-api"

interface ApproveStepProps {
  status: "pending" | "active" | "completed" | "disabled"
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onAmountChange?: (amount: string) => void
  defaultAmount?: string
  onTransactionSuccess?: () => void
}

export function ApproveStep({
  status,
  isCollapsed,
  onToggleCollapse,
  onAmountChange,
  defaultAmount,
  onTransactionSuccess,
}: ApproveStepProps) {
  const [amount, setAmount] = useState(defaultAmount || "")
  const { userData, loading } = useTrailData()
  const { executeStep, isProcessing, error } = useTrailTransaction(onTransactionSuccess)

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (!/^\d*\.?\d*$/.test(value)) return

    setAmount(value)
    onAmountChange?.(value)
  }

  const handleSubmit = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) return

    try {
      // Convert to raw amount (multiply by 10^6 for USDC)
      const rawAmount = TrailUtils.parseTokenAmount(amount, 6)
      await executeStep(1, rawAmount)
    } catch (err) {
      console.error("[v0] Approve step failed:", err)
    }
  }

  const maxBalance = userData?.formattedUSDCBalance || "0"
  const isValidAmount =
    amount && Number.parseFloat(amount) > 0 && Number.parseFloat(amount) <= Number.parseFloat(maxBalance)

  return (
    <StepCard
      stepNumber={1}
      title="Approve USDC"
      description="Allow the crowdfund contract to spend your USDC"
      status={status}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      error={error?.message}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="approve-amount">Amount to approve (USDC)</Label>
          <Input
            id="approve-amount"
            type="text"
            placeholder="0.00"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            disabled={status === "disabled" || isProcessing}
            className="mt-1"
          />
          {userData && (
            <p className="text-xs text-muted-foreground mt-1">
              Balance: {loading ? "Loading..." : `${maxBalance} USDC`}
            </p>
          )}
        </div>

        {amount && !isValidAmount && (
          <p className="text-sm text-destructive">
            {Number.parseFloat(amount) <= 0 ? "Amount must be greater than 0" : "Amount exceeds your USDC balance"}
          </p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!isValidAmount || status === "disabled" || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? "Approving..." : status === "completed" ? "Re-approve USDC" : "Approve USDC"}
        </Button>

        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            This allows the crowdfund contract to transfer USDC from your wallet when you donate.
          </p>
        </div>
      </div>
    </StepCard>
  )
}
