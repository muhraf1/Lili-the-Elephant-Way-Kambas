"use client"

import { useState, useCallback } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { StepCard } from "./StepCard"
import { useTrailData } from "@/hooks/useTrailData"
import { useTrailTransaction } from "@/hooks/useTrailTransaction"
import { TrailUtils } from "@/lib/trail-api"

// Trail API documentation: https://trails-api.herd.eco/v1/trails/0198e00e-de57-7daf-81b9-133db5520147/versions/0198e00e-de63-7f79-be98-81b08e0a355c/guidebook.txt?trailAppId=0198a42e-6183-745a-abca-cb89fd695d50

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
    // Allow decimal USDC values (up to 6 decimal places for USDC precision)
    if (value === "" || /^\d*(\.\d{0,6})?$/.test(value)) {
      setAmount(value)
      onAmountChange?.(value)
    }
  }, [onAmountChange])

  const handleSubmit = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) return

    try {
      // Send formatted USDC value (e.g., "0.01") - backend handles decimals conversion
      const formattedAmount = amount.toString()
      console.log(`[ApproveStep] Sending formatted USDC amount: ${formattedAmount} (backend handles decimal conversion)`)
      await executeStep(1, formattedAmount)
    } catch (err) {
      console.error("[ApproveStep] Approve step failed:", err)
    }
  }

  // Convert raw USDC balance to formatted decimal
  const getRawBalance = () => {
    if (userData?.usdcBalance) return userData.usdcBalance
    if (userData?.formattedUSDCBalance) return userData.formattedUSDCBalance
    return "0"
  }

  const rawBalance = getRawBalance()
  // Convert raw balance (e.g., 1000000) to formatted USDC (e.g., "1.000000")
  const maxBalance = rawBalance && !isNaN(Number(rawBalance))
    ? (Number(rawBalance) / 1e6).toFixed(6)
    : "0.000000"

  console.log(`[ApproveStep] Raw balance: ${rawBalance}, Formatted USDC: ${maxBalance}`)

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
              placeholder="0.01"
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
                Approving: {amount} USDC
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
            Enter USDC amount in decimal format (e.g., 0.01 for 1 cent). 
            This allows the crowdfund contract to transfer USDC from your wallet when you donate.
          </p>
        </div>
      </div>
    </StepCard>
  )
}