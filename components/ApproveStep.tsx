"use client"

import { useState, useCallback } from "react"
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

  // Debug: Log userData to inspect balance
  console.log("[ApproveStep] userData:", userData, "loading:", loading)

  const handleAmountChange = useCallback((value: string) => {
    // Allow empty input, integers, or decimals with up to 6 digits
    if (value === "" || /^\d*(\.\d{0,6})?$/.test(value)) {
      setAmount(value)
      onAmountChange?.(value)
    }
  }, [onAmountChange])

  const handleSubmit = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) return

    try {
      const rawAmount = TrailUtils.parseTokenAmount(amount, 6)
      await executeStep(1, rawAmount)
    } catch (err) {
      console.error("[v0] Approve step failed:", err)
    }
  }

  // Convert raw USDC balance (base units) to decimal form
  const maxBalance = userData?.formattedUSDCBalance && !isNaN(Number(userData.formattedUSDCBalance))
    ? (Number(userData.formattedUSDCBalance) / 1e6).toFixed(4)
    : "0.0000"


  // Validate amount
  const parsedAmount = amount ? Number.parseFloat(amount) : 0
  const parsedMaxBalance = Number.parseFloat(maxBalance)
  const isValidAmount =
    amount !== "" &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0.00 &&
    parsedAmount <= parsedMaxBalance &&
    /^\d*(\.\d{1,6})?$/.test(amount)

  // Debug: Log validation details
  console.log("[ApproveStep] Validation:", {
    amount,
    parsedAmount,
    maxBalance,
    parsedMaxBalance,
    rawBalance: userData?.formattedUSDCBalance,
    isValidAmount,
  })

  // Error message for invalid amount
  const getErrorMessage = () => {
    if (amount === "") return null
    if (!/^\d*(\.\d{1,6})?$/.test(amount)) return "Please enter a valid number (up to 6 decimals)"
    if (parsedAmount <= 0) return "Amount must be greater than 0"
    if (parsedAmount > parsedMaxBalance) return `Amount exceeds your USDC balance (${maxBalance} USDC)`
    return null
  }


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
            // disabled={status === "disabled" || isProcessing}
            className="mt-1"
          />
          <p className="text-sm font-semibold text-foreground mt-2">
            Wallet Balance: {loading ? "Loading..." : userData?.formattedUSDCBalance ? `${maxBalance} USDC` : "Not Found USDC"}
          </p>
        </div>

        {amount && getErrorMessage() && (
          <p className="text-sm text-destructive">{getErrorMessage()}</p>
        )}

        <Button
          onClick={handleSubmit}
          // disabled={!isValidAmount || status === "disabled" || isProcessing}
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
