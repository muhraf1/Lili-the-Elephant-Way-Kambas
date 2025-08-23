"use client"

import { useState, useEffect } from "react"
import { Web3Provider } from "@/components/Web3Provider"
import { FarcasterConnect } from "@/components/FarcasterConnect"
import { CrowdfundProgress } from "@/components/CrowdfundProgress"
import { ApproveStep } from "@/components/ApproveStep"
import { DonateStep } from "@/components/DonateStep"
import { RefundStep } from "@/components/RefundStep"
import { CommunityFeed } from "@/components/CommunityFeed"
import { ExecutionHistory } from "@/components/ExecutionHistory"
import { StepStats } from "@/components/StepStats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sdk } from "@farcaster/miniapp-sdk"
import { useAccount } from "wagmi"
import { useExecutionHistory } from "@/hooks/useExecutionHistory"
import { useTrailData } from "@/hooks/useTrailData"

// AppContent must be inside Web3Provider to use wagmi hooks
const AppContent = () => {
  const [isAppReady, setIsAppReady] = useState(false)
  const [collapsedSteps, setCollapsedSteps] = useState<Record<number, boolean>>({})
  const [approvedAmount, setApprovedAmount] = useState<string>("")
  const { address, status } = useAccount()

  const { executions, refetchHistory, loading: historyLoading } = useExecutionHistory()
  const { refetchData } = useTrailData()

  // Call sdk.actions.ready() when app is ready
  useEffect(() => {
    if (!isAppReady) {
      const markAppReady = async () => {
        try {
          await sdk.actions.ready()
          setIsAppReady(true)
          console.log("[v0] App marked as ready!")
        } catch (error) {
          console.error("[v0] Failed to mark app as ready:", error)
          setIsAppReady(true) // Still mark as ready to prevent infinite loading
        }
      }

      // Small delay to ensure UI is rendered
      const timer = setTimeout(() => {
        markAppReady()
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isAppReady])

  useEffect(() => {
    if (!historyLoading) {
      const newCollapsedSteps: Record<number, boolean> = {}
      for (let i = 1; i <= 3; i++) {
        const stepStatus = executions.find((execution) => execution.step === i)?.status
        if (stepStatus === "completed") {
          newCollapsedSteps[i] = true
        }
      }
      setCollapsedSteps(newCollapsedSteps)
    }
  }, [historyLoading, executions])

  const toggleStepCollapse = (stepNumber: number) => {
    setCollapsedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }))
  }

  const handleTransactionSuccess = () => {
    refetchHistory()
    refetchData()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐘</div>
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">Save Lili the Elephant</h1>
          <p className="text-sm text-green-600 dark:text-green-400">Support Way Kambas National Park</p>
        </div>

        {/* Wallet Connection */}
        <div className="mb-6">
          <FarcasterConnect />
        </div>

        {status === "connected" ? (
          <Tabs defaultValue="donate" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="donate">Donate</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="donate" className="space-y-6">
              {/* Crowdfund Progress */}
              <CrowdfundProgress />

              {/* Step Components */}
              <div className="space-y-4">
                <ApproveStep
                  status={executions.find((execution) => execution.step === 1)?.status || "pending"}
                  isCollapsed={collapsedSteps[1]}
                  onToggleCollapse={() => toggleStepCollapse(1)}
                  onAmountChange={setApprovedAmount}
                  defaultAmount={approvedAmount}
                  onTransactionSuccess={handleTransactionSuccess}
                />

                <DonateStep
                  status={executions.find((execution) => execution.step === 2)?.status || "pending"}
                  isCollapsed={collapsedSteps[2]}
                  onToggleCollapse={() => toggleStepCollapse(2)}
                  approvedAmount={approvedAmount}
                  onTransactionSuccess={handleTransactionSuccess}
                />

                <RefundStep
                  status={executions.find((execution) => execution.step === 3)?.status || "pending"}
                  isCollapsed={collapsedSteps[3]}
                  onToggleCollapse={() => toggleStepCollapse(3)}
                  onTransactionSuccess={handleTransactionSuccess}
                />
              </div>

              {/* User's Execution History */}
              <ExecutionHistory />
            </TabsContent>

            <TabsContent value="community" className="space-y-6">
              {/* Step Statistics */}
              <StepStats />

              {/* Community Feed */}
              <CommunityFeed />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {status === "connecting"
                ? "Connecting to Farcaster..."
                : "Connect your Farcaster wallet to start donating"}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">⚡ Powered by Herd</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  )
}
