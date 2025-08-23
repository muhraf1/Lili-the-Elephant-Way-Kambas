"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { BarChart3, TrendingUp } from "lucide-react"
import { useCommunityData } from "@/hooks/useCommunityData"

export function StepStats() {
  const { communityData, loading } = useCommunityData()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Step Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!communityData?.totals.stepStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Step Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">No step data available</p>
        </CardContent>
      </Card>
    )
  }

  const stepStats = communityData.totals.stepStats

  const getStepName = (stepNumber: string) => {
    switch (stepNumber) {
      case "1":
        return "USDC Approvals"
      case "2":
        return "Donations"
      case "3":
        return "Refund Claims"
      default:
        return `Step ${stepNumber}`
    }
  }

  const getStepIcon = (stepNumber: string) => {
    switch (stepNumber) {
      case "1":
        return "🔓"
      case "2":
        return "💝"
      case "3":
        return "💰"
      default:
        return "📊"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Step Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(stepStats).map(([stepNumber, stats]) => (
          <div key={stepNumber} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">{getStepIcon(stepNumber)}</span>
              <div>
                <div className="font-medium text-sm">{getStepName(stepNumber)}</div>
                <div className="text-xs text-muted-foreground">{stats.wallets} users completed</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{stats.transactions}</div>
              <div className="text-xs text-muted-foreground">transactions</div>
            </div>
          </div>
        ))}

        {Object.keys(stepStats).length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No step statistics yet</p>
            <p className="text-xs">Statistics will appear as users complete steps</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
