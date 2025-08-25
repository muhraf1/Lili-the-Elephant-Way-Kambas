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
    // Allow empty input, integers, or decimals with up to 6 digits (USDC has 6 decimals)
    if (value === "" || /^\d*(\.\d{0,6})?$/.test(value)) {
      setAmount(value)
      onAmountChange?.(value)
    }
  }, [onAmountChange])

  const handleSubmit = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) return

    try {
      // Convert the amount to raw token units (multiply by 10^6)
      const numericAmount = Number(amount) * 1e6
      const rawAmount = Math.floor(numericAmount).toString()
      console.log(`[ApproveStep] Converting ${amount} USDC to ${rawAmount} raw units`)
      await executeStep(1, rawAmount)
    } catch (err) {
      console.error("[ApproveStep] Approve step failed:", err)
    }
  }

  // Fix: Convert raw USDC balance correctly
  // Check different possible balance field names and convert properly
  const getRawBalance = () => {
    if (userData?.usdcBalance) return userData.usdcBalance
    if (userData?.formattedUSDCBalance) return userData.formattedUSDCBalance
    return "0"
  }

  const rawBalance = getRawBalance()
  const maxBalance = rawBalance && !isNaN(Number(rawBalance))
    ? (Number(rawBalance) / 1e6).toFixed(6)
    : "0.000000"

  console.log(`[ApproveStep] Raw balance: ${rawBalance}, Formatted: ${maxBalance}`)

  // Validate amount
  const parsedAmount = amount ? Number.parseFloat(amount) : 0
  const parsedMaxBalance = Number.parseFloat(maxBalance)
  const isValidAmount =
    amount !== "" &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= parsedMaxBalance &&
    /^\d*(\.\d{0,6})?$/.test(amount)

  // Error message for invalid amount
  const getErrorMessage = () => {
    if (amount === "") return null
    if (!/^\d*(\.\d{0,6})?$/.test(amount)) return "Please enter a valid number (up to 6 decimals)"
    if (parsedAmount <= 0) return "Amount must be greater than 0"
    if (parsedAmount > parsedMaxBalance) return `Amount exceeds your USDC balance (${maxBalance} USDC)`
    return null
  }

  const setMaxAmount = () => {
    setAmount(maxBalance)
    onAmountChange?.(maxBalance)
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
          <div className="relative mt-1">
            <Input
              id="approve-amount"
              type="text"
              placeholder="0.000000"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              disabled={status === "disabled" || isProcessing}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2 text-xs"
              onClick={setMaxAmount}
              disabled={status === "disabled" || isProcessing}
            >
              MAX
            </Button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm font-semibold text-foreground">
              Wallet Balance: {loading ? "Loading..." : `${maxBalance} USDC`}
            </p>
            {amount && (
              <p className="text-xs text-muted-foreground">
                Raw units: {Math.floor(Number(amount || 0) * 1e6)}
              </p>
            )}
          </div>
        </div>

        {amount && getErrorMessage() && (
          <p className="text-sm text-destructive">{getErrorMessage()}</p>
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
            You can approve any amount up to your balance.
          </p>
        </div>
      </div>
    </StepCard>
  )
}