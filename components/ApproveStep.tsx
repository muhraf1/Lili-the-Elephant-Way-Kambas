"use client"

import { useState, useCallback, useEffect } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { StepCard } from "./StepCard"
import { useTrailData } from "@/hooks/useTrailData"
import { useTrailTransaction } from "@/hooks/useTrailTransaction"
import { TrailUtils } from "@/lib/trail-api"
import { useAccount } from "wagmi"

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
  const { userData, loading, refetchData } = useTrailData()
  const { executeStep, isProcessing, error } = useTrailTransaction(onTransactionSuccess)
  const { address } = useAccount()

  // Debug: Log userData to inspect balance
  console.log("[ApproveStep] userData:", userData, "loading:", loading)

  // Fetch wallet balance when component mounts or address changes
  useEffect(() => {
    if (address) {
      refetchData()
    }
  }, [address, refetchData])

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

  // Format USDC balance for display
  const formatUSDCBalance = () => {
    if (!address) return "0.000000"
    if (loading) return "Loading..."
    
    if (!userData?.formattedUSDCBalance) return "0.000000"
    
    // Convert to proper decimal format
    const balanceNum = Number(userData.formattedUSDCBalance) / 1e6
    return balanceNum.toFixed(6)
  }

  // Get the formatted balance
  const maxBalance = formatUSDCBalance()
  const parsedMaxBalance = loading ? 0 : Number.parseFloat(maxBalance === "Loading..." ? "0" : maxBalance)

  // Validate amount
  const parsedAmount = amount ? Number.parseFloat(amount) : 0
  const isValidAmount =
    amount !== "" &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
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
            disabled={status === "disabled" || isProcessing}
            className="mt-1"
          />
          <p className="text-sm font-semibold text-foreground mt-2">
            Wallet Balance: {maxBalance} USDC
          </p>
        </div>

        {amount && getErrorMessage() && (
          <p className="text-sm text-destructive">{getErrorMessage()}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!isValidAmount || status === "disabled" || isProcessing || !address}
          className="w-full"
          size="lg"
        >
          {!address ? "Connect Wallet" : isProcessing ? "Approving..." : status === "completed" ? "Re-approve USDC" : "Approve USDC"}
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
