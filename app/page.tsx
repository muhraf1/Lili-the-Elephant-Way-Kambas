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

  const { executions, getStepStatus, getCurrentStep, refetchHistory, loading: historyLoading } = useExecutionHistory()
  const { refetchData, crowdfundData } = useTrailData()

  console.log("[v0] App - wallet status:", status, "address:", address)
  console.log("[v0] App - executions:", executions)
  console.log("[v0] App - current step:", getCurrentStep())

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
    if (!historyLoading && address) {
      const newCollapsedSteps: Record<number, boolean> = {}
      for (let i = 1; i <= 3; i++) {
        const stepStatus = getStepStatus(i)
        if (stepStatus.status === "completed") {
          newCollapsedSteps[i] = true
        }
      }
      setCollapsedSteps(newCollapsedSteps)
    }
  }, [historyLoading, address, getStepStatus])

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

  const getStepStatusForUI = (stepNumber: number) => {
    if (!address) return "disabled"

    const stepStatus = getStepStatus(stepNumber)
    console.log(`[v0] Step ${stepNumber} status:`, stepStatus)

    return stepStatus.status
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-green-200 dark:border-green-800">
        <div className="container mx-auto px-4 py-3 max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🐘</div>
              <div>
                <h1 className="text-lg font-bold text-green-800 dark:text-green-200">Save Lili</h1>
                <p className="text-xs text-green-600 dark:text-green-400">Way Kambas Park</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <FarcasterConnect />
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-md">
        {status === "connected" ? (
          <Tabs defaultValue="donate" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="donate">Donate</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="donate" className="space-y-6">
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">Campaign Preview</h2>
                <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                  Help save Lili and support elephant conservation at Way Kambas National Park. Every donation makes a
                  difference in protecting these magnificent creatures.
                </p>
              </div>

              {/* Crowdfund Progress */}
              <CrowdfundProgress />

              {/* Step Components */}
              <div className="space-y-4">
                <ApproveStep
                  status={getStepStatusForUI(1)}
                  isCollapsed={collapsedSteps[1]}
                  onToggleCollapse={() => toggleStepCollapse(1)}
                  onAmountChange={setApprovedAmount}
                  defaultAmount={approvedAmount}
                  onTransactionSuccess={handleTransactionSuccess}
                />

                <DonateStep
                  status={getStepStatusForUI(2)}
                  isCollapsed={collapsedSteps[2]}
                  onToggleCollapse={() => toggleStepCollapse(2)}
                  approvedAmount={approvedAmount}
                  onTransactionSuccess={handleTransactionSuccess}
                />

                <RefundStep
                  status={getStepStatusForUI(3)}
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
          <Tabs defaultValue="community" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="donate" disabled>Donate</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>
            
            <TabsContent value="community" className="space-y-6">
              {/* Step Statistics */}
              <StepStats />
              
              {/* Community Feed */}
              <CommunityFeed />
              
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  {status === "connecting"
                    ? "Connecting to Farcaster..."
                    : "Connect your Farcaster wallet to start donating"}
                </p>
              </div>
            </TabsContent>
          </Tabs>
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
