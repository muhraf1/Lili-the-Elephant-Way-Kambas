"use client"

import { Button } from "./ui/button"
import { StepCard } from "./StepCard"
import { useTrailData } from "@/hooks/useTrailData"
import { useTrailTransaction } from "@/hooks/useTrailTransaction"

interface RefundStepProps {
  status: "pending" | "active" | "completed" | "disabled"
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onTransactionSuccess?: () => void
}

export function RefundStep({ status, isCollapsed, onToggleCollapse, onTransactionSuccess }: RefundStepProps) {
  const { userData, crowdfundData } = useTrailData()
  const { executeStep, isProcessing, error } = useTrailTransaction(onTransactionSuccess)

  const handleSubmit = async () => {
    try {
      await executeStep(3) // No amount needed for refund
    } catch (err) {
      console.error("[v0] Refund step failed:", err)
    }
  }

  const canClaimRefund =
    crowdfundData?.isEnded && !crowdfundData?.isGoalReached && userData?.hasDonated && !crowdfundData?.fundsClaimed

  const getRefundMessage = () => {
    if (!crowdfundData?.isEnded) {
      return "Refunds are only available after the crowdfund ends."
    }
    if (crowdfundData?.isGoalReached) {
      return "The crowdfund was successful. Refunds are not available."
    }
    if (!userData?.hasDonated) {
      return "You haven't made any donations to this crowdfund."
    }
    if (crowdfundData?.fundsClaimed || status === "completed") {
      return "You have already claimed your refund."
    }
    return "You can claim a refund for your donation."
  }

  return (
    <StepCard
      stepNumber={3}
      title="Claim Refund"
      description="Get your money back if the goal was not reached"
      status={status}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      error={error?.message}
    >
      <div className="space-y-4">
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm">{getRefundMessage()}</p>
        </div>

        {userData?.hasDonated && (
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your donation: {userData.formattedDonationAmount} USDC
            </p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!canClaimRefund || status === "disabled" || isProcessing}
          className="w-full"
          size="lg"
          variant={canClaimRefund ? "default" : "secondary"}
        >
          {isProcessing ? "Claiming Refund..." : status === "completed" ? "Refund Claimed" : "Claim Refund"}
        </Button>

        {canClaimRefund && (
          <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Since the crowdfund goal was not reached, you can get your full donation back.
            </p>
          </div>
        )}
      </div>
    </StepCard>
  )
}
