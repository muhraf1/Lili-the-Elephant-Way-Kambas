"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Badge } from "./ui/badge"
import { Calendar, Users } from "lucide-react"
import { useTrailData } from "@/hooks/useTrailData"

export function CrowdfundProgress() {
  const { crowdfundData, donorsCount, loading } = useTrailData()

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="flex gap-4">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 bg-muted rounded w-20"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!crowdfundData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Failed to load crowdfund data</p>
        </CardContent>
      </Card>
    )
  }

  const { formattedGoal, formattedTotalRaised, formattedEndDate, progressPercentage, isEnded, isGoalReached } =
    crowdfundData

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Crowdfund Progress</CardTitle>
          <Badge variant={isEnded ? (isGoalReached ? "default" : "destructive") : "secondary"}>
            {isEnded ? (isGoalReached ? "Success" : "Failed") : "Active"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Raised</span>
            <span className="font-medium">
              {formattedTotalRaised} / {formattedGoal} USDC
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{progressPercentage.toFixed(1)}% of goal reached</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{donorsCount} donors</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">{isEnded ? "Ended" : "Ends"}</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>{formattedEndDate}</p>
        </div>

        {isEnded && !isGoalReached && (
          <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
            <p className="text-sm text-orange-700 dark:text-orange-300">Goal not reached. Donors can claim refunds.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
